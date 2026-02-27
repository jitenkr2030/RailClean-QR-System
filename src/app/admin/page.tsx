'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Train, 
  Utensils, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Filter,
  Calendar,
  Activity,
  Target,
  Zap,
  FileText,
  Settings,
  Bell,
  LogOut
} from 'lucide-react'

// Mock data for demonstration
const mockStats = {
  overview: {
    totalComplaints: 1234,
    activeIssues: 23,
    responseTime: 18,
    cleanlinessScore: 94,
    customerSatisfaction: 4.6,
    staffEfficiency: 87
  },
  performance: {
    avgResponseTime: 18,
    slaCompliance: 92,
    repeatIssueRate: 8,
    firstTimeResolution: 85
  },
  modules: {
    coach: { total: 456, active: 12, avgTime: 15, score: 96 },
    food: { total: 234, active: 5, avgTime: 22, score: 91 },
    platform: { total: 544, active: 6, avgTime: 12, score: 93 }
  }
}

const mockRecentActivity = [
  { id: '1', type: 'complaint', description: 'New complaint registered - Coach A2 cleanliness', time: '2 min ago', priority: 'high' },
  { id: '2', type: 'task', description: 'Task completed - Platform 3 cleaning', time: '5 min ago', priority: 'medium' },
  { id: '3', type: 'alert', description: 'SLA breach warning - Train 12345', time: '8 min ago', priority: 'high' },
  { id: '4', type: 'complaint', description: 'Food quality issue reported - Pantry Car', time: '12 min ago', priority: 'medium' },
  { id: '5', type: 'task', description: 'Staff assigned - Washroom cleaning Coach B1', time: '15 min ago', priority: 'low' },
]

const mockTopIssues = [
  { issue: 'Dirty Seats', count: 45, percentage: 23, trend: 'up' },
  { issue: 'Garbage Overflow', count: 38, percentage: 19, trend: 'down' },
  { issue: 'Food Temperature', count: 32, percentage: 16, trend: 'up' },
  { issue: 'Washroom Cleanliness', count: 28, percentage: 14, trend: 'down' },
  { issue: 'Platform Floor', count: 25, percentage: 13, trend: 'stable' },
]

const mockStaffPerformance = [
  { name: 'Raj Kumar', tasks: 45, avgTime: 12, efficiency: 95, rating: 4.8 },
  { name: 'Priya Singh', tasks: 38, avgTime: 15, efficiency: 88, rating: 4.6 },
  { name: 'Amit Patel', tasks: 42, avgTime: 18, efficiency: 82, rating: 4.4 },
  { name: 'Sunita Devi', tasks: 35, avgTime: 14, efficiency: 91, rating: 4.7 },
  { name: 'Mohammed Ali', tasks: 40, avgTime: 20, efficiency: 78, rating: 4.2 },
]

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [selectedModule, setSelectedModule] = useState('all')

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />
      default: return <div className="w-4 h-4" />
    }
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'coach': return <Train className="w-5 h-5" />
      case 'food': return <Utensils className="w-5 h-5" />
      case 'platform': return <MapPin className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'coach': return 'bg-blue-500'
      case 'food': return 'bg-green-500'
      case 'platform': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">RailClean System Control Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month'}
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
                <Badge className="ml-2" variant="destructive">5</Badge>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
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
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{mockStats.overview.totalComplaints}</p>
                  <p className="text-xs text-green-600">+12% vs last week</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Issues</p>
                  <p className="text-2xl font-bold text-orange-600">{mockStats.overview.activeIssues}</p>
                  <p className="text-xs text-red-600">+3 vs yesterday</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-green-600">{mockStats.overview.responseTime}m</p>
                  <p className="text-xs text-green-600">-25% improvement</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cleanliness Score</p>
                  <p className="text-2xl font-bold text-blue-600">{mockStats.overview.cleanlinessScore}%</p>
                  <p className="text-xs text-green-600">+3% vs target</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-purple-600">{mockStats.overview.customerSatisfaction}</p>
                  <p className="text-xs text-green-600">+0.2 rating</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Staff Efficiency</p>
                  <p className="text-2xl font-bold text-indigo-600">{mockStats.overview.staffEfficiency}%</p>
                  <p className="text-xs text-green-600">+5% vs last month</p>
                </div>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockRecentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.priority === 'high' ? 'bg-red-500' : 
                            activity.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Top Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockTopIssues.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900 w-32">{item.issue}</span>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(item.trend)}
                            <span className="text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(mockStats.modules).map(([key, stats]) => (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 ${getModuleColor(key)} rounded-lg text-white`}>
                        {getModuleIcon(key)}
                      </div>
                      <Badge variant="secondary">{stats.active} active</Badge>
                    </div>
                    <CardTitle className="capitalize">{key} Cleanliness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Issues</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Response Time</span>
                        <span className="font-medium">{stats.avgTime} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cleanliness Score</span>
                        <span className="font-medium">{stats.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stats.score}%` }}
                        />
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>SLA Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{mockStats.performance.slaCompliance}%</div>
                    <p className="text-sm text-gray-600 mt-2">On-time resolution rate</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                      <div 
                        className="bg-green-600 h-3 rounded-full" 
                        style={{ width: `${mockStats.performance.slaCompliance}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Repeat Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{mockStats.performance.repeatIssueRate}%</div>
                    <p className="text-sm text-gray-600 mt-2">Same location complaints</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                      <div 
                        className="bg-orange-600 h-3 rounded-full" 
                        style={{ width: `${mockStats.performance.repeatIssueRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>First Time Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{mockStats.performance.firstTimeResolution}%</div>
                    <p className="text-sm text-gray-600 mt-2">No follow-up needed</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${mockStats.performance.firstTimeResolution}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{mockStats.performance.avgResponseTime}m</div>
                    <p className="text-sm text-gray-600 mt-2">From complaint to action</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                      <div 
                        className="bg-purple-600 h-3 rounded-full" 
                        style={{ width: `${100 - (mockStats.performance.avgResponseTime * 2)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
                <CardDescription>Top performing team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStaffPerformance.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-600">{staff.tasks} tasks completed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-600">Avg Time</p>
                            <p className="font-medium">{staff.avgTime}m</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Efficiency</p>
                            <p className="font-medium">{staff.efficiency}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Rating</p>
                            <p className="font-medium">⭐ {staff.rating}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Daily Report', description: 'Today\'s complete overview', icon: FileText, color: 'bg-blue-500' },
                { title: 'Train Performance', description: 'Train-wise cleanliness data', icon: Train, color: 'bg-green-500' },
                { title: 'Station Report', description: 'Platform cleanliness metrics', icon: MapPin, color: 'bg-orange-500' },
                { title: 'Staff Analytics', description: 'Team performance insights', icon: Users, color: 'bg-purple-500' },
                { title: 'SLA Compliance', description: 'Service level agreement report', icon: Target, color: 'bg-red-500' },
                { title: 'Customer Feedback', description: 'Satisfaction and ratings', icon: CheckCircle, color: 'bg-indigo-500' },
              ].map((report, index) => {
                const Icon = report.icon
                return (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => window.open(`/api/reports?type=${report.title.toLowerCase().replace(' ', '_')}&format=json`, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          JSON
                        </Button>
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => window.open(`/api/reports?type=${report.title.toLowerCase().replace(' ', '_')}&format=csv`, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}