import { Server } from 'socket.io';
import { createServer } from 'http';

const HTTP_PORT = 3001;
const server = createServer();
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Store connected staff members
const connectedStaff = new Map<string, { socketId: string; name: string; role: string }>();

// Store active tasks and their assignments
const activeTasks = new Map<string, { staffId: string; status: string }>();

io.on('connection', (socket) => {
  console.log(`🔗 Staff connected: ${socket.id}`);

  // Staff registration
  socket.on('register_staff', (data) => {
    const { staffId, name, role } = data;
    connectedStaff.set(staffId, { socketId: socket.id, name, role });
    
    console.log(`👷 Staff registered: ${name} (${role})`);
    
    // Send confirmation
    socket.emit('registration_confirmed', { 
      message: 'Successfully connected to notification service',
      staffId,
      activeTasksCount: Array.from(activeTasks.values()).filter(t => t.staffId === staffId).length
    });

    // Broadcast staff count update
    io.emit('staff_count_update', { 
      totalStaff: connectedStaff.size,
      activeStaff: Array.from(connectedStaff.values()).filter(s => s.role === 'staff').length
    });
  });

  // New task assignment
  socket.on('task_assigned', (data) => {
    const { taskId, staffId, taskDetails } = data;
    
    // Store task assignment
    activeTasks.set(taskId, { staffId, status: 'assigned' });
    
    // Find assigned staff member
    const staff = connectedStaff.get(staffId);
    
    if (staff) {
      // Send notification to specific staff member
      io.to(staff.socketId).emit('new_task_notification', {
        taskId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${taskDetails.description}`,
        taskDetails,
        timestamp: new Date().toISOString(),
        priority: taskDetails.priority || 'medium'
      });
      
      console.log(`📋 Task ${taskId} assigned to staff ${staff.name}`);
    } else {
      console.log(`⚠️ Staff ${staffId} not found for task assignment`);
    }

    // Broadcast to admin dashboard
    socket.broadcast.emit('task_activity_update', {
      type: 'task_assigned',
      taskId,
      staffId,
      timestamp: new Date().toISOString()
    });
  });

  // Task status updates
  socket.on('task_status_update', (data) => {
    const { taskId, status, staffId, notes } = data;
    
    // Update task status
    if (activeTasks.has(taskId)) {
      activeTasks.set(taskId, { staffId, status });
    }
    
    // Find staff member
    const staff = connectedStaff.get(staffId);
    
    if (staff) {
      // Broadcast status update to all connected clients
      io.emit('task_status_notification', {
        taskId,
        type: 'status_update',
        title: 'Task Status Updated',
        message: `Task ${taskId} status changed to: ${status}`,
        staffName: staff.name,
        status,
        notes,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📝 Task ${taskId} status updated to ${status} by ${staff.name}`);
    }
  });

  // SLA breach warnings
  socket.on('sla_breach_warning', (data) => {
    const { taskId, staffId, timeRemaining } = data;
    
    const staff = connectedStaff.get(staffId);
    
    if (staff) {
      io.to(staff.socketId).emit('sla_warning', {
        taskId,
        type: 'sla_warning',
        title: '⚠️ SLA Breach Warning',
        message: `Task ${taskId} is approaching SLA deadline. Time remaining: ${timeRemaining}`,
        timeRemaining,
        timestamp: new Date().toISOString(),
        priority: 'high'
      });
      
      console.log(`⏰ SLA warning sent for task ${taskId} to ${staff.name}`);
    }

    // Also notify admins
    socket.broadcast.emit('admin_sla_warning', {
      taskId,
      staffId: staff?.name || 'Unknown',
      timeRemaining,
      timestamp: new Date().toISOString()
    });
  });

  // Emergency notifications
  socket.on('emergency_alert', (data) => {
    const { type, location, description, severity } = data;
    
    // Send to all staff
    io.emit('emergency_notification', {
      type: 'emergency',
      title: '🚨 Emergency Alert',
      message: `${severity.toUpperCase()}: ${description} at ${location}`,
      location,
      description,
      severity,
      timestamp: new Date().toISOString(),
      priority: 'critical'
    });
    
    console.log(`🚨 Emergency alert sent: ${severity} - ${description}`);
  });

  // Complaint escalation
  socket.on('complaint_escalation', (data) => {
    const { complaintId, reason, escalationLevel, assignedStaffId } = data;
    
    const staff = connectedStaff.get(assignedStaffId);
    
    if (staff) {
      io.to(staff.socketId).emit('escalation_notification', {
        complaintId,
        type: 'escalation',
        title: '📈 Complaint Escalated',
        message: `Complaint ${complaintId} has been escalated to level ${escalationLevel}. Reason: ${reason}`,
        reason,
        escalationLevel,
        timestamp: new Date().toISOString(),
        priority: 'high'
      });
      
      console.log(`📈 Escalation notification sent for complaint ${complaintId}`);
    }
  });

  // System notifications
  socket.on('system_notification', (data) => {
    const { title, message, targetRole } = data;
    
    if (targetRole === 'all') {
      // Send to all connected users
      io.emit('system_broadcast', {
        type: 'system',
        title,
        message,
        timestamp: new Date().toISOString()
      });
    } else {
      // Send to specific role
      connectedStaff.forEach((staff, staffId) => {
        if (staff.role === targetRole) {
          io.to(staff.socketId).emit('system_notification', {
            type: 'system',
            title,
            message,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    
    console.log(`📢 System notification sent: ${title}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Find and remove disconnected staff
    let disconnectedStaff = null;
    connectedStaff.forEach((staff, staffId) => {
      if (staff.socketId === socket.id) {
        disconnectedStaff = { staffId, ...staff };
        connectedStaff.delete(staffId);
      }
    });
    
    if (disconnectedStaff) {
      console.log(`🔌 Staff disconnected: ${disconnectedStaff.name}`);
      
      // Broadcast staff count update
      io.emit('staff_count_update', { 
        totalStaff: connectedStaff.size,
        activeStaff: Array.from(connectedStaff.values()).filter(s => s.role === 'staff').length
      });
    }
  });

  // Heartbeat for connection health
  socket.on('heartbeat', () => {
    socket.emit('heartbeat_response', { 
      timestamp: new Date().toISOString(),
      serverTime: Date.now()
    });
  });
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      connectedStaff: connectedStaff.size,
      activeTasks: activeTasks.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  }
});

// Start server
server.listen(HTTP_PORT, () => {
  console.log(`🔔 Notification service running on port ${HTTP_PORT}`);
  console.log(`📊 Health check available at http://localhost:${HTTP_PORT}/health`);
  console.log(`🔗 WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down notification service...');
  server.close(() => {
    console.log('✅ Notification service stopped');
    process.exit(0);
  });
});