import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const storefronts = await db.storefront.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ storefronts });
  } catch (error) {
    console.error('[STOREFRONTS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch storefronts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, businessName, category, description, html, businessProfile } = body;

    if (!name || !businessName) {
      return NextResponse.json(
        { error: 'Name and businessName are required' },
        { status: 400 }
      );
    }

    const storefront = await db.storefront.create({
      data: {
        name,
        businessName,
        category: category || 'other',
        description: description || null,
        html: html || null,
        businessProfile: businessProfile ? JSON.stringify(businessProfile) : null,
        status: html ? 'ready' : 'draft',
      },
    });

    return NextResponse.json({ storefront }, { status: 201 });
  } catch (error) {
    console.error('[STOREFRONTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create storefront' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Storefront ID is required' },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.html !== undefined) data.html = updates.html;
    if (updates.businessProfile !== undefined) data.businessProfile = JSON.stringify(updates.businessProfile);
    if (updates.deploymentStatus !== undefined) data.deploymentStatus = updates.deploymentStatus;
    if (updates.deploymentUrl !== undefined) data.deploymentUrl = updates.deploymentUrl;
    if (updates.publishedAt !== undefined) data.publishedAt = updates.publishedAt ? new Date(updates.publishedAt) : null;

    const storefront = await db.storefront.update({
      where: { id },
      data,
    });

    return NextResponse.json({ storefront });
  } catch (error) {
    console.error('[STOREFRONTS_PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update storefront' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Storefront ID is required' },
        { status: 400 }
      );
    }

    await db.storefront.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[STOREFRONTS_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete storefront' },
      { status: 500 }
    );
  }
}
