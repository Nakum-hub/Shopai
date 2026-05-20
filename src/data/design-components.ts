import type {
  DesignComponentCategory,
  DesignStyle,
  DesignTheme,
} from '@/lib/types';

// =============================================================================
// Component Variant Interface
// =============================================================================

export interface ComponentVariant {
  id: string;
  name: string;
  style: DesignStyle;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popular: boolean;
  previewGradient: string;
}

// =============================================================================
// Expanded Component Variants — 15 per category
// =============================================================================

export const expandedComponentVariants: Record<
  DesignComponentCategory,
  ComponentVariant[]
> = {
  hero: [
    { id: 'hero-gradient', name: 'Gradient Overlays', style: 'gradient', description: 'Vibrant gradient background with text overlay and floating elements', tags: ['gradient', 'animated', 'modern'], difficulty: 'beginner', popular: true, previewGradient: 'from-violet-600 via-fuchsia-500 to-pink-500' },
    { id: 'hero-split', name: 'Split Layout', style: 'minimal', description: 'Side-by-side layout with image on one side and content on the other', tags: ['split', 'responsive', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-neutral-100 to-neutral-200' },
    { id: 'hero-centered', name: 'Centered Minimalist', style: 'minimal', description: 'Clean centered text with a single CTA button', tags: ['centered', 'minimal', 'elegant'], difficulty: 'beginner', popular: false, previewGradient: 'from-stone-50 to-stone-100' },
    { id: 'hero-dark', name: 'Dark Cinematic', style: 'dark', description: 'Dark background with dramatic lighting effects and bold typography', tags: ['dark', 'cinematic', 'bold'], difficulty: 'intermediate', popular: true, previewGradient: 'from-gray-900 via-slate-800 to-gray-900' },
    { id: 'hero-glass', name: 'Glassmorphism', style: 'glass', description: 'Frosted glass elements over a colorful background', tags: ['glass', 'blur', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-cyan-400 via-blue-500 to-purple-600' },
    { id: 'hero-3d', name: '3D Elements', style: 'bold', description: 'Floating 3D elements and perspective transforms', tags: ['3d', 'animated', 'interactive'], difficulty: 'advanced', popular: false, previewGradient: 'from-orange-500 via-red-500 to-pink-500' },
    { id: 'hero-retro-typewriter', name: 'Retro Typewriter', style: 'retro', description: 'Vintage typewriter-inspired hero with monospace font and aged paper texture', tags: ['retro', 'typewriter', 'vintage', 'monospace'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-100 via-yellow-50 to-orange-100' },
    { id: 'hero-retro-80s', name: '80s Synthwave', style: 'retro', description: 'Neon grid lines and sunset gradients inspired by 1980s retrofuturism', tags: ['retro', 'synthwave', 'neon', '80s'], difficulty: 'intermediate', popular: true, previewGradient: 'from-purple-900 via-pink-600 to-orange-500' },
    { id: 'hero-neo-soft', name: 'Neomorphic Soft', style: 'neomorphic', description: 'Soft-raised UI elements with subtle shadows on a neutral background', tags: ['neomorphic', 'soft', 'shadows', 'clean'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 to-gray-300' },
    { id: 'hero-brutalist-stack', name: 'Brutalist Stack', style: 'brutalist', description: 'Raw stacked typography with heavy black borders and stark contrasts', tags: ['brutalist', 'stacked', 'typography', 'raw'], difficulty: 'advanced', popular: false, previewGradient: 'from-yellow-400 to-black' },
    { id: 'hero-brutalist-construct', name: 'Brutalist Construct', style: 'brutalist', description: 'Geometric construction with offset blocks and monospace type', tags: ['brutalist', 'geometric', 'constructivist', 'bold'], difficulty: 'advanced', popular: false, previewGradient: 'from-red-600 via-white to-blue-600' },
    { id: 'hero-neo-card', name: 'Neo Card Float', style: 'neomorphic', description: 'Floating neomorphic card with inset details and soft gradient accents', tags: ['neomorphic', 'card', 'float', 'soft'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-200 to-slate-300' },
    { id: 'hero-dark-particles', name: 'Dark Particle Field', style: 'dark', description: 'Deep dark background with animated floating particles and glowing text', tags: ['dark', 'particles', 'animated', 'glow'], difficulty: 'advanced', popular: true, previewGradient: 'from-gray-950 via-black to-gray-900' },
    { id: 'hero-gradient-mesh', name: 'Gradient Mesh', style: 'gradient', description: 'Multi-point gradient mesh with smooth color transitions and organic shapes', tags: ['gradient', 'mesh', 'organic', 'modern'], difficulty: 'advanced', popular: false, previewGradient: 'from-rose-400 via-fuchsia-500 to-indigo-500' },
    { id: 'hero-glass-deep', name: 'Deep Glass Layers', style: 'glass', description: 'Multiple layered glass panels creating depth and dimensionality', tags: ['glass', 'layers', 'depth', 'modern'], difficulty: 'advanced', popular: false, previewGradient: 'from-indigo-400 via-purple-500 to-pink-500' },
  ],
  navigation: [
    { id: 'nav-sticky', name: 'Sticky White', style: 'minimal', description: 'Clean white navigation bar that sticks to the top on scroll', tags: ['sticky', 'clean', 'white'], difficulty: 'beginner', popular: true, previewGradient: 'from-white to-gray-50' },
    { id: 'nav-transparent', name: 'Transparent Overlay', style: 'minimal', description: 'Transparent nav that becomes solid on scroll', tags: ['transparent', 'overlay', 'hero'], difficulty: 'intermediate', popular: true, previewGradient: 'from-transparent to-black/20' },
    { id: 'nav-dark', name: 'Dark Mode', style: 'dark', description: 'Sleek dark navigation with light text', tags: ['dark', 'modern', 'elegant'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 to-gray-800' },
    { id: 'nav-mega', name: 'Mega Dropdown', style: 'bold', description: 'Expandable mega menu with multi-column dropdowns', tags: ['mega', 'dropdown', 'multi-column'], difficulty: 'advanced', popular: false, previewGradient: 'from-blue-50 to-indigo-50' },
    { id: 'nav-centered', name: 'Centered Links', style: 'minimal', description: 'Logo centered with links distributed on both sides', tags: ['centered', 'symmetric', 'clean'], difficulty: 'beginner', popular: false, previewGradient: 'from-neutral-50 to-neutral-100' },
    { id: 'nav-sidebar', name: 'Side Drawer', style: 'glass', description: 'Hamburger-triggered sidebar navigation', tags: ['sidebar', 'hamburger', 'mobile'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-800 to-slate-900' },
    { id: 'nav-retro-terminal', name: 'Retro Terminal Bar', style: 'retro', description: 'Terminal-style navigation with green monospace text and blinking cursor', tags: ['retro', 'terminal', 'monospace', 'hacker'], difficulty: 'beginner', popular: false, previewGradient: 'from-green-900 to-green-950' },
    { id: 'nav-retro-newspaper', name: 'Retro Newspaper', style: 'retro', description: 'Classic newspaper masthead style navigation with serif fonts and rules', tags: ['retro', 'newspaper', 'serif', 'classic'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-50 via-white to-stone-100' },
    { id: 'nav-neo-pill', name: 'Neomorphic Pill', style: 'neomorphic', description: 'Soft pill-shaped nav bar with inset icons and raised CTA button', tags: ['neomorphic', 'pill', 'soft', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 to-gray-300' },
    { id: 'nav-brutalist-raw', name: 'Brutalist Raw Bar', style: 'brutalist', description: 'Heavy black border navigation with all-caps links and no rounded corners', tags: ['brutalist', 'raw', 'heavy', 'uppercase'], difficulty: 'beginner', popular: false, previewGradient: 'from-white via-white to-black' },
    { id: 'nav-brutalist-offset', name: 'Brutalist Offset', style: 'brutalist', description: 'Navigation with intentionally offset positioning and mixed font weights', tags: ['brutalist', 'offset', 'asymmetric', 'bold'], difficulty: 'intermediate', popular: false, previewGradient: 'from-yellow-300 to-stone-900' },
    { id: 'nav-glass-floating', name: 'Glass Floating Bar', style: 'glass', description: 'Floating glass navigation with blur backdrop and translucent elements', tags: ['glass', 'floating', 'blur', 'translucent'], difficulty: 'intermediate', popular: true, previewGradient: 'from-sky-400/20 to-indigo-500/20' },
    { id: 'nav-gradient-animated', name: 'Gradient Animated Border', style: 'gradient', description: 'Navigation bar with an animated gradient border on the bottom edge', tags: ['gradient', 'animated', 'border', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-fuchsia-500 via-purple-500 to-indigo-500' },
    { id: 'nav-dark-neon', name: 'Dark Neon Glow', style: 'dark', description: 'Dark navigation with neon-colored accent lines and glowing active states', tags: ['dark', 'neon', 'glow', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-950 to-black' },
    { id: 'nav-bold-accent', name: 'Bold Accent Strip', style: 'bold', description: 'Navigation with a bold colored accent strip and oversized typography', tags: ['bold', 'accent', 'typography', 'strip'], difficulty: 'beginner', popular: false, previewGradient: 'from-rose-500 to-rose-600' },
  ],
  features: [
    { id: 'feat-icon-grid', name: 'Icon Grid', style: 'minimal', description: 'Grid of feature cards with icons and descriptions', tags: ['icons', 'grid', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-emerald-50 to-teal-50' },
    { id: 'feat-alternating', name: 'Alternating Rows', style: 'bold', description: 'Alternating image-text rows for feature showcases', tags: ['alternating', 'images', 'storytelling'], difficulty: 'intermediate', popular: true, previewGradient: 'from-blue-50 to-cyan-50' },
    { id: 'feat-bento', name: 'Bento Grid', style: 'bold', description: 'Apple-style bento grid with mixed card sizes', tags: ['bento', 'grid', 'mixed'], difficulty: 'intermediate', popular: true, previewGradient: 'from-violet-50 to-purple-50' },
    { id: 'feat-cards', name: 'Elevated Cards', style: 'glass', description: 'Floating cards with hover effects and shadows', tags: ['cards', 'hover', 'shadows'], difficulty: 'beginner', popular: false, previewGradient: 'from-pink-50 to-rose-50' },
    { id: 'feat-timeline', name: 'Timeline List', style: 'minimal', description: 'Vertical timeline with connected feature milestones', tags: ['timeline', 'milestones', 'vertical'], difficulty: 'intermediate', popular: false, previewGradient: 'from-amber-50 to-orange-50' },
    { id: 'feat-tabs', name: 'Tabbed Showcase', style: 'gradient', description: 'Feature tabs with animated content switching', tags: ['tabs', 'interactive', 'animated'], difficulty: 'advanced', popular: false, previewGradient: 'from-fuchsia-50 to-purple-50' },
    { id: 'feat-retro-catalog', name: 'Retro Product Catalog', style: 'retro', description: 'Vintage mail-order catalog layout with hand-drawn borders and serif headings', tags: ['retro', 'catalog', 'vintage', 'serif'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-100 via-orange-50 to-yellow-100' },
    { id: 'feat-retro-blueprint', name: 'Retro Blueprint', style: 'retro', description: 'Technical blueprint-style feature grid with grid lines and annotations', tags: ['retro', 'blueprint', 'technical', 'grid'], difficulty: 'intermediate', popular: false, previewGradient: 'from-blue-950 via-blue-900 to-sky-900' },
    { id: 'feat-neo-inset', name: 'Neomorphic Inset Cards', style: 'neomorphic', description: 'Inset neomorphic cards that appear pressed into the surface', tags: ['neomorphic', 'inset', 'cards', 'soft'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 to-gray-300' },
    { id: 'feat-brutalist-blocks', name: 'Brutalist Blocks', style: 'brutalist', description: 'Heavy bordered blocks with stark color fills and raw typography', tags: ['brutalist', 'blocks', 'raw', 'heavy'], difficulty: 'beginner', popular: false, previewGradient: 'from-white to-gray-200' },
    { id: 'feat-brutalist-oversized', name: 'Brutalist Oversized Type', style: 'brutalist', description: 'Oversized feature numbers with minimal description and maximum impact', tags: ['brutalist', 'oversized', 'numbers', 'impact'], difficulty: 'beginner', popular: false, previewGradient: 'from-stone-900 via-stone-800 to-stone-700' },
    { id: 'feat-dark-glow', name: 'Dark Glowing Cards', style: 'dark', description: 'Dark feature cards with neon glow borders and subtle hover animations', tags: ['dark', 'glow', 'neon', 'cards'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-950 via-slate-900 to-gray-900' },
    { id: 'feat-glass-mosaic', name: 'Glass Mosaic', style: 'glass', description: 'Overlapping glass panels forming a mosaic feature showcase', tags: ['glass', 'mosaic', 'overlapping', 'modern'], difficulty: 'advanced', popular: false, previewGradient: 'from-cyan-400/30 to-purple-500/30' },
    { id: 'feat-gradient-orbit', name: 'Gradient Orbital', style: 'gradient', description: 'Features arranged in orbital rings with gradient connection lines', tags: ['gradient', 'orbital', 'circular', 'animated'], difficulty: 'advanced', popular: false, previewGradient: 'from-orange-400 via-rose-500 to-purple-600' },
    { id: 'feat-neo-dashboard', name: 'Neomorphic Dashboard', style: 'neomorphic', description: 'Dashboard-style feature layout with soft toggle switches and progress indicators', tags: ['neomorphic', 'dashboard', 'toggles', 'progress'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-200 via-gray-200 to-zinc-200' },
  ],
  pricing: [
    { id: 'price-3col', name: '3-Column Cards', style: 'minimal', description: 'Classic three-column pricing layout with highlight', tags: ['3-column', 'classic', 'popular'], difficulty: 'beginner', popular: true, previewGradient: 'from-amber-50 to-yellow-50' },
    { id: 'price-toggle', name: 'Monthly/Yearly Toggle', style: 'glass', description: 'Pricing with monthly/yearly toggle switch', tags: ['toggle', 'billing', 'interactive'], difficulty: 'intermediate', popular: true, previewGradient: 'from-cyan-50 to-blue-50' },
    { id: 'price-dark', name: 'Dark Premium', style: 'dark', description: 'Dark-themed pricing cards with gradient accents', tags: ['dark', 'premium', 'gradient'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-900 to-slate-800' },
    { id: 'price-comparison', name: 'Comparison Table', style: 'minimal', description: 'Feature comparison table across plans', tags: ['comparison', 'table', 'features'], difficulty: 'advanced', popular: false, previewGradient: 'from-green-50 to-emerald-50' },
    { id: 'price-gradient', name: 'Gradient Highlight', style: 'gradient', description: 'Popular plan highlighted with gradient border', tags: ['gradient', 'highlight', 'popular'], difficulty: 'beginner', popular: false, previewGradient: 'from-violet-500 to-fuchsia-500' },
    { id: 'price-minimal', name: 'Ultra Minimal', style: 'minimal', description: 'Stripped-down pricing with just the essentials', tags: ['minimal', 'clean', 'simple'], difficulty: 'beginner', popular: false, previewGradient: 'from-neutral-50 to-stone-50' },
    { id: 'price-retro-stamps', name: 'Retro Stamp Cards', style: 'retro', description: 'Vintage postage stamp-inspired pricing cards with perforated edges', tags: ['retro', 'stamp', 'vintage', 'postal'], difficulty: 'intermediate', popular: false, previewGradient: 'from-amber-100 via-yellow-50 to-stone-200' },
    { id: 'price-retro-ticket', name: 'Retro Ticket Stub', style: 'retro', description: 'Pricing cards styled like vintage cinema or event ticket stubs', tags: ['retro', 'ticket', 'cinema', 'vintage'], difficulty: 'beginner', popular: false, previewGradient: 'from-orange-200 via-amber-100 to-yellow-100' },
    { id: 'price-neo-raised', name: 'Neomorphic Raised', style: 'neomorphic', description: 'Pricing cards with raised neomorphic shadows and soft pressed toggles', tags: ['neomorphic', 'raised', 'soft', 'shadows'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 via-gray-100 to-gray-300' },
    { id: 'price-brutalist-stacked', name: 'Brutalist Stacked', style: 'brutalist', description: 'Stacked pricing blocks with heavy borders and bold price typography', tags: ['brutalist', 'stacked', 'heavy', 'bold'], difficulty: 'beginner', popular: false, previewGradient: 'from-white via-gray-100 to-black' },
    { id: 'price-brutalist-asymmetric', name: 'Brutalist Asymmetric', style: 'brutalist', description: 'Asymmetric pricing layout with off-grid positioning and raw aesthetics', tags: ['brutalist', 'asymmetric', 'off-grid', 'raw'], difficulty: 'advanced', popular: false, previewGradient: 'from-red-600 via-white to-blue-900' },
    { id: 'price-glass-float', name: 'Glass Floating Cards', style: 'glass', description: 'Floating glass pricing cards with backdrop blur and gradient accents', tags: ['glass', 'floating', 'blur', 'premium'], difficulty: 'intermediate', popular: false, previewGradient: 'from-violet-400/20 to-cyan-400/20' },
    { id: 'price-dark-aurora', name: 'Dark Aurora Cards', style: 'dark', description: 'Dark pricing cards with aurora borealis gradient effects on hover', tags: ['dark', 'aurora', 'gradient', 'hover'], difficulty: 'advanced', popular: false, previewGradient: 'from-gray-950 via-emerald-900 to-violet-900' },
    { id: 'price-gradient-flow', name: 'Gradient Flow', style: 'gradient', description: 'Pricing cards connected by flowing gradient lines indicating tier progression', tags: ['gradient', 'flow', 'progression', 'connected'], difficulty: 'advanced', popular: false, previewGradient: 'from-emerald-400 via-cyan-500 to-blue-500' },
    { id: 'price-neo-toggle', name: 'Neomorphic Toggle Pro', style: 'neomorphic', description: 'Full neomorphic pricing section with soft toggle, raised buttons, and inset forms', tags: ['neomorphic', 'toggle', 'forms', 'soft'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-200 to-zinc-200' },
  ],
  testimonials: [
    { id: 'test-cards', name: 'Card Grid', style: 'minimal', description: 'Testimonial cards in a responsive grid layout', tags: ['cards', 'grid', 'avatars'], difficulty: 'beginner', popular: true, previewGradient: 'from-pink-50 to-rose-50' },
    { id: 'test-carousel', name: 'Carousel Slider', style: 'bold', description: 'Auto-sliding testimonial carousel', tags: ['carousel', 'slider', 'animated'], difficulty: 'intermediate', popular: true, previewGradient: 'from-orange-50 to-amber-50' },
    { id: 'test-quote', name: 'Large Quote', style: 'minimal', description: 'Full-width quote with large typography', tags: ['quote', 'typography', 'large'], difficulty: 'beginner', popular: false, previewGradient: 'from-slate-50 to-gray-50' },
    { id: 'test-social-proof', name: 'Social Proof Bar', style: 'bold', description: 'Logo wall + stats bar for social proof', tags: ['logos', 'stats', 'social-proof'], difficulty: 'beginner', popular: true, previewGradient: 'from-indigo-50 to-violet-50' },
    { id: 'test-video', name: 'Video Testimonials', style: 'dark', description: 'Embedded video testimonials with play buttons', tags: ['video', 'multimedia', 'engaging'], difficulty: 'advanced', popular: false, previewGradient: 'from-gray-900 to-zinc-900' },
    { id: 'test-masonry', name: 'Masonry Layout', style: 'bold', description: 'Pinterest-style masonry layout for varied testimonials', tags: ['masonry', 'varied', 'dynamic'], difficulty: 'intermediate', popular: false, previewGradient: 'from-teal-50 to-cyan-50' },
    { id: 'test-retro-ticker', name: 'Retro Ticker Tape', style: 'retro', description: 'Scrolling ticker tape of testimonial quotes in a retro LED display style', tags: ['retro', 'ticker', 'scrolling', 'LED'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-900 to-gray-800' },
    { id: 'test-retro-postcard', name: 'Retro Postcard', style: 'retro', description: 'Testimonials styled as vintage postcards with handwritten fonts and stamps', tags: ['retro', 'postcard', 'handwritten', 'vintage'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-100 via-orange-50 to-yellow-100' },
    { id: 'test-neo-press', name: 'Neomorphic Press', style: 'neomorphic', description: 'Testimonial cards that appear pressed into the surface when hovered', tags: ['neomorphic', 'press', 'hover', 'soft'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 via-gray-100 to-gray-300' },
    { id: 'test-brutalist-marquee', name: 'Brutalist Marquee', style: 'brutalist', description: 'Raw marquee-style scrolling testimonials with heavy borders', tags: ['brutalist', 'marquee', 'scrolling', 'raw'], difficulty: 'beginner', popular: false, previewGradient: 'from-yellow-300 to-black' },
    { id: 'test-brutalist-wall', name: 'Brutalist Wall', style: 'brutalist', description: 'Testimonials pinned to a rough concrete-textured wall layout', tags: ['brutalist', 'wall', 'pinned', 'concrete'], difficulty: 'intermediate', popular: false, previewGradient: 'from-stone-400 to-stone-600' },
    { id: 'test-glass-stack', name: 'Glass Stacked Cards', style: 'glass', description: 'Stacked glass testimonial cards with depth shadows and blur backdrop', tags: ['glass', 'stacked', 'blur', 'depth'], difficulty: 'intermediate', popular: false, previewGradient: 'from-indigo-400/20 to-purple-400/20' },
    { id: 'test-dark-spotlight', name: 'Dark Spotlight', style: 'dark', description: 'Dark background with spotlight effect highlighting each testimonial', tags: ['dark', 'spotlight', 'focus', 'dramatic'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-950 via-black to-gray-900' },
    { id: 'test-gradient-flow', name: 'Gradient Quote Flow', style: 'gradient', description: 'Testimonials with gradient text backgrounds that flow from card to card', tags: ['gradient', 'flow', 'colorful', 'modern'], difficulty: 'advanced', popular: false, previewGradient: 'from-rose-400 via-purple-400 to-indigo-400' },
    { id: 'test-neo-circular', name: 'Neomorphic Circular', style: 'neomorphic', description: 'Circular neomorphic avatar frames with raised quote bubbles', tags: ['neomorphic', 'circular', 'avatar', 'bubble'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-200 to-zinc-200' },
  ],
  cta: [
    { id: 'cta-gradient', name: 'Gradient Banner', style: 'gradient', description: 'Full-width gradient CTA with bold typography', tags: ['gradient', 'bold', 'banner'], difficulty: 'beginner', popular: true, previewGradient: 'from-violet-600 to-fuchsia-500' },
    { id: 'cta-split', name: 'Split Content', style: 'minimal', description: 'Image on one side, CTA form on the other', tags: ['split', 'form', 'image'], difficulty: 'intermediate', popular: false, previewGradient: 'from-blue-50 to-indigo-50' },
    { id: 'cta-newsletter', name: 'Newsletter Signup', style: 'glass', description: 'Email signup with glassmorphism card design', tags: ['newsletter', 'email', 'signup'], difficulty: 'beginner', popular: true, previewGradient: 'from-cyan-400 to-blue-500' },
    { id: 'cta-dark', name: 'Dark CTA', style: 'dark', description: 'Dark background with neon accent button', tags: ['dark', 'neon', 'dramatic'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 to-slate-900' },
    { id: 'cta-minimal', name: 'Simple Button', style: 'minimal', description: 'Ultra-minimal centered CTA with single button', tags: ['minimal', 'simple', 'clean'], difficulty: 'beginner', popular: false, previewGradient: 'from-white to-stone-50' },
    { id: 'cta-animated', name: 'Animated Glow', style: 'gradient', description: 'Animated glowing border CTA with particle effects', tags: ['animated', 'glow', 'particles'], difficulty: 'advanced', popular: false, previewGradient: 'from-purple-600 via-pink-500 to-red-500' },
    { id: 'cta-retro-radio', name: 'Retro Radio Ad', style: 'retro', description: 'Vintage radio advertisement style CTA with distressed textures', tags: ['retro', 'radio', 'distressed', 'vintage'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-200 via-orange-100 to-red-100' },
    { id: 'cta-retro-wanted', name: 'Retro Wild West Poster', style: 'retro', description: 'Old West wanted poster style CTA with serif fonts and aged paper', tags: ['retro', 'western', 'poster', 'serif'], difficulty: 'intermediate', popular: false, previewGradient: 'from-yellow-200 via-amber-200 to-stone-300' },
    { id: 'cta-neo-cta', name: 'Neomorphic CTA Card', style: 'neomorphic', description: 'Soft raised CTA card with inset email input and pressed submit button', tags: ['neomorphic', 'card', 'input', 'soft'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 to-gray-300' },
    { id: 'cta-brutalist-block', name: 'Brutalist Block CTA', style: 'brutalist', description: 'Full-width black block with oversized white text and stark CTA button', tags: ['brutalist', 'block', 'oversized', 'stark'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 to-black' },
    { id: 'cta-brutalist-torn', name: 'Brutalist Torn Edge', style: 'brutalist', description: 'CTA section with torn/ragged paper edge effect and mixed typography', tags: ['brutalist', 'torn', 'paper', 'mixed'], difficulty: 'advanced', popular: false, previewGradient: 'from-white via-gray-50 to-stone-200' },
    { id: 'cta-glass-bubble', name: 'Glass Bubble CTA', style: 'glass', description: 'CTA enclosed in a floating glass bubble with gradient backdrop', tags: ['glass', 'bubble', 'floating', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-pink-400/20 to-violet-500/20' },
    { id: 'cta-dark-minimal', name: 'Dark Minimal CTA', style: 'dark', description: 'Extremely minimal dark CTA with just one line of text and a subtle link', tags: ['dark', 'minimal', 'subtle', 'elegant'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-950 to-black' },
    { id: 'cta-gradient-wave', name: 'Gradient Wave CTA', style: 'gradient', description: 'CTA with animated SVG wave background and gradient text overlay', tags: ['gradient', 'wave', 'animated', 'SVG'], difficulty: 'advanced', popular: false, previewGradient: 'from-teal-400 via-cyan-500 to-blue-600' },
    { id: 'cta-neo-progress', name: 'Neomorphic Progress CTA', style: 'neomorphic', description: 'CTA with soft progress indicator and neomorphic action buttons', tags: ['neomorphic', 'progress', 'indicator', 'soft'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-200 via-gray-200 to-zinc-200' },
  ],
  about: [
    { id: 'about-team', name: 'Team Grid', style: 'minimal', description: 'Team member cards with photos, names, and roles', tags: ['team', 'grid', 'photos'], difficulty: 'beginner', popular: true, previewGradient: 'from-teal-50 to-cyan-50' },
    { id: 'about-timeline', name: 'Company Timeline', style: 'minimal', description: 'Vertical timeline of company milestones', tags: ['timeline', 'history', 'milestones'], difficulty: 'intermediate', popular: false, previewGradient: 'from-amber-50 to-orange-50' },
    { id: 'about-stats', name: 'Stats Counter', style: 'bold', description: 'Animated counter section with key metrics', tags: ['stats', 'counter', 'animated'], difficulty: 'intermediate', popular: true, previewGradient: 'from-violet-50 to-purple-50' },
    { id: 'about-faq', name: 'FAQ Accordion', style: 'minimal', description: 'Expandable FAQ accordion with smooth animations', tags: ['faq', 'accordion', 'interactive'], difficulty: 'beginner', popular: true, previewGradient: 'from-green-50 to-emerald-50' },
    { id: 'about-gallery', name: 'Image Gallery', style: 'glass', description: 'Responsive image gallery with lightbox', tags: ['gallery', 'images', 'lightbox'], difficulty: 'intermediate', popular: false, previewGradient: 'from-pink-50 to-rose-50' },
    { id: 'about-story', name: 'Story Section', style: 'bold', description: 'Visual storytelling with images and text blocks', tags: ['story', 'visual', 'narrative'], difficulty: 'intermediate', popular: false, previewGradient: 'from-blue-50 to-sky-50' },
    { id: 'about-retro-yearbook', name: 'Retro Yearbook', style: 'retro', description: 'Vintage yearbook-style team page with portrait frames and serif headings', tags: ['retro', 'yearbook', 'portrait', 'serif'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-100 via-stone-100 to-orange-100' },
    { id: 'about-retro-zine', name: 'Retro Fanzine', style: 'retro', description: 'DIY fanzine-style about section with collaged layouts and handwritten notes', tags: ['retro', 'zine', 'collage', 'handmade'], difficulty: 'intermediate', popular: false, previewGradient: 'from-yellow-100 via-white to-pink-100' },
    { id: 'about-neo-profile', name: 'Neomorphic Profile', style: 'neomorphic', description: 'Team member profiles with soft-raised cards and inset social icon slots', tags: ['neomorphic', 'profile', 'cards', 'social'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 to-gray-300' },
    { id: 'about-brutalist-id', name: 'Brutalist ID Cards', style: 'brutalist', description: 'Team members as raw ID card designs with barcode and stamp aesthetics', tags: ['brutalist', 'ID', 'cards', 'barcode'], difficulty: 'beginner', popular: false, previewGradient: 'from-white via-gray-200 to-stone-400' },
    { id: 'about-brutalist-manifesto', name: 'Brutalist Manifesto', style: 'brutalist', description: 'Company story presented as a typographic manifesto with bold statements', tags: ['brutalist', 'manifesto', 'typographic', 'statement'], difficulty: 'intermediate', popular: false, previewGradient: 'from-black via-gray-900 to-stone-800' },
    { id: 'about-dark-hologram', name: 'Dark Holographic Team', style: 'dark', description: 'Dark team grid with holographic hover effects and glowing name cards', tags: ['dark', 'holographic', 'hover', 'glow'], difficulty: 'advanced', popular: false, previewGradient: 'from-gray-950 via-violet-950 to-slate-900' },
    { id: 'about-glass-showcase', name: 'Glass Showcase', style: 'glass', description: 'Team and story presented in stacked glass panels with blur and reflections', tags: ['glass', 'stacked', 'blur', 'reflection'], difficulty: 'advanced', popular: false, previewGradient: 'from-cyan-400/20 to-purple-500/20' },
    { id: 'about-gradient-origins', name: 'Gradient Origins Story', style: 'gradient', description: 'Company origin story with gradient timeline and flowing color transitions', tags: ['gradient', 'timeline', 'origins', 'flow'], difficulty: 'intermediate', popular: false, previewGradient: 'from-orange-400 via-rose-500 to-purple-600' },
    { id: 'about-neo-faq', name: 'Neomorphic FAQ', style: 'neomorphic', description: 'FAQ with soft-raised question cards that press down to reveal answers', tags: ['neomorphic', 'FAQ', 'accordion', 'soft'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-200 to-zinc-200' },
  ],
  footer: [
    { id: 'foot-multicolumn', name: 'Multi-Column', style: 'minimal', description: 'Classic 4-column footer with links and social', tags: ['columns', 'links', 'classic'], difficulty: 'beginner', popular: true, previewGradient: 'from-gray-900 to-gray-800' },
    { id: 'foot-minimal', name: 'Minimal Centered', style: 'minimal', description: 'Simple centered footer with just the essentials', tags: ['minimal', 'centered', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-stone-100 to-neutral-100' },
    { id: 'foot-dark', name: 'Dark Social', style: 'dark', description: 'Dark footer with prominent social media links', tags: ['dark', 'social', 'icons'], difficulty: 'beginner', popular: false, previewGradient: 'from-zinc-900 to-neutral-900' },
    { id: 'foot-newsletter', name: 'Newsletter Footer', style: 'gradient', description: 'Footer with integrated email signup form', tags: ['newsletter', 'signup', 'email'], difficulty: 'intermediate', popular: false, previewGradient: 'from-violet-900 to-indigo-900' },
    { id: 'foot-mega', name: 'Mega Footer', style: 'bold', description: 'Full-width mega footer with sitemap and resources', tags: ['mega', 'sitemap', 'comprehensive'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-100 to-gray-100' },
    { id: 'foot-creative', name: 'Creative Layout', style: 'bold', description: 'Asymmetric creative footer with unique design', tags: ['creative', 'asymmetric', 'unique'], difficulty: 'advanced', popular: false, previewGradient: 'from-fuchsia-50 to-pink-50' },
    { id: 'foot-retro-classifieds', name: 'Retro Classifieds', style: 'retro', description: 'Newspaper classifieds section style footer with narrow columns and rules', tags: ['retro', 'newspaper', 'classifieds', 'columns'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-50 via-yellow-50 to-stone-100' },
    { id: 'foot-retro-cassette', name: 'Retro Cassette Mixtape', style: 'retro', description: 'Cassette tape-inspired footer with spool graphics and track-list links', tags: ['retro', 'cassette', 'music', 'vintage'], difficulty: 'intermediate', popular: false, previewGradient: 'from-orange-200 via-amber-200 to-yellow-200' },
    { id: 'foot-neo-soft', name: 'Neomorphic Soft Footer', style: 'neomorphic', description: 'Soft-raised footer with inset link sections and neomorphic social icons', tags: ['neomorphic', 'soft', 'raised', 'inset'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 via-gray-100 to-gray-300' },
    { id: 'foot-brutalist-docket', name: 'Brutalist Docket', style: 'brutalist', description: 'Legal docket style footer with numbered sections and stamped look', tags: ['brutalist', 'docket', 'legal', 'stamped'], difficulty: 'beginner', popular: false, previewGradient: 'from-white via-gray-50 to-stone-200' },
    { id: 'foot-brutalist-manifesto', name: 'Brutalist Bottom Banner', style: 'brutalist', description: 'Full-width banner footer with heavy black top border and bold statements', tags: ['brutalist', 'banner', 'heavy', 'statement'], difficulty: 'beginner', popular: false, previewGradient: 'from-black via-gray-800 to-gray-900' },
    { id: 'foot-glass-float', name: 'Glass Floating Footer', style: 'glass', description: 'Footer that floats above the page with glass backdrop and blur effects', tags: ['glass', 'floating', 'blur', 'transparent'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-800/40 to-gray-900/40' },
    { id: 'foot-dark-terminal', name: 'Dark Terminal', style: 'dark', description: 'Terminal/command-line style footer with monospace green text and blinking cursor', tags: ['dark', 'terminal', 'monospace', 'hacker'], difficulty: 'intermediate', popular: false, previewGradient: 'from-green-950 to-gray-950' },
    { id: 'foot-gradient-wave', name: 'Gradient Wave Divider', style: 'gradient', description: 'Footer with SVG gradient wave divider and colored background sections', tags: ['gradient', 'wave', 'SVG', 'divider'], difficulty: 'intermediate', popular: false, previewGradient: 'from-cyan-500 via-blue-500 to-violet-600' },
    { id: 'foot-neo-contact', name: 'Neomorphic Contact Footer', style: 'neomorphic', description: 'Footer with soft contact form inputs and neomorphic social media buttons', tags: ['neomorphic', 'contact', 'form', 'buttons'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-200 via-zinc-200 to-gray-200' },
  ],
  contact: [
    { id: 'contact-map', name: 'Map & Directions', style: 'minimal', description: 'Embedded map with address and directions form', tags: ['map', 'location', 'directions'], difficulty: 'beginner', popular: true, previewGradient: 'from-emerald-50 to-teal-50' },
    { id: 'contact-form-classic', name: 'Classic Form', style: 'minimal', description: 'Standard contact form with name, email, phone, and message', tags: ['form', 'classic', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-slate-50 to-gray-50' },
    { id: 'contact-split', name: 'Split Contact', style: 'bold', description: 'Side-by-side contact info and form layout', tags: ['split', 'info', 'form'], difficulty: 'beginner', popular: false, previewGradient: 'from-violet-50 to-purple-50' },
    { id: 'contact-dark', name: 'Dark Contact', style: 'dark', description: 'Dark-themed contact section with glowing form fields', tags: ['dark', 'neon', 'glow'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-900 to-slate-900' },
    { id: 'contact-glass', name: 'Glass Form', style: 'glass', description: 'Frosted glass contact card with backdrop blur', tags: ['glass', 'blur', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-cyan-400/20 to-blue-500/20' },
    { id: 'contact-gradient', name: 'Gradient Banner', style: 'gradient', description: 'Full-width gradient background with centered contact form', tags: ['gradient', 'banner', 'centered'], difficulty: 'beginner', popular: false, previewGradient: 'from-violet-600 to-fuchsia-500' },
    { id: 'contact-retro-postcard', name: 'Retro Postcard', style: 'retro', description: 'Vintage postcard-style contact section with stamps and postmark', tags: ['retro', 'postcard', 'vintage', 'stamp'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-100 via-orange-50 to-yellow-100' },
    { id: 'contact-retro-telegram', name: 'Retro Telegram', style: 'retro', description: 'Old telegram-style message form with typewriter font', tags: ['retro', 'telegram', 'typewriter', 'message'], difficulty: 'beginner', popular: false, previewGradient: 'from-yellow-100 via-amber-50 to-stone-200' },
    { id: 'contact-neo-inset', name: 'Neomorphic Form', style: 'neomorphic', description: 'Soft inset form inputs with neomorphic styling', tags: ['neomorphic', 'inset', 'soft', 'form'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 to-gray-300' },
    { id: 'contact-brutalist-block', name: 'Brutalist Block', style: 'brutalist', description: 'Heavy bordered contact block with stark form elements', tags: ['brutalist', 'heavy', 'stark', 'block'], difficulty: 'beginner', popular: false, previewGradient: 'from-white to-gray-200' },
    { id: 'contact-brutalist-rubber', name: 'Brutalist Rubber Stamp', style: 'brutalist', description: 'Contact section with rubber stamp aesthetic and mixed type', tags: ['brutalist', 'stamp', 'mixed', 'raw'], difficulty: 'intermediate', popular: false, previewGradient: 'from-red-600 via-white to-blue-600' },
    { id: 'contact-dark-terminal', name: 'Dark Terminal', style: 'dark', description: 'Terminal-style contact form with green text on black', tags: ['dark', 'terminal', 'monospace', 'hacker'], difficulty: 'intermediate', popular: false, previewGradient: 'from-green-950 to-gray-950' },
    { id: 'contact-glass-island', name: 'Glass Island', style: 'glass', description: 'Contact form floating as a glass island over an image background', tags: ['glass', 'island', 'float', 'image'], difficulty: 'advanced', popular: false, previewGradient: 'from-indigo-400/20 to-purple-500/20' },
    { id: 'contact-gradient-wave', name: 'Gradient Wave', style: 'gradient', description: 'Contact section with SVG wave divider and gradient background', tags: ['gradient', 'wave', 'SVG', 'divider'], difficulty: 'intermediate', popular: false, previewGradient: 'from-teal-400 via-cyan-500 to-blue-600' },
    { id: 'contact-neo-card', name: 'Neomorphic Card', style: 'neomorphic', description: 'Soft-raised contact card with neomorphic social links', tags: ['neomorphic', 'card', 'social', 'raised'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-200 to-zinc-200' },
  ],
  gallery: [
    { id: 'gallery-grid', name: 'Responsive Grid', style: 'minimal', description: 'Clean responsive image grid with hover zoom', tags: ['grid', 'responsive', 'hover'], difficulty: 'beginner', popular: true, previewGradient: 'from-pink-50 to-rose-50' },
    { id: 'gallery-masonry', name: 'Masonry Layout', style: 'bold', description: 'Pinterest-style masonry with varied image heights', tags: ['masonry', 'pinterest', 'varied'], difficulty: 'intermediate', popular: true, previewGradient: 'from-orange-50 to-amber-50' },
    { id: 'gallery-carousel', name: 'Image Carousel', style: 'bold', description: 'Auto-sliding carousel with navigation arrows', tags: ['carousel', 'slider', 'auto'], difficulty: 'intermediate', popular: true, previewGradient: 'from-blue-50 to-indigo-50' },
    { id: 'gallery-lightbox', name: 'Lightbox Gallery', style: 'dark', description: 'Gallery with full-screen lightbox on click', tags: ['lightbox', 'fullscreen', 'overlay'], difficulty: 'advanced', popular: false, previewGradient: 'from-gray-900 to-black' },
    { id: 'gallery-glass', name: 'Glass Overlay', style: 'glass', description: 'Gallery with glassmorphism overlay cards on hover', tags: ['glass', 'overlay', 'hover'], difficulty: 'intermediate', popular: false, previewGradient: 'from-cyan-400/20 to-purple-500/20' },
    { id: 'gallery-gradient', name: 'Gradient Frame', style: 'gradient', description: 'Images with gradient border frames and hover effects', tags: ['gradient', 'frame', 'border'], difficulty: 'beginner', popular: false, previewGradient: 'from-fuchsia-500 via-purple-500 to-indigo-500' },
    { id: 'gallery-retro-polaroid', name: 'Retro Polaroid', style: 'retro', description: 'Polaroid-style photo gallery with handwritten captions', tags: ['retro', 'polaroid', 'photo', 'handwritten'], difficulty: 'beginner', popular: false, previewGradient: 'from-amber-100 via-white to-stone-100' },
    { id: 'gallery-retro-filmstrip', name: 'Retro Filmstrip', style: 'retro', description: '35mm filmstrip-style horizontal photo gallery', tags: ['retro', 'film', 'strip', 'analog'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 via-gray-800 to-gray-900' },
    { id: 'gallery-neo-frame', name: 'Neomorphic Frame', style: 'neomorphic', description: 'Soft-raised image frames with inset shadow details', tags: ['neomorphic', 'frame', 'soft', 'shadow'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-200 to-gray-300' },
    { id: 'gallery-brutalist-collage', name: 'Brutalist Collage', style: 'brutalist', description: 'Raw collage layout with overlapping images and bold borders', tags: ['brutalist', 'collage', 'overlap', 'raw'], difficulty: 'advanced', popular: false, previewGradient: 'from-white via-gray-100 to-black' },
    { id: 'gallery-brutalist-grid', name: 'Brutalist Grid', style: 'brutalist', description: 'Heavy bordered image grid with no rounded corners', tags: ['brutalist', 'grid', 'heavy', 'sharp'], difficulty: 'beginner', popular: false, previewGradient: 'from-white to-gray-200' },
    { id: 'gallery-dark-spotlight', name: 'Dark Spotlight', style: 'dark', description: 'Dark gallery with spotlight hover effect on each image', tags: ['dark', 'spotlight', 'hover', 'dramatic'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-950 via-black to-gray-900' },
    { id: 'gallery-glass-mosaic', name: 'Glass Mosaic', style: 'glass', description: 'Overlapping glass-framed images creating a mosaic', tags: ['glass', 'mosaic', 'overlap', 'modern'], difficulty: 'advanced', popular: false, previewGradient: 'from-cyan-400/30 to-purple-500/30' },
    { id: 'gallery-gradient-flow', name: 'Gradient Flow', style: 'gradient', description: 'Images arranged with gradient color flows between them', tags: ['gradient', 'flow', 'colorful', 'modern'], difficulty: 'advanced', popular: false, previewGradient: 'from-rose-400 via-purple-400 to-indigo-400' },
    { id: 'gallery-neo-showcase', name: 'Neomorphic Showcase', style: 'neomorphic', description: 'Premium image showcase with soft toggle and view modes', tags: ['neomorphic', 'showcase', 'toggle', 'premium'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-200 via-gray-200 to-zinc-200' },
  ],
  themes: [] as ComponentVariant[],
};

// =============================================================================
// Expanded Design Themes — 20 total
// =============================================================================

export const expandedDesignThemes: DesignTheme[] = [
  // --- Original 8 ---
  { id: 'theme-dark-luxury', name: 'Dark Luxury', description: 'Rich dark tones with golden accents for premium brands', preview: '/design-library/themes-colors.png', colors: { primary: '#1a1a2e', secondary: '#d4a853', accent: '#c9a96e', background: '#0d0d1a', foreground: '#f5f5f0', muted: '#2a2a3e' }, fontFamily: 'Cormorant Garamond', mood: 'Luxurious', style: 'dark', popular: true, useCount: 3842 },
  { id: 'theme-minimal-mono', name: 'Minimal Mono', description: 'Pure monochrome for maximum elegance and clarity', preview: '/design-library/themes-colors.png', colors: { primary: '#111111', secondary: '#666666', accent: '#000000', background: '#ffffff', foreground: '#111111', muted: '#f5f5f5' }, fontFamily: 'Inter', mood: 'Clean', style: 'minimal', popular: true, useCount: 5102 },
  { id: 'theme-neon-gradient', name: 'Neon Gradient', description: 'Vibrant neon gradients for bold, modern brands', preview: '/design-library/themes-colors.png', colors: { primary: '#7c3aed', secondary: '#06b6d4', accent: '#f43f5e', background: '#0a0a0f', foreground: '#f0f0ff', muted: '#1a1a2e' }, fontFamily: 'Space Grotesk', mood: 'Energetic', style: 'gradient', popular: true, useCount: 2947 },
  { id: 'theme-pastel-feminine', name: 'Soft Pastel', description: 'Gentle pastel palette for beauty and wellness brands', preview: '/design-library/themes-colors.png', colors: { primary: '#ec4899', secondary: '#f9a8d4', accent: '#fce7f3', background: '#fef7ff', foreground: '#4a1942', muted: '#fdf2f8' }, fontFamily: 'DM Sans', mood: 'Serene', style: 'glass', popular: false, useCount: 2183 },
  { id: 'theme-earthy-organic', name: 'Earthy Organic', description: 'Natural tones for sustainable and organic brands', preview: '/design-library/themes-colors.png', colors: { primary: '#2d5016', secondary: '#8fae6b', accent: '#d4a853', background: '#faf8f0', foreground: '#1a2e0d', muted: '#f0ede0' }, fontFamily: 'Lora', mood: 'Natural', style: 'minimal', popular: false, useCount: 1847 },
  { id: 'theme-bold-primary', name: 'Bold Primary', description: 'Strong primary colors for attention-grabbing designs', preview: '/design-library/themes-colors.png', colors: { primary: '#dc2626', secondary: '#2563eb', accent: '#f59e0b', background: '#ffffff', foreground: '#111827', muted: '#f3f4f6' }, fontFamily: 'Roboto', mood: 'Confident', style: 'bold', popular: true, useCount: 4215 },
  { id: 'theme-warm-sunset', name: 'Warm Sunset', description: 'Warm orange and coral tones for inviting brands', preview: '/design-library/themes-colors.png', colors: { primary: '#ea580c', secondary: '#f59e0b', accent: '#ef4444', background: '#fffbeb', foreground: '#451a03', muted: '#fef3c7' }, fontFamily: 'Nunito', mood: 'Warm', style: 'gradient', popular: false, useCount: 1567 },
  { id: 'theme-ocean-breeze', name: 'Ocean Breeze', description: 'Cool blues and teals for professional services', preview: '/design-library/themes-colors.png', colors: { primary: '#0d9488', secondary: '#0891b2', accent: '#22d3ee', background: '#f0fdfa', foreground: '#042f2e', muted: '#ccfbf1' }, fontFamily: 'Nunito', mood: 'Trustworthy', style: 'minimal', popular: false, useCount: 2341 },
  // --- 12 New Themes ---
  { id: 'theme-retro-70s', name: 'Retro 70s Groove', description: 'Warm browns, oranges, and avocado greens inspired by 1970s interior design', preview: '/design-library/themes-colors.png', colors: { primary: '#92400e', secondary: '#65a30d', accent: '#d97706', background: '#fef3c7', foreground: '#451a03', muted: '#fde68a' }, fontFamily: 'Playfair Display', mood: 'Nostalgic', style: 'retro', popular: true, useCount: 3218 },
  { id: 'theme-retro-50s-diner', name: '1950s Diner', description: 'Cherry red, mint green, and chrome silver for a classic American diner feel', preview: '/design-library/themes-colors.png', colors: { primary: '#dc2626', secondary: '#34d399', accent: '#e5e7eb', background: '#ffffff', foreground: '#1f2937', muted: '#f9fafb' }, fontFamily: 'Oswald', mood: 'Playful', style: 'retro', popular: false, useCount: 1872 },
  { id: 'theme-retro-art-deco', name: 'Art Deco Gold', description: 'Black, gold, and cream for the glamour of 1920s Art Deco elegance', preview: '/design-library/themes-colors.png', colors: { primary: '#1c1917', secondary: '#d4a853', accent: '#b8860b', background: '#faf5ee', foreground: '#292524', muted: '#f5f0e8' }, fontFamily: 'Cormorant Garamond', mood: 'Glamorous', style: 'retro', popular: false, useCount: 1563 },
  { id: 'theme-nature-forest', name: 'Deep Forest', description: 'Rich greens and mossy browns for nature-inspired brands and eco projects', preview: '/design-library/themes-colors.png', colors: { primary: '#15803d', secondary: '#78350f', accent: '#a16207', background: '#f0fdf4', foreground: '#14532d', muted: '#dcfce7' }, fontFamily: 'Merriweather', mood: 'Earthy', style: 'minimal', popular: false, useCount: 2094 },
  { id: 'theme-nature-desert', name: 'Desert Sunset', description: 'Terracotta, sand, and sage for desert landscapes and warm climates', preview: '/design-library/themes-colors.png', colors: { primary: '#c2410c', secondary: '#a3a380', accent: '#e7c16b', background: '#fef9f0', foreground: '#431407', muted: '#f5ead6' }, fontFamily: 'Lora', mood: 'Warm', style: 'gradient', popular: false, useCount: 1247 },
  { id: 'theme-corporate-navy', name: 'Corporate Navy', description: 'Deep navy and steel blue for enterprise and financial services', preview: '/design-library/themes-colors.png', colors: { primary: '#1e3a5f', secondary: '#64748b', accent: '#3b82f6', background: '#f8fafc', foreground: '#0f172a', muted: '#e2e8f0' }, fontFamily: 'Inter', mood: 'Professional', style: 'dark', popular: true, useCount: 4789 },
  { id: 'theme-corporate-charcoal', name: 'Charcoal Slate', description: 'Charcoal and silver for modern corporate and consultancy firms', preview: '/design-library/themes-colors.png', colors: { primary: '#334155', secondary: '#94a3b8', accent: '#6366f1', background: '#ffffff', foreground: '#1e293b', muted: '#f1f5f9' }, fontFamily: 'Roboto', mood: 'Authoritative', style: 'bold', popular: false, useCount: 3156 },
  { id: 'theme-playful-candy', name: 'Candy Pop', description: 'Bright pinks, yellows, and purples for playful kids brands and candy shops', preview: '/design-library/themes-colors.png', colors: { primary: '#ec4899', secondary: '#facc15', accent: '#a855f7', background: '#fefce8', foreground: '#4a044e', muted: '#fde68a' }, fontFamily: 'Nunito', mood: 'Playful', style: 'gradient', popular: false, useCount: 2891 },
  { id: 'theme-playful-neon', name: 'Neon Playground', description: 'Electric neons on dark backgrounds for gaming and entertainment brands', preview: '/design-library/themes-colors.png', colors: { primary: '#00ff88', secondary: '#ff00ff', accent: '#00ffff', background: '#0a0a0a', foreground: '#e0e0e0', muted: '#1a1a1a' }, fontFamily: 'Space Grotesk', mood: 'Electric', style: 'dark', popular: true, useCount: 3674 },
  { id: 'theme-mono-noir', name: 'Film Noir', description: 'Pure black and white with subtle gray tones for cinematic artistry', preview: '/design-library/themes-colors.png', colors: { primary: '#000000', secondary: '#404040', accent: '#808080', background: '#fafafa', foreground: '#0a0a0a', muted: '#e5e5e5' }, fontFamily: 'Georgia', mood: 'Dramatic', style: 'dark', popular: false, useCount: 1342 },
  { id: 'theme-japanese-wabi', name: 'Japanese Wabi-Sabi', description: 'Muted greens, warm whites, and indigo for Japanese aesthetic simplicity', preview: '/design-library/themes-colors.png', colors: { primary: '#4a5568', secondary: '#2d3748', accent: '#c53030', background: '#faf9f6', foreground: '#1a202c', muted: '#edf2f7' }, fontFamily: 'Noto Serif JP', mood: 'Tranquil', style: 'minimal', popular: false, useCount: 1956 },
  { id: 'theme-indian-royal', name: 'Indian Royal', description: 'Deep saffron, marigold gold, and rich magenta inspired by Indian festivities', preview: '/design-library/themes-colors.png', colors: { primary: '#ea580c', secondary: '#e11d48', accent: '#eab308', background: '#fffbeb', foreground: '#431407', muted: '#fef3c7' }, fontFamily: 'Poppins', mood: 'Festive', style: 'bold', popular: false, useCount: 1678 },
];

// =============================================================================
// Style-based CSS class helpers
// =============================================================================

function getStyleClasses(style: DesignStyle): {
  bg: string;
  card: string;
  text: string;
  accent: string;
} {
  switch (style) {
    case 'minimal':
      return {
        bg: 'bg-white',
        card: 'bg-gray-50 border border-gray-200 rounded-xl',
        text: 'text-gray-900',
        accent: 'bg-gray-900 text-white',
      };
    case 'bold':
      return {
        bg: 'bg-white',
        card: 'bg-black text-white rounded-none p-6',
        text: 'text-gray-900',
        accent: 'bg-red-600 text-white',
      };
    case 'dark':
      return {
        bg: 'bg-gray-950',
        card: 'bg-gray-900 border border-gray-800 rounded-xl',
        text: 'text-white',
        accent: 'bg-violet-600 text-white',
      };
    case 'gradient':
      return {
        bg: 'bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500',
        card: 'bg-white/15 backdrop-blur-md border border-white/20 rounded-xl',
        text: 'text-white',
        accent: 'bg-white text-gray-900',
      };
    case 'glass':
      return {
        bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
        card: 'bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl',
        text: 'text-white',
        accent: 'bg-white text-gray-900',
      };
    case 'retro':
      return {
        bg: 'bg-amber-50',
        card: 'bg-white border-2 border-amber-300 rounded-none shadow-[4px_4px_0_0_amber-300]',
        text: 'text-amber-950',
        accent: 'bg-amber-700 text-amber-50',
      };
    case 'neomorphic':
      return {
        bg: 'bg-gray-200',
        card: 'bg-gray-200 rounded-2xl shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]',
        text: 'text-gray-800',
        accent: 'bg-gray-300 text-gray-900 rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]',
      };
    case 'brutalist':
      return {
        bg: 'bg-yellow-300',
        card: 'bg-white border-4 border-black rounded-none',
        text: 'text-black',
        accent: 'bg-black text-yellow-300 border-2 border-black',
      };
  }
}

function getStyleBgRaw(style: DesignStyle): string {
  switch (style) {
    case 'minimal': return 'bg-white';
    case 'bold': return 'bg-white';
    case 'dark': return 'bg-gray-950';
    case 'gradient': return 'bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500';
    case 'glass': return 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600';
    case 'retro': return 'bg-amber-50';
    case 'neomorphic': return 'bg-gray-200';
    case 'brutalist': return 'bg-yellow-300';
  }
}

function getStyleTextColor(style: DesignStyle): string {
  switch (style) {
    case 'minimal': return 'text-gray-900';
    case 'bold': return 'text-gray-900';
    case 'dark': return 'text-white';
    case 'gradient': return 'text-white';
    case 'glass': return 'text-white';
    case 'retro': return 'text-amber-950';
    case 'neomorphic': return 'text-gray-800';
    case 'brutalist': return 'text-black';
  }
}

function getStyleMutedColor(style: DesignStyle): string {
  switch (style) {
    case 'minimal': return 'text-gray-600';
    case 'bold': return 'text-gray-600';
    case 'dark': return 'text-gray-400';
    case 'gradient': return 'text-white/80';
    case 'glass': return 'text-white/80';
    case 'retro': return 'text-amber-800';
    case 'neomorphic': return 'text-gray-600';
    case 'brutalist': return 'text-gray-800';
  }
}

function getStyleCardClasses(style: DesignStyle): string {
  switch (style) {
    case 'minimal': return 'bg-white border border-gray-200 rounded-xl p-6';
    case 'bold': return 'bg-black text-white rounded-none p-6';
    case 'dark': return 'bg-gray-900 border border-gray-800 rounded-xl p-6';
    case 'gradient': return 'bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-6';
    case 'glass': return 'bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl p-6';
    case 'retro': return 'bg-white border-2 border-amber-300 rounded-none p-6 shadow-[4px_4px_0_0_amber-300]';
    case 'neomorphic': return 'bg-gray-200 rounded-2xl p-6 shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]';
    case 'brutalist': return 'bg-white border-4 border-black rounded-none p-6';
  }
}

function getStyleBtnPrimary(style: DesignStyle): string {
  switch (style) {
    case 'minimal': return 'px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors';
    case 'bold': return 'px-6 py-3 bg-red-600 text-white font-bold rounded-none hover:bg-red-700 transition-colors';
    case 'dark': return 'px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 transition-colors';
    case 'gradient': return 'px-6 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors';
    case 'glass': return 'px-6 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-white/90 transition-colors';
    case 'retro': return 'px-6 py-3 bg-amber-700 text-amber-50 font-medium rounded-none border-2 border-amber-900 hover:bg-amber-800 transition-colors';
    case 'neomorphic': return 'px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-shadow';
    case 'brutalist': return 'px-6 py-3 bg-black text-yellow-300 font-bold rounded-none border-2 border-black hover:bg-gray-900 transition-colors';
  }
}

// =============================================================================
// Code Template Generator
// =============================================================================

export function generateComponentHtml(
  variant: ComponentVariant,
  category: DesignComponentCategory,
): string {
  const style = variant.style;
  const bg = getStyleBgRaw(style);
  const textColor = getStyleTextColor(style);
  const mutedColor = getStyleMutedColor(style);
  const cardClass = getStyleCardClasses(style);
  const btnPrimary = getStyleBtnPrimary(style);
  const isLight = style === 'minimal' || style === 'bold' || style === 'retro' || style === 'neomorphic' || style === 'brutalist';
  const isDark = style === 'dark';
  const isGradient = style === 'gradient';
  const isGlass = style === 'glass';
  const isRetro = style === 'retro';
  const isNeo = style === 'neomorphic';
  const isBrutal = style === 'brutalist';

  const fontFamily = isRetro
    ? 'font-serif'
    : isBrutal
      ? 'font-mono uppercase'
      : isNeo
        ? 'font-sans'
        : 'font-sans';

  const sectionBg = (extra = '') =>
    style === 'gradient'
      ? `style="background: linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #ec4899 100%);"`
      : style === 'glass'
        ? `style="background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);"`
        : `class="${bg} ${extra}"`;

  switch (category) {
    // =========================================================================
    // HERO
    // =========================================================================
    case 'hero': {
      if (isDark) {
        return `<section class="relative min-h-[600px] flex items-center justify-center bg-gray-950 overflow-hidden">
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]"></div>
  <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
    <span class="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-gray-300 text-sm font-medium mb-6">\u2728 ${variant.name}</span>
    <h1 class="text-5xl md:text-7xl font-black text-white leading-none mb-6 tracking-tight">THE FUTURE<br/><span class="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">IS NOW</span></h1>
    <p class="text-lg text-gray-400 max-w-xl mx-auto mb-10">${variant.description}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="${btnPrimary}">Get Started</a>
      <a href="#" class="px-8 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-colors">Learn More \u2192</a>
    </div>
  </div>
</section>`;
      }

      if (isGradient) {
        return `<section class="relative overflow-hidden min-h-[600px] flex items-center justify-center" style="background: linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #ec4899 100%);">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
    <span class="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">\u2728 ${variant.name}</span>
    <h1 class="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">Build Something Amazing Today</h1>
    <p class="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">${variant.description}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="${btnPrimary}">Get Started Free</a>
      <a href="#" class="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/25 hover:bg-white/20 transition-colors">Watch Demo \u2192</a>
    </div>
  </div>
</section>`;
      }

      if (isGlass) {
        return `<section class="relative min-h-[600px] flex items-center justify-center overflow-hidden" style="background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);">
  <div class="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
  <div class="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
  <div class="relative z-10 max-w-2xl mx-auto px-6 text-center">
    <div class="bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 p-10 shadow-2xl">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">${variant.name}</h1>
      <p class="text-white/80 text-lg mb-8">${variant.description}</p>
      <a href="#" class="${btnPrimary}">Explore Now</a>
    </div>
  </div>
</section>`;
      }

      if (isRetro) {
        return `<section class="min-h-[600px] flex items-center justify-center bg-amber-50 border-y-4 border-amber-800">
  <div class="max-w-3xl mx-auto px-6 text-center font-serif">
    <div class="border-2 border-amber-300 p-8 md:p-12 shadow-[6px_6px_0_0_amber-300]">
      <p class="text-amber-700 text-sm tracking-widest uppercase mb-4">\u2605 Est. 2024 \u2605</p>
      <h1 class="text-4xl md:text-5xl font-bold text-amber-950 mb-6 leading-tight">${variant.name}</h1>
      <p class="text-lg text-amber-800 mb-8">${variant.description}</p>
      <a href="#" class="${btnPrimary}">Discover More</a>
    </div>
  </div>
</section>`;
      }

      if (isNeo) {
        return `<section class="min-h-[600px] flex items-center justify-center bg-gray-200">
  <div class="max-w-2xl mx-auto px-6 text-center">
    <div class="bg-gray-200 rounded-3xl p-10 shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff]">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-6">${variant.name}</h1>
      <p class="text-lg text-gray-600 mb-8">${variant.description}</p>
      <a href="#" class="${btnPrimary}">Get Started</a>
    </div>
  </div>
</section>`;
      }

      if (isBrutal) {
        return `<section class="min-h-[600px] flex items-center justify-center bg-yellow-300 border-y-8 border-black">
  <div class="max-w-3xl mx-auto px-6 text-center font-mono uppercase">
    <h1 class="text-5xl md:text-7xl font-black text-black leading-none mb-4 tracking-tight">${variant.name}</h1>
    <div class="w-24 h-2 bg-black mx-auto mb-6"></div>
    <p class="text-lg text-gray-800 mb-10 normal-case">${variant.description}</p>
    <a href="#" class="${btnPrimary}">TAKE ACTION \u2192</a>
  </div>
</section>`;
      }

      // minimal / bold
      return `<section class="min-h-[600px] flex items-center justify-center bg-white">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">${variant.name}</h1>
    <p class="text-lg text-gray-600 mb-10 max-w-xl mx-auto">${variant.description}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="${btnPrimary}">Get Started</a>
      <a href="#" class="px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">Learn More</a>
    </div>
  </div>
</section>`;
    }

    // =========================================================================
    // NAVIGATION
    // =========================================================================
    case 'navigation': {
      if (isDark) {
        return `<nav class="bg-gray-950 border-b border-gray-800">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand<span class="text-emerald-400">.</span></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Products</a>
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Solutions</a>
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Docs</a>
    </div>
    <a href="#" class="${btnPrimary}">Get Started</a>
  </div>
</nav>`;
      }

      if (isGradient) {
        return `<nav class="bg-gradient-to-r from-violet-600 to-fuchsia-500">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand<span class="text-yellow-300">.</span></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Home</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Features</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Pricing</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Blog</a>
    </div>
    <a href="#" class="${btnPrimary}">Sign Up</a>
  </div>
</nav>`;
      }

      if (isGlass) {
        return `<nav class="bg-gradient-to-br from-cyan-400/80 to-purple-500/80 backdrop-blur-xl border-b border-white/20">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand<span class="text-cyan-200">.</span></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Products</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Features</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Pricing</a>
    </div>
    <a href="#" class="${btnPrimary}">Sign Up</a>
  </div>
</nav>`;
      }

      if (isRetro) {
        return `<nav class="bg-amber-50 border-b-4 border-amber-800 font-serif">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-amber-950">\u2605 Brand Co.</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-amber-800 hover:text-amber-950 transition-colors">Catalog</a>
      <a href="#" class="text-sm font-medium text-amber-800 hover:text-amber-950 transition-colors">About</a>
      <a href="#" class="text-sm font-medium text-amber-800 hover:text-amber-950 transition-colors">Contact</a>
    </div>
    <a href="#" class="${btnPrimary}">Shop Now</a>
  </div>
</nav>`;
      }

      if (isNeo) {
        return `<nav class="bg-gray-200">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-gray-800">Brand</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Home</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Docs</a>
    </div>
    <a href="#" class="${btnPrimary}">Sign In</a>
  </div>
</nav>`;
      }

      if (isBrutal) {
        return `<nav class="bg-white border-b-4 border-black font-mono uppercase">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-black text-black">BRAND//</a>
    <div class="hidden md:flex items-center gap-8 text-sm font-bold">
      <a href="#" class="text-black hover:text-red-600 transition-colors">Work</a>
      <a href="#" class="text-black hover:text-red-600 transition-colors">About</a>
      <a href="#" class="text-black hover:text-red-600 transition-colors">Contact</a>
    </div>
    <a href="#" class="${btnPrimary}">HIRE US \u2192</a>
  </div>
</nav>`;
      }

      // minimal / bold
      return `<nav class="sticky top-0 z-50 bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-gray-900">Brand<span class="text-violet-600">.</span></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Products</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Solutions</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Resources</a>
    </div>
    <a href="#" class="${btnPrimary}">Get Started</a>
  </div>
</nav>`;
    }

    // =========================================================================
    // FEATURES
    // =========================================================================
    case 'features': {
      const featureItems = [
        { icon: '\u26a1', title: 'Lightning Fast', desc: 'Optimized for speed with edge caching and CDN delivery worldwide.' },
        { icon: '\U0001f512', title: 'Secure by Default', desc: 'SSL certificates, DDoS protection, and automatic backups built in.' },
        { icon: '\U0001f4ca', title: 'Rich Analytics', desc: 'Track performance with real-time dashboards and custom reports.' },
        { icon: '\U0001f9e9', title: 'Easy Integration', desc: 'Connect with 200+ tools and services through our API.' },
        { icon: '\U0001f3a8', title: 'Customizable', desc: 'Full design control with custom themes, fonts, and layouts.' },
        { icon: '\U0001f91d', title: 'Team Collaboration', desc: 'Work together with role-based access and real-time editing.' },
      ];

      const featureCards = featureItems
        .map(
          (f) => `      <div class="${cardClass} text-center">
        <div class="w-12 h-12 ${isLight ? (isBrutal ? 'bg-black' : 'bg-violet-100') : isDark ? 'bg-gray-800' : 'bg-white/20'} rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">${f.icon}</div>
        <h3 class="font-semibold ${textColor} mb-2 ${fontFamily}">${f.title}</h3>
        <p class="text-sm ${mutedColor}">${f.desc}</p>
      </div>`,
        )
        .join('\n');

      return `<section class="py-20 ${bg} ${isBrutal ? 'border-y-4 border-black' : ''}">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold ${textColor} mb-4 ${fontFamily}">${variant.name}</h2>
      <p class="text-lg ${mutedColor} max-w-2xl mx-auto">${variant.description}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
${featureCards}
    </div>
  </div>
</section>`;
    }

    // =========================================================================
    // PRICING
    // =========================================================================
    case 'pricing': {
      const plans = [
        { name: 'Starter', price: '$9', period: '/mo', features: ['5 Projects', '10GB Storage', 'Basic Analytics', 'Email Support'] },
        { name: 'Pro', price: '$29', period: '/mo', features: ['Unlimited Projects', '100GB Storage', 'Advanced Analytics', 'Priority Support', 'Custom Domain'], popular: true },
        { name: 'Enterprise', price: '$99', period: '/mo', features: ['Everything in Pro', '1TB Storage', 'Dedicated Support', 'SLA Guarantee', 'Custom Integrations'] },
      ];

      const pricingCards = plans
        .map((p) => {
          const highlight = p.popular
            ? isLight
              ? 'ring-2 ring-violet-500 relative'
              : isDark
                ? 'ring-2 ring-violet-500 relative'
                : 'ring-2 ring-white relative'
            : '';
          const badge = p.popular
            ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 ${isLight ? 'bg-violet-600 text-white' : isDark ? 'bg-violet-600 text-white' : 'bg-white text-gray-900'} text-xs font-bold rounded-full">POPULAR</span>`
            : '';
          const featureList = p.features
            .map(
              (f) =>
                `<li class="flex items-center gap-2 text-sm ${mutedColor}"><span class="${isLight ? 'text-green-600' : 'text-green-400'}">\u2713</span> ${f}</li>`,
            )
            .join('\n              ');
          return `      <div class="${cardClass} ${highlight} p-8 text-center ${fontFamily}">
        ${badge}
        <h3 class="text-lg font-semibold ${textColor} mb-2">${p.name}</h3>
        <div class="mb-6">
          <span class="text-4xl font-bold ${textColor}">${p.price}</span>
          <span class="${mutedColor}">${p.period}</span>
        </div>
        <ul class="space-y-3 mb-8 text-left">
              ${featureList}
        </ul>
        <a href="#" class="${btnPrimary} w-full block text-center">Choose Plan</a>
      </div>`;
        })
        .join('\n');

      return `<section class="py-20 ${bg} ${isBrutal ? 'border-y-4 border-black' : ''}">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold ${textColor} mb-4 ${fontFamily}">${variant.name}</h2>
      <p class="text-lg ${mutedColor} max-w-2xl mx-auto">${variant.description}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
${pricingCards}
    </div>
  </div>
</section>`;
    }

    // =========================================================================
    // TESTIMONIALS
    // =========================================================================
    case 'testimonials': {
      const reviews = [
        { name: 'Sarah Johnson', role: 'CEO, TechFlow', quote: 'This platform transformed our workflow. We shipped 3x faster in the first month alone.' },
        { name: 'Mike Chen', role: 'Lead Designer, PixelCo', quote: 'The design flexibility is incredible. Our team loves the component system.' },
        { name: 'Emily Rodriguez', role: 'Founder, GreenLeaf', quote: 'Best investment we made this year. The ROI was visible within weeks.' },
      ];

      const testimonialCards = reviews
        .map(
          (r) => `      <div class="${cardClass}">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full ${isLight ? 'bg-violet-100 text-violet-600' : isDark ? 'bg-gray-800 text-violet-400' : 'bg-white/20 text-white'} flex items-center justify-center font-bold text-sm ${fontFamily}">${r.name[0]}</div>
          <div>
            <p class="font-semibold ${textColor} text-sm">${r.name}</p>
            <p class="text-xs ${mutedColor}">${r.role}</p>
          </div>
        </div>
        <p class="${mutedColor} text-sm leading-relaxed italic">"${r.quote}"</p>
        <div class="flex gap-0.5 mt-4">${'\u2605'.repeat(5).split('').map(() => `<span class="${isLight ? 'text-amber-400' : isDark ? 'text-amber-400' : 'text-white'} text-sm">\u2605</span>`).join('')}</div>
      </div>`,
        )
        .join('\n');

      return `<section class="py-20 ${bg} ${isBrutal ? 'border-y-4 border-black' : ''}">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold ${textColor} mb-4 ${fontFamily}">${variant.name}</h2>
      <p class="text-lg ${mutedColor} max-w-2xl mx-auto">${variant.description}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
${testimonialCards}
    </div>
  </div>
</section>`;
    }

    // =========================================================================
    // CTA
    // =========================================================================
    case 'cta': {
      if (isDark) {
        return `<section class="py-20 bg-gray-950 ${isBrutal ? 'border-y-4 border-black' : ''}">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 ${fontFamily}">${variant.name}</h2>
    <p class="text-lg text-gray-400 mb-10 max-w-xl mx-auto">${variant.description}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="${btnPrimary}">Get Started Free</a>
      <a href="#" class="px-6 py-3 text-gray-400 hover:text-white transition-colors">Talk to Sales \u2192</a>
    </div>
  </div>
</section>`;
      }

      if (isGradient) {
        return `<section class="py-20" style="background: linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #ec4899 100%);">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="text-3xl md:text-5xl font-bold text-white mb-6">${variant.name}</h2>
    <p class="text-lg text-white/80 mb-10 max-w-xl mx-auto">${variant.description}</p>
    <a href="#" class="${btnPrimary}">Get Started Free</a>
  </div>
</section>`;
      }

      if (isGlass) {
        return `<section class="py-20" style="background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);">
  <div class="max-w-2xl mx-auto px-6 text-center">
    <div class="bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 p-10">
      <h2 class="text-3xl font-bold text-white mb-4">${variant.name}</h2>
      <p class="text-white/80 mb-8">${variant.description}</p>
      <div class="flex gap-3 max-w-md mx-auto">
        <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40" />
        <a href="#" class="${btnPrimary} whitespace-nowrap">Subscribe</a>
      </div>
    </div>
  </div>
</section>`;
      }

      if (isRetro) {
        return `<section class="py-20 bg-amber-50 border-y-4 border-amber-800">
  <div class="max-w-3xl mx-auto px-6 text-center font-serif">
    <div class="border-2 border-amber-300 p-8 shadow-[6px_6px_0_0_amber-300]">
      <h2 class="text-3xl font-bold text-amber-950 mb-4">${variant.name}</h2>
      <p class="text-amber-800 mb-8">${variant.description}</p>
      <a href="#" class="${btnPrimary}">Join the Club</a>
    </div>
  </div>
</section>`;
      }

      if (isNeo) {
        return `<section class="py-20 bg-gray-200">
  <div class="max-w-2xl mx-auto px-6 text-center">
    <div class="bg-gray-200 rounded-3xl p-10 shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff]">
      <h2 class="text-3xl font-bold text-gray-800 mb-4">${variant.name}</h2>
      <p class="text-gray-600 mb-8">${variant.description}</p>
      <div class="flex gap-3 max-w-md mx-auto">
        <input type="email" placeholder="Your email" class="flex-1 px-4 py-3 bg-gray-200 rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] text-gray-800 focus:outline-none" />
        <a href="#" class="${btnPrimary} whitespace-nowrap">Subscribe</a>
      </div>
    </div>
  </div>
</section>`;
      }

      if (isBrutal) {
        return `<section class="py-20 bg-yellow-300 border-y-8 border-black">
  <div class="max-w-3xl mx-auto px-6 text-center font-mono uppercase">
    <h2 class="text-4xl md:text-5xl font-black text-black mb-4">${variant.name}</h2>
    <div class="w-24 h-2 bg-black mx-auto mb-6"></div>
    <p class="text-lg text-gray-800 mb-10 normal-case">${variant.description}</p>
    <a href="#" class="${btnPrimary}">SIGN UP NOW \u2192</a>
  </div>
</section>`;
      }

      // minimal / bold
      return `<section class="py-20 bg-white">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">${variant.name}</h2>
    <p class="text-lg text-gray-600 mb-10 max-w-xl mx-auto">${variant.description}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="${btnPrimary}">Get Started Free</a>
      <a href="#" class="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors">Contact Sales \u2192</a>
    </div>
  </div>
</section>`;
    }

    // =========================================================================
    // ABOUT
    // =========================================================================
    case 'about': {
      const team = [
        { name: 'Alex Rivera', role: 'CEO & Founder', initial: 'A' },
        { name: 'Jordan Lee', role: 'CTO', initial: 'J' },
        { name: 'Sam Patel', role: 'Head of Design', initial: 'S' },
        { name: 'Morgan Wu', role: 'Lead Engineer', initial: 'M' },
      ];

      const teamCards = team
        .map(
          (t) => `      <div class="${cardClass} text-center">
        <div class="w-16 h-16 rounded-full ${isLight ? 'bg-violet-100 text-violet-600' : isDark ? 'bg-gray-800 text-violet-400' : 'bg-white/20 text-white'} flex items-center justify-center mx-auto mb-4 font-bold text-xl ${fontFamily}">${t.initial}</div>
        <h3 class="font-semibold ${textColor} mb-1">${t.name}</h3>
        <p class="text-sm ${mutedColor}">${t.role}</p>
      </div>`,
        )
        .join('\n');

      return `<section class="py-20 ${bg} ${isBrutal ? 'border-y-4 border-black' : ''}">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold ${textColor} mb-4 ${fontFamily}">${variant.name}</h2>
      <p class="text-lg ${mutedColor} max-w-2xl mx-auto">${variant.description}</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
${teamCards}
    </div>
    <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div><p class="text-3xl font-bold ${textColor} ${fontFamily}">150+</p><p class="text-sm ${mutedColor}">Team Members</p></div>
      <div><p class="text-3xl font-bold ${textColor} ${fontFamily}">50K+</p><p class="text-sm ${mutedColor}">Customers</p></div>
      <div><p class="text-3xl font-bold ${textColor} ${fontFamily}">99.9%</p><p class="text-sm ${mutedColor}">Uptime</p></div>
      <div><p class="text-3xl font-bold ${textColor} ${fontFamily}">24/7</p><p class="text-sm ${mutedColor}">Support</p></div>
    </div>
  </div>
</section>`;
    }

    // =========================================================================
    // FOOTER
    // =========================================================================
    case 'footer': {
      const footerLinks = [
        { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
        { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
        { title: 'Resources', links: ['Documentation', 'Help Center', 'API', 'Community'] },
        { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
      ];

      const columns = footerLinks
        .map(
          (col) => `      <div>
        <h4 class="font-semibold ${textColor} mb-4 ${fontFamily}">${col.title}</h4>
        <ul class="space-y-2">
          ${col.links.map((l) => `<li><a href="#" class="text-sm ${mutedColor} hover:${isLight ? 'text-gray-900' : 'text-white'} transition-colors">${l}</a></li>`).join('\n          ')}
        </ul>
      </div>`,
        )
        .join('\n');

      if (isDark) {
        return `<footer class="bg-gray-950 border-t border-gray-800 pt-16 pb-8">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
      <div>
        <a href="#" class="text-xl font-bold text-white">Brand<span class="text-emerald-400">.</span></a>
        <p class="text-sm text-gray-500 mt-3">Building the future of web design, one component at a time.</p>
      </div>
      ${columns}
    </div>
    <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-gray-500">\u00a9 2024 Brand. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-gray-500 hover:text-white transition-colors text-sm">Twitter</a>
        <a href="#" class="text-gray-500 hover:text-white transition-colors text-sm">GitHub</a>
        <a href="#" class="text-gray-500 hover:text-white transition-colors text-sm">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`;
      }

      if (isGradient) {
        return `<footer class="pt-16 pb-8" style="background: linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95);">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
      <div>
        <a href="#" class="text-xl font-bold text-white">Brand<span class="text-fuchsia-400">.</span></a>
        <p class="text-sm text-white/60 mt-3">Building the future of web design.</p>
      </div>
      ${columns}
    </div>
    <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-white/50">\u00a9 2024 Brand. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-white/50 hover:text-white transition-colors text-sm">Twitter</a>
        <a href="#" class="text-white/50 hover:text-white transition-colors text-sm">GitHub</a>
        <a href="#" class="text-white/50 hover:text-white transition-colors text-sm">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`;
      }

      if (isGlass) {
        return `<footer class="pt-16 pb-8 bg-gray-900/80 backdrop-blur-xl border-t border-white/10">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
      <div>
        <a href="#" class="text-xl font-bold text-white">Brand<span class="text-cyan-400">.</span></a>
        <p class="text-sm text-gray-400 mt-3">Building the future of web design.</p>
      </div>
      ${columns}
    </div>
    <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-gray-500">\u00a9 2024 Brand. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Twitter</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">GitHub</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`;
      }

      if (isRetro) {
        return `<footer class="bg-amber-50 border-t-4 border-amber-800 pt-16 pb-8 font-serif">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
      <div>
        <a href="#" class="text-xl font-bold text-amber-950">\u2605 Brand Co.</a>
        <p class="text-sm text-amber-800 mt-3">Crafting quality goods since 2024.</p>
      </div>
      ${columns}
    </div>
    <div class="border-t-2 border-amber-300 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-amber-800">\u00a9 2024 Brand Co. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-amber-800 hover:text-amber-950 transition-colors text-sm">Twitter</a>
        <a href="#" class="text-amber-800 hover:text-amber-950 transition-colors text-sm">Instagram</a>
        <a href="#" class="text-amber-800 hover:text-amber-950 transition-colors text-sm">Facebook</a>
      </div>
    </div>
  </div>
</footer>`;
      }

      if (isNeo) {
        return `<footer class="bg-gray-200 pt-16 pb-8">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
      <div>
        <a href="#" class="text-xl font-bold text-gray-800">Brand</a>
        <p class="text-sm text-gray-600 mt-3">Crafted with care for the modern web.</p>
      </div>
      ${columns}
    </div>
    <div class="bg-gray-200 rounded-2xl p-6 shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-gray-600">\u00a9 2024 Brand. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">Twitter</a>
        <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">GitHub</a>
        <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`;
      }

      if (isBrutal) {
        return `<footer class="bg-white border-t-8 border-black pt-16 pb-8 font-mono uppercase">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
      <div>
        <a href="#" class="text-xl font-black text-black">BRAND//</a>
        <p class="text-sm text-gray-800 mt-3 normal-case">No fluff. Just results.</p>
      </div>
      ${columns}
    </div>
    <div class="border-t-4 border-black pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-gray-800 normal-case">\u00a9 2024 Brand. No rights reserved.</p>
      <div class="flex gap-4 text-sm font-bold">
        <a href="#" class="text-black hover:text-red-600 transition-colors">X</a>
        <a href="#" class="text-black hover:text-red-600 transition-colors">GH</a>
        <a href="#" class="text-black hover:text-red-600 transition-colors">LI</a>
      </div>
    </div>
  </div>
</footer>`;
      }

      // minimal / bold
      return `<footer class="bg-gray-900 pt-16 pb-8">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
      <div>
        <a href="#" class="text-xl font-bold text-white">Brand<span class="text-violet-400">.</span></a>
        <p class="text-sm text-gray-500 mt-3">Building the future of web design.</p>
      </div>
      ${columns}
    </div>
    <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-gray-500">\u00a9 2024 Brand. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-gray-500 hover:text-white transition-colors text-sm">Twitter</a>
        <a href="#" class="text-gray-500 hover:text-white transition-colors text-sm">GitHub</a>
        <a href="#" class="text-gray-500 hover:text-white transition-colors text-sm">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`;
    }

    // =========================================================================
    // FALLBACK (contact, gallery, themes)
    // =========================================================================
    default:
      return `<section class="py-16 px-6 ${bg} ${isBrutal ? 'border-y-4 border-black' : ''}">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl font-bold ${textColor} mb-4 ${fontFamily}">${variant.name}</h2>
    <p class="${mutedColor}">${variant.description}</p>
  </div>
</section>`;
  }
}
