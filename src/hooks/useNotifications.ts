'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  priority?: string
  taskDetails?: any
}

export function useNotifications(staffId?: string, name?: string, role?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('/', {
      query: {
        XTransformPort: 3001
      }
    })

    newSocket.on('connect', () => {
      console.log('🔗 Connected to notification service')
      setIsConnected(true)
      
      // Register staff if credentials provided
      if (staffId && name && role) {
        newSocket.emit('register_staff', { staffId, name, role })
      }
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from notification service')
      setIsConnected(false)
    })

    // Listen for various notification types
    newSocket.on('new_task_notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 50)) // Keep last 50
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico',
          tag: data.id
        })
      }
    })

    newSocket.on('task_status_notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 50))
    })

    newSocket.on('sla_warning', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 50))
      
      // Show urgent browser notification
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico',
          tag: `sla-${data.id}`,
          requireInteraction: true
        })
      }
    })

    newSocket.on('emergency_notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 50))
      
      // Show critical browser notification
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico',
          tag: `emergency-${data.id}`,
          requireInteraction: true
        })
      }
    })

    newSocket.on('escalation_notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 50))
    })

    newSocket.on('system_broadcast', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 50))
    })

    newSocket.on('system_notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 50))
    })

    setSocket(newSocket)

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    return () => {
      newSocket.close()
    }
  }, [staffId, name, role])

  const sendNotification = (type: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(type, data)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  return {
    socket,
    notifications,
    isConnected,
    sendNotification,
    clearNotifications,
    markAsRead
  }
}