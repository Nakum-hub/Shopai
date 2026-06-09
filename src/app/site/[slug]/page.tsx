import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Serves a deployed storefront's HTML as a standalone page.
 * Looks up the storefront by its slug (stored in the `url` field).
 */
export default async function DeployedSitePage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // Look up by url field (stores the slug) or by matching deploymentUrl suffix
  const storefront = await db.storefront.findFirst({
    where: {
      OR: [
        { url: slug },
        { deploymentUrl: { endsWith: `/site/${slug}` } },
      ],
      deploymentStatus: 'deployed',
    },
    select: {
      id: true,
      html: true,
      businessName: true,
    },
  });

  if (!storefront || !storefront.html) {
    notFound();
  }

  // Increment view count (fire-and-forget)
  db.storefront.update({
    where: { id: storefront.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => { /* silent */ });

  // Inject a tracking pixel and charset if not present
  let html = storefront.html;
  if (!html.includes('<meta charset')) {
    html = html.replace('<head>', '<head>\n<meta charset="utf-8">');
  }

  return (
    <html>
      <head>
        <title>{storefront.businessName || 'StoreCraft Site'}</title>
      </head>
      <body>
        <iframe
          srcDoc={html}
          title={storefront.businessName || 'Deployed Site'}
          style={{
            width: '100%',
            height: '100vh',
            border: 'none',
            margin: 0,
            padding: 0,
            display: 'block',
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </body>
    </html>
  );
}
