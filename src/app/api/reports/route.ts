import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ComplaintType, Status, Severity } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period') || 'today';
    const format = searchParams.get('format') || 'json';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    let reportData;

    switch (type) {
      case 'daily':
        reportData = await generateDailyReport(startDate, now);
        break;
      case 'train':
        reportData = await generateTrainReport(startDate, now);
        break;
      case 'station':
        reportData = await generateStationReport(startDate, now);
        break;
      case 'staff':
        reportData = await generateStaffReport(startDate, now);
        break;
      case 'sla':
        reportData = await generateSLAReport(startDate, now);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(startDate, now);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: daily, train, station, staff, sla, performance' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      return generateCSVResponse(reportData, type);
    }

    return NextResponse.json({
      success: true,
      reportType: type,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      generatedAt: new Date().toISOString(),
      data: reportData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateDailyReport(startDate: Date, endDate: Date) {
  const complaints = await db.complaint.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      train: true,
      station: true,
      assignedTo: true
    }
  });

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === Status.COMPLETED).length;
  const pendingComplaints = complaints.filter(c => c.status === Status.PENDING).length;
  const inProgressComplaints = complaints.filter(c => c.status === Status.IN_PROGRESS).length;

  // Calculate SLA compliance
  const slaCompliant = complaints.filter(c => 
    c.status === Status.COMPLETED && 
    c.completedAt && 
    c.slaDeadline && 
    c.completedAt <= c.slaDeadline
  ).length;

  const slaComplianceRate = totalComplaints > 0 ? (slaCompliant / totalComplaints) * 100 : 100;

  // Group by type
  const byType = complaints.reduce((acc, complaint) => {
    const type = complaint.type.toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by severity
  const bySeverity = complaints.reduce((acc, complaint) => {
    const severity = complaint.severity.toLowerCase();
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Average resolution time
  const resolvedWithTime = complaints.filter(c => c.status === Status.COMPLETED && c.resolutionTime);
  const avgResolutionTime = resolvedWithTime.length > 0 
    ? resolvedWithTime.reduce((sum, c) => sum + (c.resolutionTime || 0), 0) / resolvedWithTime.length 
    : 0;

  return {
    summary: {
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolutionRate: totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0,
      slaComplianceRate,
      avgResolutionTime: Math.round(avgResolutionTime)
    },
    breakdown: {
      byType,
      bySeverity
    },
    timeline: generateTimelineData(complaints, startDate, endDate)
  };
}

async function generateTrainReport(startDate: Date, endDate: Date) {
  const complaints = await db.complaint.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      trainId: { not: null }
    },
    include: {
      train: true,
      coach: true
    }
  });

  // Group by train
  const trainData = complaints.reduce((acc, complaint) => {
    const trainNumber = complaint.train?.trainNumber || 'Unknown';
    if (!acc[trainNumber]) {
      acc[trainNumber] = {
        trainNumber,
        trainName: complaint.train?.trainName || 'Unknown',
        totalComplaints: 0,
        resolvedComplaints: 0,
        coaches: new Map()
      };
    }
    
    acc[trainNumber].totalComplaints++;
    if (complaint.status === Status.COMPLETED) {
      acc[trainNumber].resolvedComplaints++;
    }

    // Group by coach
    const coachNumber = complaint.coach?.coachNumber || 'Unknown';
    if (!acc[trainNumber].coaches.has(coachNumber)) {
      acc[trainNumber].coaches.set(coachNumber, {
        coachNumber,
        totalComplaints: 0,
        resolvedComplaints: 0,
        issues: []
      });
    }
    
    const coach = acc[trainNumber].coaches.get(coachNumber)!;
    coach.totalComplaints++;
    if (complaint.status === Status.COMPLETED) {
      coach.resolvedComplaints++;
    }
    coach.issues.push({
      type: complaint.type,
      description: complaint.description,
      status: complaint.status,
      createdAt: complaint.createdAt
    });

    return acc;
  }, {} as Record<string, any>);

  // Convert Map to array and calculate metrics
  const trainReports = Object.values(trainData).map(train => ({
    ...train,
    coaches: Array.from(train.coaches.values()),
    resolutionRate: train.totalComplaints > 0 ? (train.resolvedComplaints / train.totalComplaints) * 100 : 0
  }));

  // Sort by total complaints (descending)
  trainReports.sort((a, b) => b.totalComplaints - a.totalComplaints);

  return {
    summary: {
      totalTrains: trainReports.length,
      totalComplaints: complaints.length,
      avgComplaintsPerTrain: trainReports.length > 0 ? complaints.length / trainReports.length : 0
    },
    trains: trainReports
  };
}

async function generateStationReport(startDate: Date, endDate: Date) {
  const complaints = await db.complaint.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      stationId: { not: null }
    },
    include: {
      station: true,
      platform: true
    }
  });

  // Group by station
  const stationData = complaints.reduce((acc, complaint) => {
    const stationCode = complaint.station?.stationCode || 'Unknown';
    if (!acc[stationCode]) {
      acc[stationCode] = {
        stationCode,
        stationName: complaint.station?.stationName || 'Unknown',
        city: complaint.station?.city || 'Unknown',
        totalComplaints: 0,
        resolvedComplaints: 0,
        platforms: new Map()
      };
    }
    
    acc[stationCode].totalComplaints++;
    if (complaint.status === Status.COMPLETED) {
      acc[stationCode].resolvedComplaints++;
    }

    // Group by platform
    const platformNumber = complaint.platform?.platformNumber || 'Unknown';
    if (!acc[stationCode].platforms.has(platformNumber)) {
      acc[stationCode].platforms.set(platformNumber, {
        platformNumber,
        totalComplaints: 0,
        resolvedComplaints: 0,
        issues: []
      });
    }
    
    const platform = acc[stationCode].platforms.get(platformNumber)!;
    platform.totalComplaints++;
    if (complaint.status === Status.COMPLETED) {
      platform.resolvedComplaints++;
    }
    platform.issues.push({
      type: complaint.type,
      description: complaint.description,
      status: complaint.status,
      createdAt: complaint.createdAt
    });

    return acc;
  }, {} as Record<string, any>);

  // Convert Map to array and calculate metrics
  const stationReports = Object.values(stationData).map(station => ({
    ...station,
    platforms: Array.from(station.platforms.values()),
    resolutionRate: station.totalComplaints > 0 ? (station.resolvedComplaints / station.totalComplaints) * 100 : 0
  }));

  // Sort by total complaints (descending)
  stationReports.sort((a, b) => b.totalComplaints - a.totalComplaints);

  return {
    summary: {
      totalStations: stationReports.length,
      totalComplaints: complaints.length,
      avgComplaintsPerStation: stationReports.length > 0 ? complaints.length / stationReports.length : 0
    },
    stations: stationReports
  };
}

async function generateStaffReport(startDate: Date, endDate: Date) {
  const tasks = await db.task.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      staff: true,
      complaint: true
    }
  });

  // Group by staff
  const staffData = tasks.reduce((acc, task) => {
    const staffId = task.staffId;
    const staffName = task.staff?.name || 'Unknown Staff';
    
    if (!acc[staffId]) {
      acc[staffId] = {
        staffId,
        staffName,
        role: task.staff?.role || 'STAFF',
        totalTasks: 0,
        completedTasks: 0,
        totalResolutionTime: 0,
        tasks: []
      };
    }
    
    acc[staffId].totalTasks++;
    acc[staffId].tasks.push(task);
    
    if (task.status === 'COMPLETED') {
      acc[staffId].completedTasks++;
      if (task.actualTime) {
        acc[staffId].totalResolutionTime += task.actualTime;
      }
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate metrics
  const staffReports = Object.values(staffData).map(staff => ({
    ...staff,
    completionRate: staff.totalTasks > 0 ? (staff.completedTasks / staff.totalTasks) * 100 : 0,
    avgResolutionTime: staff.completedTasks > 0 ? staff.totalResolutionTime / staff.completedTasks : 0,
    efficiency: staff.totalTasks > 0 ? Math.min((staff.completedTasks / staff.totalTasks) * 100, 100) : 0
  }));

  // Sort by completion rate (descending)
  staffReports.sort((a, b) => b.completionRate - a.completionRate);

  return {
    summary: {
      totalStaff: staffReports.length,
      totalTasks: tasks.length,
      avgCompletionRate: staffReports.length > 0 
        ? staffReports.reduce((sum, s) => sum + s.completionRate, 0) / staffReports.length 
        : 0
    },
    staff: staffReports
  };
}

async function generateSLAReport(startDate: Date, endDate: Date) {
  const complaints = await db.complaint.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const totalComplaints = complaints.length;
  const slaBreaches = complaints.filter(c => 
    c.slaDeadline && 
    new Date() > c.slaDeadline && 
    c.status !== Status.COMPLETED
  );

  const slaCompliant = complaints.filter(c => 
    c.status === Status.COMPLETED && 
    c.completedAt && 
    c.slaDeadline && 
    c.completedAt <= c.slaDeadline
  );

  const slaComplianceRate = totalComplaints > 0 ? (slaCompliant.length / totalComplaints) * 100 : 100;

  // Group by severity
  const slaBySeverity = complaints.reduce((acc, complaint) => {
    const severity = complaint.severity;
    if (!acc[severity]) {
      acc[severity] = { total: 0, compliant: 0, breached: 0 };
    }
    
    acc[severity].total++;
    
    if (complaint.status === Status.COMPLETED && 
        complaint.completedAt && 
        complaint.slaDeadline && 
        complaint.completedAt <= complaint.slaDeadline) {
      acc[severity].compliant++;
    } else if (complaint.slaDeadline && new Date() > complaint.slaDeadline && 
               complaint.status !== Status.COMPLETED) {
      acc[severity].breached++;
    }
    
    return acc;
  }, {} as Record<Severity, { total: number; compliant: number; breached: number }>);

  return {
    summary: {
      totalComplaints,
      slaCompliant: slaCompliant.length,
      slaBreached: slaBreaches.length,
      slaComplianceRate,
      breachRate: totalComplaints > 0 ? (slaBreaches.length / totalComplaints) * 100 : 0
    },
    bySeverity: slaBySeverity,
    breaches: slaBreaches.map(c => ({
      complaintNumber: c.complaintNumber,
      type: c.type,
      severity: c.severity,
      slaDeadline: c.slaDeadline,
      overdueMinutes: c.slaDeadline ? Math.floor((new Date().getTime() - c.slaDeadline.getTime()) / (1000 * 60)) : 0
    }))
  };
}

async function generatePerformanceReport(startDate: Date, endDate: Date) {
  const complaints = await db.complaint.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Resolution time analysis
  const resolvedComplaints = complaints.filter(c => c.resolutionTime);
  const avgResolutionTime = resolvedComplaints.length > 0 
    ? resolvedComplaints.reduce((sum, c) => sum + (c.resolutionTime || 0), 0) / resolvedComplaints.length 
    : 0;

  // Repeat issues analysis
  const repeatIssues = complaints.filter(c => c.isRepeatIssue);
  const repeatIssueRate = complaints.length > 0 ? (repeatIssues.length / complaints.length) * 100 : 0;

  // First-time resolution
  const firstTimeResolution = complaints.filter(c => 
    c.status === Status.COMPLETED && !c.isRepeatIssue
  );
  const firstTimeResolutionRate = complaints.length > 0 
    ? (firstTimeResolution.length / complaints.length) * 100 
    : 0;

  // Priority distribution
  const priorityDistribution = complaints.reduce((acc, complaint) => {
    const score = complaint.priorityScore;
    const bucket = score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    summary: {
      totalComplaints: complaints.length,
      avgResolutionTime: Math.round(avgResolutionTime),
      repeatIssueRate,
      firstTimeResolutionRate
    },
    metrics: {
      resolutionTime: {
        average: Math.round(avgResolutionTime),
        min: resolvedComplaints.length > 0 ? Math.min(...resolvedComplaints.map(c => c.resolutionTime || 0)) : 0,
        max: resolvedComplaints.length > 0 ? Math.max(...resolvedComplaints.map(c => c.resolutionTime || 0)) : 0
      },
      priorityDistribution
    },
    trends: generateTrendData(complaints, startDate, endDate)
  };
}

function generateTimelineData(complaints: any[], startDate: Date, endDate: Date) {
  const timeline = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayComplaints = complaints.filter(c => 
      c.createdAt >= dayStart && c.createdAt <= dayEnd
    );
    
    timeline.push({
      date: dayStart.toISOString().split('T')[0],
      total: dayComplaints.length,
      resolved: dayComplaints.filter(c => c.status === Status.COMPLETED).length,
      pending: dayComplaints.filter(c => c.status === Status.PENDING).length,
      inProgress: dayComplaints.filter(c => c.status === Status.IN_PROGRESS).length
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return timeline;
}

function generateTrendData(complaints: any[], startDate: Date, endDate: Date) {
  // Generate weekly trends
  const weeks = [];
  const current = new Date(startDate);
  
  while (current < endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekComplaints = complaints.filter(c => 
      c.createdAt >= weekStart && c.createdAt <= weekEnd
    );
    
    weeks.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      total: weekComplaints.length,
      avgResolutionTime: weekComplaints.filter(c => c.resolutionTime).length > 0
        ? Math.round(weekComplaints.filter(c => c.resolutionTime).reduce((sum, c) => sum + (c.resolutionTime || 0), 0) / weekComplaints.filter(c => c.resolutionTime).length)
        : 0
    });
    
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
}

function generateCSVResponse(data: any, reportType: string): NextResponse {
  let csv = '';
  
  switch (reportType) {
    case 'daily':
      csv = convertDailyReportToCSV(data);
      break;
    case 'train':
      csv = convertTrainReportToCSV(data);
      break;
    case 'station':
      csv = convertStationReportToCSV(data);
      break;
    case 'staff':
      csv = convertStaffReportToCSV(data);
      break;
    case 'sla':
      csv = convertSLAReportToCSV(data);
      break;
    case 'performance':
      csv = convertPerformanceReportToCSV(data);
      break;
    default:
      csv = 'Report type not supported for CSV export';
  }
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}

function convertDailyReportToCSV(data: any): string {
  const { summary, timeline } = data;
  let csv = 'Metric,Value\n';
  csv += `Total Complaints,${summary.totalComplaints}\n`;
  csv += `Resolved Complaints,${summary.resolvedComplaints}\n`;
  csv += `Pending Complaints,${summary.pendingComplaints}\n`;
  csv += `In Progress Complaints,${summary.inProgressComplaints}\n`;
  csv += `Resolution Rate,${summary.resolutionRate.toFixed(2)}%\n`;
  csv += `SLA Compliance Rate,${summary.slaComplianceRate.toFixed(2)}%\n`;
  csv += `Avg Resolution Time,${summary.avgResolutionTime} minutes\n\n`;
  
  csv += 'Date,Total,Resolved,Pending,In Progress\n';
  timeline.forEach((day: any) => {
    csv += `${day.date},${day.total},${day.resolved},${day.pending},${day.inProgress}\n`;
  });
  
  return csv;
}

function convertTrainReportToCSV(data: any): string {
  let csv = 'Train Number,Train Name,Total Complaints,Resolved Complaints,Resolution Rate\n';
  data.trains.forEach((train: any) => {
    csv += `${train.trainNumber},"${train.trainName}",${train.totalComplaints},${train.resolvedComplaints},${train.resolutionRate.toFixed(2)}%\n`;
  });
  return csv;
}

function convertStationReportToCSV(data: any): string {
  let csv = 'Station Code,Station Name,City,Total Complaints,Resolved Complaints,Resolution Rate\n';
  data.stations.forEach((station: any) => {
    csv += `${station.stationCode},"${station.stationName}","${station.city}",${station.totalComplaints},${station.resolvedComplaints},${station.resolutionRate.toFixed(2)}%\n`;
  });
  return csv;
}

function convertStaffReportToCSV(data: any): string {
  let csv = 'Staff Name,Role,Total Tasks,Completed Tasks,Completion Rate,Avg Resolution Time,Efficiency\n';
  data.staff.forEach((staff: any) => {
    csv += `"${staff.staffName}",${staff.role},${staff.totalTasks},${staff.completedTasks},${staff.completionRate.toFixed(2)}%,${staff.avgResolutionTime.toFixed(0)} min,${staff.efficiency.toFixed(2)}%\n`;
  });
  return csv;
}

function convertSLAReportToCSV(data: any): string {
  let csv = 'Metric,Value\n';
  csv += `Total Complaints,${data.summary.totalComplaints}\n`;
  csv += `SLA Compliant,${data.summary.slaCompliant}\n`;
  csv += `SLA Breached,${data.summary.slaBreached}\n`;
  csv += `SLA Compliance Rate,${data.summary.slaComplianceRate.toFixed(2)}%\n`;
  csv += `Breach Rate,${data.summary.breachRate.toFixed(2)}%\n\n`;
  
  csv += 'Severity,Total,Compliant,Breached\n';
  Object.entries(data.bySeverity).forEach(([severity, stats]: [string, any]) => {
    csv += `${severity},${stats.total},${stats.compliant},${stats.breached}\n`;
  });
  
  return csv;
}

function convertPerformanceReportToCSV(data: any): string {
  const { summary, metrics } = data;
  let csv = 'Metric,Value\n';
  csv += `Total Complaints,${summary.totalComplaints}\n`;
  csv += `Avg Resolution Time,${summary.avgResolutionTime} minutes\n`;
  csv += `Repeat Issue Rate,${summary.repeatIssueRate.toFixed(2)}%\n`;
  csv += `First Time Resolution Rate,${summary.firstTimeResolutionRate.toFixed(2)}%\n\n`;
  
  csv += 'Resolution Time Stats,Value (minutes)\n';
  csv += `Average,${metrics.resolutionTime.average}\n`;
  csv += `Minimum,${metrics.resolutionTime.min}\n`;
  csv += `Maximum,${metrics.resolutionTime.max}\n\n`;
  
  csv += 'Priority Distribution,Count\n';
  Object.entries(metrics.priorityDistribution).forEach(([priority, count]: [string, any]) => {
    csv += `${priority},${count}\n`;
  });
  
  return csv;
}