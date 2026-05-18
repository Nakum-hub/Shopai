import { NextRequest, NextResponse } from 'next/server';

// Mock analytics data - in production, would aggregate from analytics DB
const generateMockAnalytics = (days: number) => {
  const dailyViews = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    dailyViews.push({
      date: dateStr,
      views: Math.floor(Math.random() * 80 + 20),
      visitors: Math.floor(Math.random() * 50 + 10),
    });
  }

  const totalViews = dailyViews.reduce((s, d) => s + d.views, 0);
  const uniqueVisitors = dailyViews.reduce((s, d) => s + d.visitors, 0);
  const previousViews = totalViews * (1 - Math.random() * 0.2 - 0.05);
  const previousVisitors = uniqueVisitors * (1 - Math.random() * 0.15 - 0.03);

  return {
    totalViews,
    uniqueVisitors,
    viewsChange: ((totalViews - previousViews) / previousViews * 100).toFixed(1),
    visitorsChange: ((uniqueVisitors - previousVisitors) / previousVisitors * 100).toFixed(1),
    avgSessionDuration: '2m 34s',
    bounceRate: (Math.random() * 20 + 25).toFixed(1),
    bounceRateChange: (-(Math.random() * 8 + 1)).toFixed(1),
    topPages: [
      { page: 'Home', views: Math.floor(totalViews * 0.35), percentage: 35 },
      { page: 'Menu / Products', views: Math.floor(totalViews * 0.25), percentage: 25 },
      { page: 'About', views: Math.floor(totalViews * 0.18), percentage: 18 },
      { page: 'Contact', views: Math.floor(totalViews * 0.12), percentage: 12 },
      { page: 'Gallery', views: Math.floor(totalViews * 0.10), percentage: 10 },
    ],
    dailyViews,
    deviceBreakdown: [
      { device: 'Mobile', percentage: 62, sessions: Math.floor(uniqueVisitors * 0.62) },
      { device: 'Desktop', percentage: 28, sessions: Math.floor(uniqueVisitors * 0.28) },
      { device: 'Tablet', percentage: 10, sessions: Math.floor(uniqueVisitors * 0.10) },
    ],
    seoScore: Math.floor(Math.random() * 15 + 80),
    performanceScore: Math.floor(Math.random() * 15 + 75),
    accessibilityScore: Math.floor(Math.random() * 10 + 85),
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const storefrontId = searchParams.get('storefrontId');

    if (!storefrontId) {
      return NextResponse.json(
        { error: 'Storefront ID is required' },
        { status: 400 }
      );
    }

    // In production, fetch real analytics from DB
    // For now, return generated mock data
    const analytics = generateMockAnalytics(days);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('[ANALYTICS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
