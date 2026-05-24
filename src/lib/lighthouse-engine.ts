// =============================================================================
// StoreCraft AI — Lighthouse Auto-Validation Engine (Static Analysis)
// =============================================================================

// =============================================================================
// Types
// =============================================================================

interface CategoryScore {
  score: number;
  passed: boolean;
  auditResults: AuditResult[];
}

interface AuditResult {
  id: string;
  title: string;
  description: string;
  score: number;
  weight: number;
  displayValue?: string;
}

interface LighthouseReport {
  performance: CategoryScore;
  accessibility: CategoryScore;
  bestPractices: CategoryScore;
  seo: CategoryScore;
  pwa: CategoryScore;
  overall: number;
  generatedAt: string;
  audits: AuditResult[];
}

// =============================================================================
// Helpers
// =============================================================================

function extractCSS(html: string): string {
  const matches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  return matches.map(m => m[1]).join('\n');
}

function stripTags(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

// =============================================================================
// Lighthouse Engine
// =============================================================================

class LighthouseEngine {

  /** Run full Lighthouse-style audit on HTML */
  runLighthouseAudit(html: string, url: string = 'generated-page'): LighthouseReport {
    const css = extractCSS(html);
    const generatedAt = new Date().toISOString();

    const perf = this.runPerformanceAudit(html, css);
    const a11y = this.runAccessibilityAudit(html);
    const bp = this.runBestPracticesAudit(html, css);
    const seo = this.runSEOAudit(html);
    const pwa = this.runPWAAudit(html);

    const overall = Math.round(
      perf.score * 0.30 + a11y.score * 0.25 +
      bp.score * 0.25 + seo.score * 0.15 + pwa.score * 0.05
    );

    const allAudits = [
      ...perf.auditResults, ...a11y.auditResults,
      ...bp.auditResults, ...seo.auditResults, ...pwa.auditResults,
    ];

    return {
      performance: perf,
      accessibility: a11y,
      bestPractices: bp,
      seo: seo,
      pwa: pwa,
      overall,
      generatedAt,
      audits: allAudits,
    };
  }

  // ─── Performance Audit ───────────────────────────────────────────────

  private runPerformanceAudit(html: string, css: string): CategoryScore {
    const results: AuditResult[] = [];
    const htmlSize = Buffer.byteLength(html, 'utf-8');
    const cssSize = Buffer.byteLength(css, 'utf-8');

    // HTML size check
    const htmlSizeScore = htmlSize <= 50000 ? 100 : htmlSize <= 100000 ? 80 : htmlSize <= 200000 ? 50 : 20;
    results.push({ id: 'html-size', title: 'HTML Size', description: `HTML is ${this.formatBytes(htmlSize)}`, score: htmlSizeScore, weight: 10, displayValue: this.formatBytes(htmlSize) });

    // CSS size check
    const cssSizeScore = cssSize <= 20000 ? 100 : cssSize <= 50000 ? 80 : cssSize <= 100000 ? 50 : 20;
    results.push({ id: 'css-size', title: 'CSS Size', description: `Inline CSS is ${this.formatBytes(cssSize)}`, score: cssSizeScore, weight: 8, displayValue: this.formatBytes(cssSize) });

    // Viewport meta in critical path
    const viewportInHead = /<head[^>]*>[\s\S]*?<meta[^>]+viewport/i.test(html);
    const viewportScore = viewportInHead ? 100 : 0;
    results.push({ id: 'viewport-meta', title: 'Viewport Meta', description: viewportInHead ? 'Viewport meta tag present in <head>' : 'Viewport meta tag missing or not in <head>', score: viewportScore, weight: 15 });

    // Render-blocking resources
    const headScripts = (html.match(/<head[^>]*>[\s\S]*?<\/head>/i) || [''])[0];
    const externalScripts = (headScripts.match(/<script[^>]*src=/gi) || []).length;
    const externalStyles = (headScripts.match(/<link[^>]*stylesheet/gi) || []).length;
    const renderBlocking = externalScripts + externalStyles;
    const renderBlockingScore = renderBlocking === 0 ? 100 : renderBlocking <= 2 ? 70 : renderBlocking <= 4 ? 40 : 10;
    results.push({ id: 'render-blocking', title: 'Render-Blocking Resources', description: `${renderBlocking} render-blocking resources in <head>`, score: renderBlockingScore, weight: 15, displayValue: `${renderBlocking} resources` });

    // Image optimization
    const images = [...html.matchAll(/<img[^>]*>/gi)];
    const totalImages = images.length;
    const lazyImages = images.filter(img => /loading\s*=\s*["']lazy["']/i.test(img[0])).length;
    const lazyScore = totalImages <= 1 ? 100 : lazyImages / totalImages >= 0.7 ? 100 : lazyImages / totalImages >= 0.4 ? 70 : 30;
    results.push({ id: 'image-lazy', title: 'Offscreen Images', description: `${lazyImages}/${totalImages} images use lazy loading`, score: lazyScore, weight: 12, displayValue: `${lazyImages}/${totalImages}` });

    // DOM complexity
    const domNodes = (html.match(/<[a-z][a-z0-9]*[\s>]/gi) || []).length;
    const domScore = domNodes <= 500 ? 100 : domNodes <= 1000 ? 80 : domNodes <= 1500 ? 60 : domNodes <= 2000 ? 40 : 20;
    results.push({ id: 'dom-size', title: 'DOM Size', description: `${domNodes} elements`, score: domScore, weight: 10, displayValue: `${domNodes} nodes` });

    // HTTPS resources
    const httpResources = (html.match(/https?:\/\/(?!localhost|127\.0\.0\.1)[^"'\s)]+/gi) || [])
      .filter(u => u.startsWith('http://')).length;
    const httpsScore = httpResources === 0 ? 100 : httpResources <= 2 ? 60 : 20;
    results.push({ id: 'https-resources', title: 'Uses HTTPS', description: httpResources === 0 ? 'All resources use HTTPS' : `${httpResources} HTTP resources found`, score: httpsScore, weight: 8, displayValue: httpResources === 0 ? 'Secure' : `${httpResources} insecure` });

    // Total size estimation
    const totalSize = htmlSize + cssSize;
    const totalScore = totalSize <= 100000 ? 100 : totalSize <= 200000 ? 85 : totalSize <= 500000 ? 60 : 30;
    results.push({ id: 'total-size', title: 'Total Page Size', description: `${this.formatBytes(totalSize)}`, score: totalScore, weight: 12, displayValue: this.formatBytes(totalSize) });

    const weightedSum = results.reduce((sum, r) => sum + r.score * r.weight, 0);
    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const score = Math.round(weightedSum / totalWeight);

    return { score, passed: score >= 70, auditResults: results };
  }

  // ─── Accessibility Audit (lightweight) ───────────────────────────────

  private runAccessibilityAudit(html: string): CategoryScore {
    const results: AuditResult[] = [];
    let passCount = 0, totalChecks = 0;

    // Document title
    const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
    results.push({ id: 'doc-title', title: 'Document Title', description: hasTitle ? 'Page has a <title>' : 'Missing <title>', score: hasTitle ? 100 : 0, weight: 15 });
    totalChecks++; if (hasTitle) passCount++;

    // Lang attribute
    const hasLang = /<html[^>]+lang=/i.test(html);
    results.push({ id: 'html-lang', title: 'HTML lang', description: hasLang ? 'lang attribute present' : 'Missing lang', score: hasLang ? 100 : 0, weight: 10 });
    totalChecks++; if (hasLang) passCount++;

    // Image alt text
    const images = [...html.matchAll(/<img[^>]*>/gi)];
    const imgsWithAlt = images.filter(img => /alt\s*=/i.test(img[0])).length;
    const imgAltScore = images.length === 0 ? 100 : Math.round((imgsWithAlt / images.length) * 100);
    results.push({ id: 'image-alt', title: 'Image Alt Text', description: `${imgsWithAlt}/${images.length} images have alt`, score: imgAltScore, weight: 20, displayValue: `${imgsWithAlt}/${images.length}` });
    totalChecks++; if (imgAltScore >= 80) passCount++;

    // ARIA labels on buttons
    const buttons = [...html.matchAll(/<button[^>]*>/gi)];
    const labeledButtons = buttons.filter(btn => /aria-label|aria-labelledby/i.test(btn[0]) || /<button[^>]*>[^<]+/i.test(btn[0])).length;
    const btnScore = buttons.length === 0 ? 100 : Math.round((labeledButtons / buttons.length) * 100);
    results.push({ id: 'button-name', title: 'Button Names', description: `${labeledButtons}/${buttons.length} buttons labeled`, score: btnScore, weight: 15, displayValue: `${labeledButtons}/${buttons.length}` });
    totalChecks++; if (btnScore >= 80) passCount++;

    // Main landmark
    const hasMain = /<main[\s>]/i.test(html);
    results.push({ id: 'main-landmark', title: 'Main Landmark', description: hasMain ? '<main> present' : 'Missing <main>', score: hasMain ? 100 : 0, weight: 15 });
    totalChecks++; if (hasMain) passCount++;

    // Heading hierarchy
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const headingScore = h1Count === 1 ? 100 : h1Count === 0 ? 50 : 30;
    results.push({ id: 'heading-h1', title: 'Single H1', description: h1Count === 1 ? 'Exactly one H1' : `${h1Count} H1 headings`, score: headingScore, weight: 10, displayValue: `${h1Count}` });
    totalChecks++; if (h1Count === 1) passCount++;

    // No deprecated tags
    const hasDeprecated = /<(center|font|marquee|blink|frame|frameset)[\s>]/i.test(html);
    results.push({ id: 'no-deprecated', title: 'No Deprecated Tags', description: hasDeprecated ? 'Deprecated tags found' : 'No deprecated tags', score: hasDeprecated ? 0 : 100, weight: 10 });
    totalChecks++; if (!hasDeprecated) passCount++;

    // Viewport meta
    const hasViewport = /<meta[^>]+viewport/i.test(html);
    results.push({ id: 'viewport', title: 'Viewport', description: hasViewport ? 'Viewport configured' : 'Missing viewport', score: hasViewport ? 100 : 0, weight: 5 });
    totalChecks++; if (hasViewport) passCount++;

    const score = Math.round((passCount / totalChecks) * 100);
    return { score, passed: score >= 70, auditResults: results };
  }

  // ─── Best Practices Audit ────────────────────────────────────────────

  private runBestPracticesAudit(html: string, css: string): CategoryScore {
    const results: AuditResult[] = [];
    let passCount = 0, totalChecks = 0;

    // DOCTYPE
    const hasDoctype = /<!doctype\s+html/i.test(html);
    results.push({ id: 'doctype', title: 'DOCTYPE', description: hasDoctype ? 'HTML5 DOCTYPE' : 'Missing DOCTYPE', score: hasDoctype ? 100 : 0, weight: 15 });
    totalChecks++; if (hasDoctype) passCount++;

    // Charset
    const hasCharset = /<meta[^>]+charset/i.test(html);
    results.push({ id: 'charset', title: 'Charset', description: hasCharset ? 'Charset declared' : 'Missing charset', score: hasCharset ? 100 : 0, weight: 10 });
    totalChecks++; if (hasCharset) passCount++;

    // Viewport
    const hasViewport = /<meta[^>]+viewport/i.test(html);
    results.push({ id: 'viewport-bp', title: 'Viewport Meta', description: hasViewport ? 'Mobile viewport' : 'No viewport', score: hasViewport ? 100 : 0, weight: 10 });
    totalChecks++; if (hasViewport) passCount++;

    // HTTPS
    const hasHttp = /(?:src|href)\s*=\s*["']http:\/\//i.test(html);
    results.push({ id: 'https-bp', title: 'Uses HTTPS', description: hasHttp ? 'HTTP resources found' : 'All HTTPS', score: hasHttp ? 30 : 100, weight: 15 });
    totalChecks++; if (!hasHttp) passCount++;

    // No deprecated tags
    const hasDeprecated = /<(center|font|marquee|blink|frame|frameset)[\s>]/i.test(html);
    results.push({ id: 'deprecated-bp', title: 'No Deprecated Elements', description: hasDeprecated ? 'Deprecated found' : 'Clean HTML', score: hasDeprecated ? 0 : 100, weight: 15 });
    totalChecks++; if (!hasDeprecated) passCount++;

    // No errors in console (check for inline error handlers)
    const hasInlineHandlers = /onerror\s*=/i.test(html);
    results.push({ id: 'no-onerror', title: 'No Error Handlers', description: hasInlineHandlers ? 'Inline onerror found' : 'No inline error handlers', score: hasInlineHandlers ? 40 : 100, weight: 10 });
    totalChecks++; if (!hasInlineHandlers) passCount++;

    // Responsive (media queries)
    const hasMediaQuery = css.includes('@media');
    results.push({ id: 'responsive-bp', title: 'Responsive Design', description: hasMediaQuery ? 'Media queries found' : 'No responsive styles', score: hasMediaQuery ? 100 : 30, weight: 15 });
    totalChecks++; if (hasMediaQuery) passCount++;

    // Images have dimensions or styles
    const imgsWithSize = [...html.matchAll(/<img[^>]*>/gi)].filter(img => /width|height|style/i.test(img[0])).length;
    const totalImgs = [...html.matchAll(/<img[^>]*>/gi)].length;
    const sizeScore = totalImgs === 0 ? 100 : Math.round((imgsWithSize / totalImgs) * 100);
    results.push({ id: 'image-size', title: 'Image Dimensions', description: `${imgsWithSize}/${totalImgs} images have explicit dimensions`, score: sizeScore, weight: 10, displayValue: `${imgsWithSize}/${totalImgs}` });
    totalChecks++; if (sizeScore >= 70) passCount++;

    const score = Math.round((passCount / totalChecks) * 100);
    return { score, passed: score >= 70, auditResults: results };
  }

  // ─── SEO Audit ───────────────────────────────────────────────────────

  private runSEOAudit(html: string): CategoryScore {
    const results: AuditResult[] = [];
    let passCount = 0, totalChecks = 0;

    // Title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const titleLen = titleMatch ? titleMatch[1].trim().length : 0;
    const titleScore = titleLen >= 10 && titleLen <= 60 ? 100 : titleLen > 0 ? 70 : 0;
    results.push({ id: 'seo-title', title: 'Page Title', description: titleLen > 0 ? `Title: ${titleLen} chars` : 'Missing title', score: titleScore, weight: 20, displayValue: `${titleLen} chars` });
    totalChecks++; if (titleScore >= 70) passCount++;

    // Meta description
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const descLen = metaDescMatch ? metaDescMatch[1].trim().length : 0;
    const descScore = descLen >= 50 && descLen <= 160 ? 100 : descLen > 0 ? 60 : 0;
    results.push({ id: 'meta-desc', title: 'Meta Description', description: descLen > 0 ? `${descLen} chars` : 'Missing', score: descScore, weight: 20, displayValue: `${descLen} chars` });
    totalChecks++; if (descScore >= 60) passCount++;

    // H1
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const h1Score = h1Count === 1 ? 100 : 0;
    results.push({ id: 'seo-h1', title: 'H1 Heading', description: h1Count === 1 ? 'Single H1' : `${h1Count} H1s`, score: h1Score, weight: 15 });
    totalChecks++; if (h1Score === 100) passCount++;

    // robots meta
    const hasRobots = /<meta[^>]+name=["']robots["']/i.test(html);
    results.push({ id: 'robots', title: 'Robots Meta', description: hasRobots ? 'Present' : 'Missing', score: hasRobots ? 100 : 50, weight: 10 });
    totalChecks++; if (hasRobots) passCount++;

    // Open Graph
    const hasOg = /<meta[^>]+property=["']og:/i.test(html);
    results.push({ id: 'open-graph', title: 'Open Graph', description: hasOg ? 'OG tags present' : 'No OG tags', score: hasOg ? 100 : 30, weight: 15 });
    totalChecks++; if (hasOg) passCount++;

    // Image alt for SEO
    const images = [...html.matchAll(/<img[^>]*>/gi)];
    const imgWithAlt = images.filter(img => /alt\s*=\s*["'][^"']+["']/i.test(img[0])).length;
    const altScore = images.length === 0 ? 100 : Math.round((imgWithAlt / images.length) * 100);
    results.push({ id: 'seo-img-alt', title: 'Image Alt for SEO', description: `${imgWithAlt}/${images.length}`, score: altScore, weight: 10, displayValue: `${imgWithAlt}/${images.length}` });
    totalChecks++; if (altScore >= 80) passCount++;

    // Canonical
    const hasCanonical = /<link[^>]+rel\s*=\s*["']canonical["']/i.test(html);
    results.push({ id: 'canonical', title: 'Canonical URL', description: hasCanonical ? 'Present' : 'Missing', score: hasCanonical ? 100 : 50, weight: 10 });
    totalChecks++; if (hasCanonical) passCount++;

    const score = Math.round((passCount / totalChecks) * 100);
    return { score, passed: score >= 70, auditResults: results };
  }

  // ─── PWA Audit ───────────────────────────────────────────────────────

  private runPWAAudit(html: string): CategoryScore {
    const results: AuditResult[] = [];

    const hasManifest = /<link[^>]+rel\s*=\s*["']manifest["']/i.test(html);
    results.push({ id: 'pwa-manifest', title: 'Web App Manifest', description: hasManifest ? 'Manifest linked' : 'No manifest', score: hasManifest ? 100 : 0, weight: 40 });

    const hasSW = /navigator\.serviceWorker/i.test(html);
    results.push({ id: 'pwa-sw', title: 'Service Worker', description: hasSW ? 'SW registered' : 'No service worker', score: hasSW ? 100 : 0, weight: 40 });

    const hasViewport = /<meta[^>]+viewport/i.test(html);
    results.push({ id: 'pwa-viewport', title: 'Viewport Meta', description: hasViewport ? 'Configured' : 'Missing', score: hasViewport ? 100 : 0, weight: 10 });

    const hasThemeColor = /<meta[^>]+name=["']theme-color["']/i.test(html);
    results.push({ id: 'pwa-theme-color', title: 'Theme Color', description: hasThemeColor ? 'Set' : 'Missing', score: hasThemeColor ? 100 : 0, weight: 10 });

    const score = Math.round(results.reduce((s, r) => s + r.score * r.weight, 0) / results.reduce((s, r) => s + r.weight, 0));
    return { score, passed: score >= 50, auditResults: results };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}

export const lighthouseEngine = new LighthouseEngine();
export type { LighthouseReport, CategoryScore, AuditResult };
