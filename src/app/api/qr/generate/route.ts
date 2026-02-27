import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    // Generate unique QR code ID
    const qrId = uuidv4();
    
    // Create QR code data with metadata
    const qrData = {
      id: qrId,
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Save QR code to database based on type
    switch (type) {
      case 'coach':
        if (data.trainId && data.coachNumber) {
          await db.coach.update({
            where: { id: data.coachId },
            data: { qrCode: qrId },
          });
        }
        break;
      case 'platform':
        if (data.stationId && data.platformNumber) {
          await db.platform.update({
            where: { id: data.platformId },
            data: { qrCode: qrId },
          });
        }
        break;
      case 'food':
        if (data.foodItemId) {
          await db.foodItem.update({
            where: { id: data.foodItemId },
            data: { qrCode: qrId },
          });
        }
        break;
    }

    return NextResponse.json({
      success: true,
      qrId,
      qrCodeDataUrl,
      qrData,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    let items = [];
    
    switch (type) {
      case 'coach':
        items = await db.coach.findMany({
          include: {
            train: true,
          },
        });
        break;
      case 'platform':
        items = await db.platform.findMany({
          include: {
            station: true,
          },
        });
        break;
      case 'food':
        items = await db.foodItem.findMany({
          where: { isActive: true },
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be coach, platform, or food' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error('Error fetching QR data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR data' },
      { status: 500 }
    );
  }
}