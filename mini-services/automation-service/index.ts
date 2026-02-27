import { PrismaClient, Complaint, Status, Severity, TaskStatus } from '@prisma/client';
import cron from 'node-cron';
import { io } from 'socket.io-client';

const prisma = new PrismaClient();
const HTTP_PORT = 3002;

// Connect to notification service
const notificationSocket = io('http://localhost:3001');

// Configuration
const SLA_MINUTES = {
  LOW: 60,      // 1 hour for low priority
  MEDIUM: 30,   // 30 minutes for medium priority
  HIGH: 15,     // 15 minutes for high priority
  CRITICAL: 5   // 5 minutes for critical priority
};

const ESCALATION_RULES = {
  1: { delay: 10, action: 'notify_manager' },
  2: { delay: 20, action: 'notify_admin' },
  3: { delay: 30, action: 'auto_escalate' }
};

class AutomationService {
  constructor() {
    this.initializeCronJobs();
    this.setupNotificationListeners();
  }

  private initializeCronJobs() {
    // Check SLA compliance every minute
    cron.schedule('* * * * *', async () => {
      await this.checkSLACompliance();
    });

    // Check for repeat issues every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.detectRepeatIssues();
    });

    // Update priority scores every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      await this.updatePriorityScores();
    });

    // Clean up old data every hour
    cron.schedule('0 * * * *', async () => {
      await this.cleanupOldData();
    });

    // Generate daily reports at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.generateDailyReports();
    });

    console.log('🤖 Automation cron jobs initialized');
  }

  private setupNotificationListeners() {
    notificationSocket.on('connect', () => {
      console.log('🔗 Connected to notification service');
    });

    notificationSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from notification service');
    });
  }

  async checkSLACompliance() {
    try {
      const now = new Date();
      
      // Find all pending and in-progress complaints with SLA deadlines
      const complaints = await prisma.complaint.findMany({
        where: {
          status: {
            in: [Status.PENDING, Status.IN_PROGRESS]
          },
          slaDeadline: {
            lte: now
          }
        },
        include: {
          assignedTo: true,
          train: true,
          station: true
        }
      });

      for (const complaint of complaints) {
        const overdueMinutes = Math.floor((now.getTime() - complaint.slaDeadline!.getTime()) / (1000 * 60));
        
        // Update escalation level based on how overdue it is
        let newEscalationLevel = 1;
        if (overdueMinutes > 30) newEscalationLevel = 3;
        else if (overdueMinutes > 15) newEscalationLevel = 2;

        // Update complaint if escalation level changed
        if (complaint.escalationLevel !== newEscalationLevel) {
          await prisma.complaint.update({
            where: { id: complaint.id },
            data: { escalationLevel: newEscalationLevel }
          });

          // Send escalation notification
          await this.sendEscalationNotification(complaint, newEscalationLevel, overdueMinutes);
        }

        // Send SLA breach warning
        await this.sendSLAWarning(complaint, overdueMinutes);
      }

      if (complaints.length > 0) {
        console.log(`⏰ SLA check: ${complaints.length} complaints overdue`);
      }
    } catch (error) {
      console.error('❌ Error checking SLA compliance:', error);
    }
  }

  async detectRepeatIssues() {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Find complaints from the last 24 hours
      const recentComplaints = await prisma.complaint.findMany({
        where: {
          createdAt: {
            gte: oneDayAgo
          }
        },
        include: {
          train: true,
          coach: true,
          station: true,
          platform: true
        }
      });

      // Group by location to find repeats
      const locationGroups = new Map<string, Complaint[]>();
      
      recentComplaints.forEach(complaint => {
        let locationKey = '';
        
        if (complaint.coachId && complaint.train) {
          locationKey = `train-${complaint.train.trainNumber}-coach-${complaint.coach.coachNumber}`;
        } else if (complaint.platformId && complaint.station) {
          locationKey = `station-${complaint.station.stationCode}-platform-${complaint.platform.platformNumber}`;
        }

        if (locationKey) {
          if (!locationGroups.has(locationKey)) {
            locationGroups.set(locationKey, []);
          }
          locationGroups.get(locationKey)!.push(complaint);
        }
      });

      // Mark repeat issues
      let repeatIssuesCount = 0;
      for (const [location, complaints] of locationGroups) {
        if (complaints.length > 1) {
          // Mark all but the first as repeat issues
          for (let i = 1; i < complaints.length; i++) {
            await prisma.complaint.update({
              where: { id: complaints[i].id },
              data: { isRepeatIssue: true, priorityScore: complaints[i].priorityScore + 10 }
            });
            repeatIssuesCount++;
          }

          // Send notification about repeat issue pattern
          await this.sendRepeatIssueNotification(location, complaints);
        }
      }

      if (repeatIssuesCount > 0) {
        console.log(`🔄 Repeat issue detection: ${repeatIssuesCount} repeat issues found`);
      }
    } catch (error) {
      console.error('❌ Error detecting repeat issues:', error);
    }
  }

  async updatePriorityScores() {
    try {
      const complaints = await prisma.complaint.findMany({
        where: {
          status: {
            in: [Status.PENDING, Status.IN_PROGRESS]
          }
        }
      });

      for (const complaint of complaints) {
        let newScore = 0;

        // Base score by severity
        switch (complaint.severity) {
          case Severity.CRITICAL: newScore += 50; break;
          case Severity.HIGH: newScore += 30; break;
          case Severity.MEDIUM: newScore += 20; break;
          case Severity.LOW: newScore += 10; break;
        }

        // Add score for repeat issues
        if (complaint.isRepeatIssue) {
          newScore += 15;
        }

        // Add score for escalation level
        newScore += complaint.escalationLevel * 10;

        // Add score for time overdue
        if (complaint.slaDeadline && new Date() > complaint.slaDeadline) {
          const overdueMinutes = Math.floor((new Date().getTime() - complaint.slaDeadline.getTime()) / (1000 * 60));
          newScore += Math.min(overdueMinutes, 30); // Cap at 30 points for time
        }

        // Update if score changed
        if (complaint.priorityScore !== newScore) {
          await prisma.complaint.update({
            where: { id: complaint.id },
            data: { priorityScore: newScore }
          });
        }
      }

      console.log('📊 Priority scores updated');
    } catch (error) {
      console.error('❌ Error updating priority scores:', error);
    }
  }

  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Archive old completed complaints
      const archivedCount = await prisma.complaint.updateMany({
        where: {
          status: Status.COMPLETED,
          completedAt: {
            lt: thirtyDaysAgo
          }
        },
        data: {
          // In a real system, you might move to an archive table
          // For now, we'll just log this
        }
      });

      console.log(`🧹 Cleanup: ${archivedCount.count} old complaints processed`);
    } catch (error) {
      console.error('❌ Error cleaning up old data:', error);
    }
  }

  async generateDailyReports() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // Get yesterday's statistics
      const yesterdayStats = await prisma.complaint.groupBy({
        by: ['type', 'status', 'severity'],
        where: {
          createdAt: {
            gte: startOfYesterday,
            lte: endOfYesterday
          }
        },
        _count: {
          id: true
        }
      });

      // Calculate SLA compliance
      const totalComplaints = await prisma.complaint.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lte: endOfYesterday
          }
        }
      });

      const slaCompliant = await prisma.complaint.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lte: endOfYesterday
          },
          completedAt: {
            lte: prisma.complaint.fields.slaDeadline
          }
        }
      });

      const slaComplianceRate = totalComplaints > 0 ? (slaCompliant / totalComplaints) * 100 : 100;

      // Generate report data
      const reportData = {
        date: yesterday.toISOString().split('T')[0],
        totalComplaints,
        slaComplianceRate,
        stats: yesterdayStats
      };

      // Store report (in a real system, you'd save to database or send via email)
      console.log('📊 Daily report generated:', reportData);

      // Send notification about daily report
      notificationSocket.emit('system_notification', {
        title: '📊 Daily Report Available',
        message: `Yesterday's performance: ${totalComplaints} complaints, ${slaComplianceRate.toFixed(1)}% SLA compliance`,
        targetRole: 'admin'
      });

    } catch (error) {
      console.error('❌ Error generating daily reports:', error);
    }
  }

  private async sendEscalationNotification(complaint: any, escalationLevel: number, overdueMinutes: number) {
    const escalationActions = {
      1: 'Notified manager',
      2: 'Notified admin',
      3: 'Auto-escalated to senior management'
    };

    notificationSocket.emit('complaint_escalation', {
      complaintId: complaint.complaintNumber,
      reason: `SLA breach: ${overdueMinutes} minutes overdue`,
      escalationLevel,
      assignedStaffId: complaint.assignedToId
    });

    console.log(`📈 Escalated complaint ${complaint.complaintNumber} to level ${escalationLevel}: ${escalationActions[escalationLevel as keyof typeof escalationActions]}`);
  }

  private async sendSLAWarning(complaint: any, overdueMinutes: number) {
    const timeRemaining = `-${overdueMinutes} minutes (overdue)`;
    
    notificationSocket.emit('sla_breach_warning', {
      taskId: complaint.id,
      staffId: complaint.assignedToId,
      timeRemaining
    });
  }

  private async sendRepeatIssueNotification(location: string, complaints: Complaint[]) {
    const locationParts = location.split('-');
    const locationType = locationParts[0]; // 'train' or 'station'
    const locationName = locationParts[1]; // train number or station code
    
    let description = '';
    if (locationType === 'train') {
      description = `Multiple issues on Train ${locationName}, Coach ${locationParts[3]}`;
    } else {
      description = `Multiple issues at Station ${locationName}, Platform ${locationParts[3]}`;
    }

    notificationSocket.emit('emergency_alert', {
      type: 'repeat_issue_pattern',
      location: description,
      description: `${complaints.length} complaints in the same location within 24 hours`,
      severity: 'medium'
    });

    console.log(`🔄 Repeat issue pattern detected: ${description} (${complaints.length} complaints)`);
  }

  // Public method to manually trigger automation
  async triggerAutomation(type: string, data?: any) {
    switch (type) {
      case 'sla_check':
        await this.checkSLACompliance();
        break;
      case 'repeat_issues':
        await this.detectRepeatIssues();
        break;
      case 'priority_update':
        await this.updatePriorityScores();
        break;
      case 'daily_report':
        await this.generateDailyReports();
        break;
      default:
        console.log(`❌ Unknown automation type: ${type}`);
    }
  }
}

// Start the automation service
const automationService = new AutomationService();

// Health check endpoint
import { createServer } from 'http';
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'automation-service',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/trigger' && req.method === 'POST') {
    // Manual trigger endpoint
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { type, data } = JSON.parse(body);
        await automationService.triggerAutomation(type, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Automation ${type} triggered` }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(HTTP_PORT, () => {
  console.log(`🤖 Automation service running on port ${HTTP_PORT}`);
  console.log(`📊 Health check available at http://localhost:${HTTP_PORT}/health`);
  console.log(`🔧 Manual trigger available at http://localhost:${HTTP_PORT}/trigger`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down automation service...');
  server.close(() => {
    prisma.$disconnect();
    console.log('✅ Automation service stopped');
    process.exit(0);
  });
});