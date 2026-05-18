import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, createStorefrontSchema, updateStorefrontSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const storefronts = await db.storefront.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category }),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.storefront.count({
      where: {
        ...(status && { status }),
        ...(category && { category }),
      },
    });

    return NextResponse.json({
      storefronts,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error('[STOREFRONTS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch storefronts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateInput(createStorefrontSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, businessName, category, description, html, businessProfile } = validation.data;

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
    return NextResponse.json({ error: 'Failed to create storefront' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateInput(updateStorefrontSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { id, ...updates } = validation.data;

    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.businessName !== undefined) data.businessName = updates.businessName;
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.html !== undefined) data.html = updates.html;
    if (updates.businessProfile !== undefined) data.businessProfile = JSON.stringify(updates.businessProfile);
    if (updates.deploymentStatus !== undefined) data.deploymentStatus = updates.deploymentStatus;
    if (updates.deploymentUrl !== undefined) data.deploymentUrl = updates.deploymentUrl;
    if (updates.publishedAt !== undefined) data.publishedAt = updates.publishedAt ? new Date(updates.publishedAt) : null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const storefront = await db.storefront.update({
      where: { id },
      data,
    });

    return NextResponse.json({ storefront });
  } catch (error) {
    console.error('[STOREFRONTS_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update storefront' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Storefront ID is required' }, { status: 400 });
    }

    await db.storefront.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[STOREFRONTS_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete storefront' }, { status: 500 });
  }
}
