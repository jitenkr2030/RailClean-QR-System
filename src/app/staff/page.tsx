'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  MapPin, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  Users,
  Filter,
  Search,
  Bell,
  LogOut
} from 'lucide-react'

// Mock data for demonstration
const mockTasks = [
  {
    id: '1',
    taskNumber: 'TSK001',
    complaintNumber: 'RC12345678',
    type: 'coach',
    description: 'Dirty seat in Coach A2',
    location: 'Train 12345 - Coach A2 - Seat 15',
    status: 'assigned',
    priority: 'medium',
    assignedTime: '10:30 AM',
    estimatedTime: '15 min',
    reporter: 'Passenger',
    severity: 'medium'
  },
  {
    id: '2',
    taskNumber: 'TSK002',
    complaintNumber: 'RC12345679',
    type: 'platform',
    description: 'Garbage on Platform 3',
    location: 'Station NDLS - Platform 3',
    status: 'in_progress',
    priority: 'high',
    assignedTime: '10:45 AM',
    estimatedTime: '10 min',
    reporter: 'Staff',
    severity: 'high'
  },
  {
    id: '3',
    taskNumber: 'TSK003',
    complaintNumber: 'RC12345680',
    type: 'food',
    description: 'Food quality issue',
    location: 'Train 67890 - Pantry Car',
    status: 'completed',
    priority: 'low',
    assignedTime: '09:15 AM',
    completedTime: '09:28 AM',
    estimatedTime: '10 min',
    actualTime: '13 min',
    reporter: 'Customer',
    severity: 'low'
  }
]

export default function StaffDashboard() {
  const [tasks, setTasks] = useState(mockTasks)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [notes, setNotes] = useState('')
  const [workLocation, setWorkLocation] = useState('')
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null)

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter
    const matchesSearch = task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTaskAction = (taskId: string, action: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        switch (action) {
          case 'start':
            return { ...task, status: 'in_progress', startTime: new Date().toLocaleTimeString() }
          case 'complete':
            return { ...task, status: 'completed', completedTime: new Date().toLocaleTimeString() }
          case 'pause':
            return { ...task, status: 'assigned' }
          default:
            return task
        }
      }
      return task
    }))
  }

  const stats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    avgTime: '12 min'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm text-gray-500">Cleaning & Maintenance Team</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                <Badge className="ml-2" variant="secondary">3</Badge>
              </Button>
              <Button variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Play className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Time</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.avgTime}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Assigned Tasks</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredTasks.map((task) => (
                    <div 
                      key={task.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedTask?.id === task.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{task.taskNumber}</span>
                            <Badge variant="secondary">{task.complaintNumber}</Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{task.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {task.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.assignedTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <div className="flex space-x-1">
                            {task.status === 'assigned' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTaskAction(task.id, 'start')
                                }}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {task.status === 'in_progress' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTaskAction(task.id, 'complete')
                                  }}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTaskAction(task.id, 'pause')
                                  }}
                                >
                                  <Pause className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTask ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Task Number</Label>
                      <p className="font-medium">{selectedTask.taskNumber}</p>
                    </div>
                    <div>
                      <Label>Complaint</Label>
                      <p className="font-medium">{selectedTask.complaintNumber}</p>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-gray-600">{selectedTask.description}</p>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <p className="text-sm text-gray-600">{selectedTask.location}</p>
                    </div>
                    <div>
                      <Label>Work Location</Label>
                      <Input
                        placeholder="Specify exact work location"
                        value={workLocation}
                        onChange={(e) => setWorkLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Add work notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <Label>Before Photo</Label>
                      <div className="mt-2">
                        {beforePhoto ? (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm">{beforePhoto.name}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setBeforePhoto(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('before-photo')?.click()}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Upload Before Photo
                          </Button>
                        )}
                        <input
                          id="before-photo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setBeforePhoto(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>

                    {selectedTask.status === 'in_progress' && (
                      <div>
                        <Label>After Photo</Label>
                        <div className="mt-2">
                          {afterPhoto ? (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm">{afterPhoto.name}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAfterPhoto(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById('after-photo')?.click()}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Upload After Photo
                            </Button>
                          )}
                          <input
                            id="after-photo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setAfterPhoto(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {selectedTask.status === 'assigned' && (
                        <Button 
                          className="flex-1"
                          onClick={() => handleTaskAction(selectedTask.id, 'start')}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Task
                        </Button>
                      )}
                      {selectedTask.status === 'in_progress' && (
                        <Button 
                          className="flex-1"
                          onClick={() => handleTaskAction(selectedTask.id, 'complete')}
                          disabled={!afterPhoto}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Task
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a task to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}