// =============================================================================
// StoreCraft AI — Theme Inheritance System
// =============================================================================

// =============================================================================
// Types
// =============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent?: string;
  background: string;
  foreground: string;
  muted: string;
  border?: string;
  card?: string;
  destructive?: string;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFont?: string;
  monoFont?: string;
  baseFontSize: number;
  headingScale: number;
}

export interface ThemeSpacing {
  unit: number;
  sectionPadding: string;
  containerPadding: string;
}

export interface ThemeEffects {
  backdropBlur: boolean;
  gradients: boolean;
  animations: boolean;
  transitions: boolean;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  parent?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: string;
  shadows: string[];
  effects: ThemeEffects;
  metadata: {
    author: string;
    version: string;
    description: string;
    tags: string[];
    mood: string[];
  };
}

export interface ResolvedTheme extends ThemeDefinition {
  inheritanceChain: string[];
}

// =============================================================================
// Built-in Themes
// =============================================================================

const BUILTIN_THEMES: ThemeDefinition[] = [
  {
    id: 'light', name: 'Light',
    colors: { primary: '#171717', secondary: '#6366f1', accent: '#f59e0b', background: '#ffffff', foreground: '#0a0a0a', muted: '#a1a1aa', border: '#e4e4e7', card: '#ffffff', destructive: '#ef4444' },
    typography: { fontFamily: "'Inter', sans-serif", headingFont: "'Inter', sans-serif", monoFont: "'Fira Code', monospace", baseFontSize: 16, headingScale: 1.25 },
    spacing: { unit: 8, sectionPadding: '4rem', containerPadding: '1.5rem' },
    borderRadius: '0.5rem',
    shadows: ['0 1px 2px 0 rgba(0,0,0,0.05)', '0 4px 6px -1px rgba(0,0,0,0.1)', '0 10px 15px -3px rgba(0,0,0,0.1)', '0 20px 25px -5px rgba(0,0,0,0.1)', '0 25px 50px -12px rgba(0,0,0,0.25)'],
    effects: { backdropBlur: false, gradients: true, animations: true, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Clean white background with dark text', tags: ['light', 'clean', 'default'], mood: ['clean', 'modern', 'professional'] },
  },
  {
    id: 'dark', name: 'Dark', parent: 'light',
    colors: { primary: '#fafafa', secondary: '#818cf8', accent: '#fbbf24', background: '#09090b', foreground: '#fafafa', muted: '#71717a', border: '#27272a', card: '#18181b', destructive: '#f87171' },
    typography: { fontFamily: "'Inter', sans-serif", headingFont: "'Inter', sans-serif", monoFont: "'Fira Code', monospace", baseFontSize: 16, headingScale: 1.25 },
    spacing: { unit: 8, sectionPadding: '4rem', containerPadding: '1.5rem' },
    borderRadius: '0.5rem',
    shadows: ['0 1px 2px 0 rgba(0,0,0,0.3)', '0 4px 6px -1px rgba(0,0,0,0.4)', '0 10px 15px -3px rgba(0,0,0,0.4)', '0 20px 25px -5px rgba(0,0,0,0.5)', '0 25px 50px -12px rgba(0,0,0,0.6)'],
    effects: { backdropBlur: true, gradients: true, animations: true, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Dark background with light text', tags: ['dark', 'mode', 'night'], mood: ['modern', 'sleek', 'professional'] },
  },
  {
    id: 'warm', name: 'Warm',
    colors: { primary: '#78350f', secondary: '#d97706', accent: '#ea580c', background: '#fffbeb', foreground: '#451a03', muted: '#a16207', border: '#fde68a', card: '#fef3c7', destructive: '#dc2626' },
    typography: { fontFamily: "'Lora', serif", headingFont: "'Playfair Display', serif", monoFont: "'Fira Code', monospace", baseFontSize: 16, headingScale: 1.25 },
    spacing: { unit: 8, sectionPadding: '4rem', containerPadding: '1.5rem' },
    borderRadius: '0.375rem',
    shadows: ['0 1px 2px 0 rgba(120,53,15,0.05)', '0 4px 6px -1px rgba(120,53,15,0.1)', '0 10px 15px -3px rgba(120,53,15,0.1)'],
    effects: { backdropBlur: false, gradients: true, animations: false, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Warm earth tones with cozy feel', tags: ['warm', 'earth', 'cozy'], mood: ['warm', 'rustic', 'inviting'] },
  },
  {
    id: 'cool', name: 'Cool',
    colors: { primary: '#0c4a6e', secondary: '#0ea5e9', accent: '#06b6d4', background: '#f0f9ff', foreground: '#082f49', muted: '#64748b', border: '#bae6fd', card: '#e0f2fe', destructive: '#dc2626' },
    typography: { fontFamily: "'DM Sans', sans-serif", headingFont: "'Space Grotesk', sans-serif", monoFont: "'Fira Code', monospace", baseFontSize: 16, headingScale: 1.25 },
    spacing: { unit: 8, sectionPadding: '4rem', containerPadding: '1.5rem' },
    borderRadius: '0.625rem',
    shadows: ['0 1px 2px 0 rgba(12,74,110,0.05)', '0 4px 6px -1px rgba(12,74,110,0.1)', '0 10px 15px -3px rgba(12,74,110,0.1)'],
    effects: { backdropBlur: true, gradients: true, animations: true, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Cool blue-gray tones', tags: ['cool', 'blue', 'corporate'], mood: ['calm', 'professional', 'serene'] },
  },
  {
    id: 'minimal', name: 'Minimal',
    colors: { primary: '#18181b', secondary: '#52525b', accent: '#18181b', background: '#ffffff', foreground: '#09090b', muted: '#a1a1aa', border: '#e4e4e7', card: '#fafafa', destructive: '#ef4444' },
    typography: { fontFamily: "'Inter', sans-serif", headingFont: "'Inter', sans-serif", monoFont: "'JetBrains Mono', monospace", baseFontSize: 16, headingScale: 1.2 },
    spacing: { unit: 4, sectionPadding: '3rem', containerPadding: '1.5rem' },
    borderRadius: '0.25rem',
    shadows: ['0 1px 2px 0 rgba(0,0,0,0.03)'],
    effects: { backdropBlur: false, gradients: false, animations: false, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Near-black and white, stark minimalism', tags: ['minimal', 'clean', 'simple'], mood: ['clean', 'modern', 'understated'] },
  },
  {
    id: 'elegant', name: 'Elegant',
    colors: { primary: '#1c1917', secondary: '#c9a96e', accent: '#b8860b', background: '#fefce8', foreground: '#1c1917', muted: '#a8a29e', border: '#e7e5e4', card: '#ffffff', destructive: '#991b1b' },
    typography: { fontFamily: "'Cormorant Garamond', serif", headingFont: "'Playfair Display', serif", monoFont: "'Fira Code', monospace", baseFontSize: 17, headingScale: 1.333 },
    spacing: { unit: 8, sectionPadding: '5rem', containerPadding: '2rem' },
    borderRadius: '0.25rem',
    shadows: ['0 1px 3px 0 rgba(0,0,0,0.05)', '0 4px 6px -1px rgba(0,0,0,0.05)', '0 10px 15px -3px rgba(0,0,0,0.05)'],
    effects: { backdropBlur: false, gradients: false, animations: false, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Serif fonts with muted gold accents', tags: ['elegant', 'luxury', 'gold'], mood: ['sophisticated', 'luxurious', 'refined'] },
  },
  {
    id: 'playful', name: 'Playful',
    colors: { primary: '#7c3aed', secondary: '#ec4899', accent: '#f59e0b', background: '#fdf4ff', foreground: '#1e1b4b', muted: '#a78bfa', border: '#e9d5ff', card: '#faf5ff', destructive: '#ef4444' },
    typography: { fontFamily: "'Nunito', sans-serif", headingFont: "'Nunito', sans-serif", monoFont: "'Fira Code', monospace", baseFontSize: 16, headingScale: 1.333 },
    spacing: { unit: 8, sectionPadding: '3rem', containerPadding: '1.5rem' },
    borderRadius: '1rem',
    shadows: ['0 4px 6px -1px rgba(124,58,237,0.1)', '0 10px 15px -3px rgba(236,72,153,0.1)', '0 20px 25px -5px rgba(124,58,237,0.15)'],
    effects: { backdropBlur: true, gradients: true, animations: true, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Bright colors and rounded corners', tags: ['playful', 'fun', 'colorful'], mood: ['playful', 'creative', 'fun'] },
  },
  {
    id: 'professional', name: 'Professional',
    colors: { primary: '#1e3a5f', secondary: '#3b82f6', accent: '#0d9488', background: '#ffffff', foreground: '#0f172a', muted: '#64748b', border: '#e2e8f0', card: '#f8fafc', destructive: '#dc2626' },
    typography: { fontFamily: "'Inter', sans-serif", headingFont: "'Space Grotesk', sans-serif", monoFont: "'JetBrains Mono', monospace", baseFontSize: 16, headingScale: 1.25 },
    spacing: { unit: 8, sectionPadding: '4rem', containerPadding: '2rem' },
    borderRadius: '0.5rem',
    shadows: ['0 1px 3px 0 rgba(0,0,0,0.06)', '0 4px 6px -1px rgba(0,0,0,0.08)', '0 10px 15px -3px rgba(0,0,0,0.08)'],
    effects: { backdropBlur: false, gradients: false, animations: false, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Navy and gray, clean professional', tags: ['professional', 'corporate', 'business'], mood: ['professional', 'trustworthy', 'clean'] },
  },
  {
    id: 'nature', name: 'Nature',
    colors: { primary: '#14532d', secondary: '#16a34a', accent: '#ca8a04', background: '#f0fdf4', foreground: '#052e16', muted: '#4d7c0f', border: '#bbf7d0', card: '#dcfce7', destructive: '#dc2626' },
    typography: { fontFamily: "'DM Sans', sans-serif", headingFont: "'Lora', serif", monoFont: "'Fira Code', monospace", baseFontSize: 16, headingScale: 1.25 },
    spacing: { unit: 8, sectionPadding: '4rem', containerPadding: '1.5rem' },
    borderRadius: '0.5rem',
    shadows: ['0 1px 2px 0 rgba(20,83,45,0.05)', '0 4px 6px -1px rgba(20,83,45,0.1)', '0 10px 15px -3px rgba(20,83,45,0.1)'],
    effects: { backdropBlur: false, gradients: true, animations: false, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Greens and browns, organic feel', tags: ['nature', 'green', 'organic'], mood: ['natural', 'fresh', 'organic'] },
  },
  {
    id: 'vibrant', name: 'Vibrant',
    colors: { primary: '#7c3aed', secondary: '#f43f5e', accent: '#06b6d4', background: '#ffffff', foreground: '#0f0f23', muted: '#6b7280', border: '#e5e7eb', card: '#f9fafb', destructive: '#ef4444' },
    typography: { fontFamily: "'Poppins', sans-serif", headingFont: "'Space Grotesk', sans-serif", monoFont: "'Fira Code', monospace", baseFontSize: 16, headingScale: 1.333 },
    spacing: { unit: 8, sectionPadding: '4rem', containerPadding: '1.5rem' },
    borderRadius: '0.75rem',
    shadows: ['0 4px 6px -1px rgba(124,58,237,0.15)', '0 10px 15px -3px rgba(244,63,94,0.15)', '0 20px 25px -5px rgba(124,58,237,0.2)'],
    effects: { backdropBlur: true, gradients: true, animations: true, transitions: true },
    metadata: { author: 'StoreCraft', version: '1.0', description: 'Bold saturated colors for impact', tags: ['vibrant', 'bold', 'colorful'], mood: ['energetic', 'bold', 'dynamic'] },
  },
];

// =============================================================================
// Theme Registry
// =============================================================================

class ThemeRegistry {
  private themes = new Map<string, ThemeDefinition>();

  constructor() {
    for (const theme of BUILTIN_THEMES) {
      this.themes.set(theme.id, theme);
    }
  }

  register(theme: ThemeDefinition): void {
    this.themes.set(theme.id, theme);
  }

  get(id: string): ThemeDefinition | undefined {
    return this.themes.get(id);
  }

  has(id: string): boolean {
    return this.themes.has(id);
  }

  remove(id: string): boolean {
    return this.themes.delete(id);
  }

  list(): ThemeDefinition[] {
    return [...this.themes.values()];
  }

  listIds(): string[] {
    return [...this.themes.keys()];
  }
}

// =============================================================================
// Theme Resolver
// =============================================================================

function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const val = override[key];
    const baseVal = base[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        baseVal as object,
        val as object
      ) as T[keyof T];
    } else if (val !== undefined) {
      (result as Record<string, unknown>)[key as string] = val;
    }
  }
  return result;
}

class ThemeResolver {
  private registry: ThemeRegistry;

  constructor(registry: ThemeRegistry) {
    this.registry = registry;
  }

  /** Resolve full inheritance chain and return merged theme */
  resolve(themeId: string): ResolvedTheme {
    const theme = this.registry.get(themeId);
    if (!theme) throw new Error(`Theme "${themeId}" not found`);

    const chain: string[] = [];
    let current: ThemeDefinition | undefined = theme;

    // Walk up inheritance chain
    while (current) {
      chain.unshift(current.id);
      current = current.parent ? this.registry.get(current.parent) : undefined;
    }

    // Merge from root to leaf
    if (chain.length <= 1) {
      return { ...theme, inheritanceChain: chain };
    }

    let merged = { ...this.registry.get(chain[0])! };
    for (let i = 1; i < chain.length; i++) {
      const child = this.registry.get(chain[i])!;
      merged = deepMerge(merged, child) as ThemeDefinition;
    }

    return { ...merged, id: theme.id, name: theme.name, inheritanceChain: chain };
  }

  /** Merge a base theme with user overrides */
  mergeWithOverrides(base: ResolvedTheme, overrides: Partial<ThemeDefinition>): ResolvedTheme {
    return deepMerge(base, overrides) as ResolvedTheme;
  }

  /** Generate CSS custom properties from a resolved theme */
  exportToCSS(theme: ResolvedTheme): string {
    const lines = [':root {'];
    const c = theme.colors;
    lines.push(`  --color-primary: ${c.primary};`);
    lines.push(`  --color-secondary: ${c.secondary};`);
    if (c.accent) lines.push(`  --color-accent: ${c.accent};`);
    lines.push(`  --color-background: ${c.background};`);
    lines.push(`  --color-foreground: ${c.foreground};`);
    lines.push(`  --color-muted: ${c.muted};`);
    if (c.border) lines.push(`  --color-border: ${c.border};`);
    if (c.card) lines.push(`  --color-card: ${c.card};`);
    if (c.destructive) lines.push(`  --color-destructive: ${c.destructive};`);
    lines.push('');
    lines.push(`  --font-family: ${theme.typography.fontFamily};`);
    if (theme.typography.headingFont) lines.push(`  --font-heading: ${theme.typography.headingFont};`);
    if (theme.typography.monoFont) lines.push(`  --font-mono: ${theme.typography.monoFont};`);
    lines.push(`  --font-size-base: ${theme.typography.baseFontSize}px;`);
    lines.push(`  --heading-scale: ${theme.typography.headingScale};`);
    lines.push('');
    lines.push(`  --spacing-unit: ${theme.spacing.unit}px;`);
    lines.push(`  --section-padding: ${theme.spacing.sectionPadding};`);
    lines.push(`  --container-padding: ${theme.spacing.containerPadding};`);
    lines.push('');
    lines.push(`  --border-radius: ${theme.borderRadius};`);
    if (theme.shadows[0]) lines.push(`  --shadow-sm: ${theme.shadows[0]};`);
    if (theme.shadows[1]) lines.push(`  --shadow: ${theme.shadows[1]};`);
    if (theme.shadows[2]) lines.push(`  --shadow-md: ${theme.shadows[2]};`);
    if (theme.shadows[3]) lines.push(`  --shadow-lg: ${theme.shadows[3]};`);
    if (theme.shadows[4]) lines.push(`  --shadow-xl: ${theme.shadows[4]};`);
    lines.push('}');
    return lines.join('\n');
  }

  /** Generate Tailwind config extension */
  exportToTailwind(theme: ResolvedTheme): Record<string, unknown> {
    return {
      theme: {
        extend: {
          colors: {
            primary: theme.colors.primary,
            secondary: theme.colors.secondary,
            accent: theme.colors.accent,
            background: theme.colors.background,
            foreground: theme.colors.foreground,
            muted: theme.colors.muted,
            border: theme.colors.border,
            card: theme.colors.card,
            destructive: theme.colors.destructive,
          },
          fontFamily: {
            sans: [theme.typography.fontFamily.split(',')[0].replace(/'/g, ''), 'sans-serif'],
            heading: theme.typography.headingFont ? [theme.typography.headingFont.split(',')[0].replace(/'/g, ''), 'serif'] : undefined,
            mono: theme.typography.monoFont ? [theme.typography.monoFont.split(',')[0].replace(/'/g, ''), 'monospace'] : undefined,
          },
          borderRadius: {
            DEFAULT: theme.borderRadius,
          },
          spacing: {
            unit: `${theme.spacing.unit}px`,
          },
        },
      },
    };
  }

  /** Show differences between two themes */
  diffThemes(idA: string, idB: string): { field: string; valueA: string; valueB: string }[] {
    try {
      const a = this.resolve(idA);
      const b = this.resolve(idB);
      const diffs: { field: string; valueA: string; valueB: string }[] = [];

      const compare = (objA: unknown, objB: unknown, prefix: string) => {
        if (typeof objA !== typeof objB) {
          diffs.push({ field: prefix, valueA: JSON.stringify(objA), valueB: JSON.stringify(objB) });
          return;
        }
        if (typeof objA === 'object' && objA !== null && typeof objB === 'object' && objB !== null) {
          const allKeys = new Set([...Object.keys(objA as object), ...Object.keys(objB as object)]);
          for (const key of allKeys) {
            compare((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key], `${prefix}.${key}`);
          }
        } else if (objA !== objB) {
          diffs.push({ field: prefix, valueA: String(objA), valueB: String(objB) });
        }
      };

      compare(a.colors, b.colors, 'colors');
      compare(a.typography, b.typography, 'typography');
      compare(a.spacing, b.spacing, 'spacing');
      compare(a.effects, b.effects, 'effects');

      return diffs;
    } catch {
      return [];
    }
  }

  /** Create a child theme inheriting from a parent */
  createChildTheme(parentId: string, overrides: Partial<ThemeDefinition>, id: string, name: string): ThemeDefinition {
    const parent = this.registry.get(parentId);
    if (!parent) throw new Error(`Parent theme "${parentId}" not found`);
    const child = deepMerge(parent, overrides) as ThemeDefinition;
    child.id = id;
    child.name = name;
    child.parent = parentId;
    return child;
  }
}

// =============================================================================
// Singletons
// =============================================================================

export const themeRegistry = new ThemeRegistry();
export const themeResolver = new ThemeResolver(themeRegistry);
export { BUILTIN_THEMES, deepMerge };
