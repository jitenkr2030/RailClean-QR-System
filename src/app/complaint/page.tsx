'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  MapPin, 
  Train,
  Utensils,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const issueTypes = {
  coach: [
    { value: 'dirty_seat', label: 'Dirty Seat' },
    { value: 'washroom_not_clean', label: 'Washroom Not Clean' },
    { value: 'bad_smell', label: 'Bad Smell' },
    { value: 'garbage_overflow', label: 'Garbage Overflow' },
    { value: 'bedroll_not_clean', label: 'Bedroll Not Clean' },
    { value: 'ac_not_working', label: 'AC Not Working' },
  ],
  food: [
    { value: 'food_taste', label: 'Food Taste Issue' },
    { value: 'hygiene_issue', label: 'Hygiene Issue' },
    { value: 'packaging_problem', label: 'Packaging Problem' },
    { value: 'delivery_time', label: 'Delivery Time Issue' },
    { value: 'wrong_order', label: 'Wrong Order' },
  ],
  platform: [
    { value: 'garbage', label: 'Garbage' },
    { value: 'dirty_floor', label: 'Dirty Floor' },
    { value: 'spitting', label: 'Spitting' },
    { value: 'water_leakage', label: 'Water Leakage' },
    { value: 'animal_issue', label: 'Animal Issue' },
  ]
}

export default function ComplaintPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    type: '',
    issueType: '',
    description: '',
    reporterName: '',
    reporterPhone: '',
    reporterEmail: '',
    trainNumber: '',
    coachNumber: '',
    platformNumber: '',
    stationCode: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [complaintNumber, setComplaintNumber] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create form data for file upload
      const submitData = new FormData()
      submitData.append('type', formData.type)
      submitData.append('issueType', formData.issueType)
      submitData.append('description', formData.description)
      submitData.append('reporterName', formData.reporterName)
      submitData.append('reporterPhone', formData.reporterPhone)
      submitData.append('reporterEmail', formData.reporterEmail)
      
      if (selectedFile) {
        submitData.append('photo', selectedFile)
      }

      // Add location-specific data
      if (formData.type === 'coach') {
        submitData.append('trainNumber', formData.trainNumber)
        submitData.append('coachNumber', formData.coachNumber)
      } else if (formData.type === 'platform') {
        submitData.append('stationCode', formData.stationCode)
        submitData.append('platformNumber', formData.platformNumber)
      }

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: submitData,
      })

      if (response.ok) {
        const data = await response.json()
        setComplaintNumber(data.complaintNumber)
        setSubmitted(true)
      } else {
        throw new Error('Failed to submit complaint')
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      alert('Failed to submit complaint. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your complaint has been registered successfully.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Complaint Number</p>
              <p className="text-xl font-bold text-blue-600">{complaintNumber}</p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              We will notify you once the issue is resolved. Expected resolution time: 30 minutes
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTypeIcon = () => {
    switch (formData.type) {
      case 'coach': return <Train className="w-5 h-5" />
      case 'food': return <Utensils className="w-5 h-5" />
      case 'platform': return <MapPin className="w-5 h-5" />
      default: return <AlertCircle className="w-5 h-5" />
    }
  }

  const getTypeColor = () => {
    switch (formData.type) {
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
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              {formData.type && (
                <div className={`p-2 ${getTypeColor()} rounded-lg text-white`}>
                  {getTypeIcon()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">Report Issue</h1>
                <p className="text-sm text-gray-500">
                  {formData.type ? `${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Issue` : 'Select issue type'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          {/* Issue Type Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">What type of issue?</CardTitle>
              <CardDescription>
                Select the category that best describes your issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'coach', label: 'Coach Cleanliness', icon: Train, color: 'bg-blue-500' },
                  { id: 'food', label: 'Food Quality', icon: Utensils, color: 'bg-green-500' },
                  { id: 'platform', label: 'Platform Cleanliness', icon: MapPin, color: 'bg-orange-500' },
                ].map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleInputChange('type', type.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-gray-900">{type.label}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {formData.type && (
            <>
              {/* Specific Issue Type */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">What's the specific issue?</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={formData.issueType} onValueChange={(value) => handleInputChange('issueType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specific issue" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes[formData.type as keyof typeof issueTypes]?.map((issue) => (
                        <SelectItem key={issue.value} value={issue.value}>
                          {issue.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Location Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.type === 'coach' && (
                    <>
                      <div>
                        <Label htmlFor="trainNumber">Train Number</Label>
                        <Input
                          id="trainNumber"
                          placeholder="e.g., 12345"
                          value={formData.trainNumber}
                          onChange={(e) => handleInputChange('trainNumber', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="coachNumber">Coach Number</Label>
                        <Input
                          id="coachNumber"
                          placeholder="e.g., A2, S5"
                          value={formData.coachNumber}
                          onChange={(e) => handleInputChange('coachNumber', e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {formData.type === 'platform' && (
                    <>
                      <div>
                        <Label htmlFor="stationCode">Station Code</Label>
                        <Input
                          id="stationCode"
                          placeholder="e.g., NDLS, BCT"
                          value={formData.stationCode}
                          onChange={(e) => handleInputChange('stationCode', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="platformNumber">Platform Number</Label>
                        <Input
                          id="platformNumber"
                          placeholder="e.g., 3, 5"
                          value={formData.platformNumber}
                          onChange={(e) => handleInputChange('platformNumber', e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Describe the issue</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Please provide details about the issue..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    required
                  />
                </CardContent>
              </Card>

              {/* Photo Upload */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Add Photo (Optional)</CardTitle>
                  <CardDescription>
                    Help us understand the issue better with a photo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Camera className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Your Contact (Optional)</CardTitle>
                  <CardDescription>
                    We'll notify you when the issue is resolved
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reporterName">Your Name</Label>
                    <Input
                      id="reporterName"
                      placeholder="Enter your name"
                      value={formData.reporterName}
                      onChange={(e) => handleInputChange('reporterName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reporterPhone">Phone Number</Label>
                    <Input
                      id="reporterPhone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.reporterPhone}
                      onChange={(e) => handleInputChange('reporterPhone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reporterEmail">Email Address</Label>
                    <Input
                      id="reporterEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.reporterEmail}
                      onChange={(e) => handleInputChange('reporterEmail', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting || !formData.type || !formData.issueType || !formData.description}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </>
          )}
        </form>
      </main>
    </div>
  )
}