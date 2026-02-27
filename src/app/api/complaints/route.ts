import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ComplaintType, Severity, Status } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const type = formData.get('type') as string;
    const issueType = formData.get('issueType') as string;
    const description = formData.get('description') as string;
    const reporterName = formData.get('reporterName') as string;
    const reporterPhone = formData.get('reporterPhone') as string;
    const reporterEmail = formData.get('reporterEmail') as string;
    const trainNumber = formData.get('trainNumber') as string;
    const coachNumber = formData.get('coachNumber') as string;
    const stationCode = formData.get('stationCode') as string;
    const platformNumber = formData.get('platformNumber') as string;
    const photo = formData.get('photo') as File;

    // Generate complaint number
    const complaintNumber = `RC${Date.now().toString().slice(-8)}`;

    // Map issue type to complaint type
    let complaintType: ComplaintType;
    switch (type) {
      case 'coach':
        complaintType = ComplaintType.COACH_CLEANLINESS;
        break;
      case 'food':
        complaintType = ComplaintType.FOOD_QUALITY;
        break;
      case 'platform':
        complaintType = ComplaintType.PLATFORM_CLEANLINESS;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid complaint type' },
          { status: 400 }
        );
    }

    // Determine severity based on issue type
    let severity: Severity = Severity.MEDIUM;
    if (issueType.includes('ac_not_working') || issueType.includes('water_leakage')) {
      severity = Severity.HIGH;
    } else if (issueType.includes('bad_smell') || issueType.includes('garbage_overflow')) {
      severity = Severity.MEDIUM;
    } else {
      severity = Severity.LOW;
    }

    // Calculate SLA deadline (30 minutes from now for most issues)
    const slaDeadline = new Date();
    slaDeadline.setMinutes(slaDeadline.getMinutes() + 30);

    // Create complaint in database
    const complaint = await db.complaint.create({
      data: {
        complaintNumber,
        type: complaintType,
        description,
        severity,
        status: Status.PENDING,
        reporterName: reporterName || null,
        reporterPhone: reporterPhone || null,
        reporterEmail: reporterEmail || null,
        slaDeadline,
        // Location-specific data will be handled in a real implementation
        // For now, we'll create mock references
        trainId: trainNumber ? 'mock-train-id' : null,
        stationId: stationCode ? 'mock-station-id' : null,
      },
    });

    // Handle photo upload if present
    if (photo) {
      // In a real implementation, you would upload to a cloud storage service
      // For now, we'll just simulate it
      console.log('Photo uploaded:', photo.name);
    }

    // TODO: Send notification to relevant staff
    // TODO: Create task assignment logic

    return NextResponse.json({
      success: true,
      complaintNumber,
      message: 'Complaint submitted successfully',
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (type) where.type = type.toUpperCase();

    const complaints = await db.complaint.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        train: type === 'COACH_CLEANLINESS',
        station: type === 'PLATFORM_CLEANLINESS',
        assignedTo: true,
      },
    });

    return NextResponse.json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}