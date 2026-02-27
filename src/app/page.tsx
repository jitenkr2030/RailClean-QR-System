'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Train, 
  Utensils, 
  MapPin, 
  QrCode, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Camera,
  FileText,
  Settings
} from 'lucide-react'

export default function Home() {
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const modules = [
    {
      id: 'coach',
      title: 'Coach Cleanliness',
      description: 'Monitor train coach hygiene and maintenance',
      icon: Train,
      color: 'bg-blue-500',
      stats: { active: 45, pending: 8, completed: 234 }
    },
    {
      id: 'food',
      title: 'Food Quality',
      description: 'Track pantry and catering service quality',
      icon: Utensils,
      color: 'bg-green-500',
      stats: { active: 12, pending: 3, completed: 156 }
    },
    {
      id: 'platform',
      title: 'Platform Cleanliness',
      description: 'Ensure station platform hygiene standards',
      icon: MapPin,
      color: 'bg-orange-500',
      stats: { active: 28, pending: 5, completed: 189 }
    }
  ]

  const quickStats = [
    { label: 'Total Complaints', value: '1,234', change: '+12%', icon: FileText },
    { label: 'Response Time', value: '18 min', change: '-25%', icon: Clock },
    { label: 'Cleanliness Score', value: '94%', change: '+3%', icon: CheckCircle },
    { label: 'Active Issues', value: '23', change: '-8%', icon: AlertTriangle }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RailClean QR System</h1>
                <p className="text-sm text-gray-500">Indian Railways Monitoring Solution</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-medium ${
                        stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs last week</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <stat.icon className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Modules */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <Card 
                  key={module.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    activeModule === module.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setActiveModule(module.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 ${module.color} rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary">
                        {module.stats.active} active
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pending</span>
                        <span className="font-medium">{module.stats.pending}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completed Today</span>
                        <span className="font-medium">{module.stats.completed}</span>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        variant={activeModule === module.id ? "default" : "outline"}
                        onClick={() => window.location.href = `/complaint?type=${module.id}`}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Report Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Coach Cleanliness', location: 'Train 12345 - Coach A2', time: '5 min ago', status: 'pending' },
                  { type: 'Food Quality', location: 'Station NDLS - Platform 3', time: '12 min ago', status: 'in-progress' },
                  { type: 'Platform Cleanliness', location: 'Train 67890 - Coach B1', time: '25 min ago', status: 'completed' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.type}</p>
                      <p className="text-sm text-gray-600">{item.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{item.time}</p>
                      <Badge 
                        variant={item.status === 'completed' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Average Response Time</span>
                  <span className="text-lg font-bold text-green-600">18 min</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Cleanliness Score</span>
                  <span className="text-lg font-bold text-blue-600">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Customer Satisfaction</span>
                  <span className="text-lg font-bold text-purple-600">4.6/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600">
              © 2024 RailClean QR System. Designed for Indian Railways.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/staff'}>
                <Users className="w-4 h-4 mr-2" />
                Staff Portal
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin'}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
              <Button variant="ghost" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}