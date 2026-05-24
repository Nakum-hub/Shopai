// =============================================================================
// StoreCraft AI — Design Token Consistency System
// =============================================================================

// =============================================================================
// Types
// =============================================================================

type TokenCategory = 'color' | 'spacing' | 'typography' | 'border' | 'shadow' | 'radius' | 'opacity' | 'z-index' | 'transition' | 'breakpoint' | 'animation';

interface DesignToken {
  name: string;
  value: string | number;
  category: TokenCategory;
  description: string;
  group?: string;
  inheritable?: boolean;
  deprecated?: boolean;
  aliasOf?: string;
}

interface TokenSet {
  id: string;
  name: string;
  description: string;
  tokens: Map<string, DesignToken>;
  parent?: string;
  version: string;
}

interface ResolvedToken extends DesignToken {
  aliasChain: string[];
}

interface TokenValidationResult {
  valid: boolean;
  score: number;
  issues: { severity: 'error' | 'warning' | 'info'; message: string }[];
}

// =============================================================================
// Token Registry
// =============================================================================

class TokenRegistry {
  private sets = new Map<string, TokenSet>();

  registerTokenSet(set: TokenSet): void {
    this.sets.set(set.id, set);
  }

  getToken(name: string, setId?: string): ResolvedToken | null {
    const set = setId ? this.sets.get(setId) : this.getFirstSet();
    if (!set) return null;

    const token = set.tokens.get(name);
    if (!token) return null;

    const chain: string[] = [];
    let current = token;
    while (current.aliasOf) {
      chain.push(current.aliasOf);
      const resolved = set.tokens.get(current.aliasOf);
      if (!resolved) break;
      current = resolved;
    }

    return { ...current, value: current.value, aliasChain: chain };
  }

  getTokensByCategory(category: TokenCategory, setId?: string): DesignToken[] {
    const set = setId ? this.sets.get(setId) : this.getFirstSet();
    if (!set) return [];
    return [...set.tokens.values()].filter(t => t.category === category && !t.deprecated);
  }

  getTokensByGroup(group: string, setId?: string): DesignToken[] {
    const set = setId ? this.sets.get(setId) : this.getFirstSet();
    if (!set) return [];
    return [...set.tokens.values()].filter(t => t.group === group && !t.deprecated);
  }

  listTokenSets(): { id: string; name: string; tokenCount: number; version: string }[] {
    return [...this.sets.values()].map(s => ({
      id: s.id, name: s.name, tokenCount: s.tokens.size, version: s.version,
    }));
  }

  private getFirstSet(): TokenSet | undefined {
    return this.sets.values().next().value;
  }
}

// =============================================================================
// Token Validator
// =============================================================================

class TokenValidator {
  validateColorTokens(tokens: DesignToken[]): TokenValidationResult {
    const issues: TokenValidationResult['issues'] = [];
    let score = 100;

    const colorTokens = tokens.filter(t => t.category === 'color');
    for (const token of colorTokens) {
      if (typeof token.value === 'string') {
        if (!/^#[0-9a-fA-F]{3,8}$/.test(token.value) && !/^hsl/i.test(token.value) && !/^rgb/i.test(token.value) && !token.value.startsWith('var(')) {
          issues.push({ severity: 'warning', message: `Token "${token.name}" has invalid color format: ${token.value}` });
          score -= 5;
        }
      }
    }

    // Check naming convention
    for (const token of tokens) {
      if (!/^[a-z][a-z0-9-]*(-[a-z0-9]+)*$/.test(token.name)) {
        issues.push({ severity: 'info', message: `Token "${token.name}" doesn't follow naming convention: {category}-{name}` });
      }
    }

    return { valid: issues.filter(i => i.severity === 'error').length === 0, score: Math.max(0, score), issues };
  }

  validateSpacingTokens(tokens: DesignToken[]): TokenValidationResult {
    const issues: TokenValidationResult['issues'] = [];
    const spacingTokens = tokens.filter(t => t.category === 'spacing');
    const validBaseUnits = [4, 8];

    for (const token of spacingTokens) {
      if (typeof token.value === 'number') {
        if (token.value <= 0) {
          issues.push({ severity: 'error', message: `Spacing token "${token.name}" has non-positive value` });
        }
      }
    }

    if (spacingTokens.length > 0) {
      const values = spacingTokens.map(t => typeof t.value === 'number' ? t.value : parseInt(String(t.value))).filter(v => !isNaN(v));
      if (values.length >= 3) {
        const min = Math.min(...values);
        const isStandardBase = validBaseUnits.some(b => min === b || min % b === 0);
        if (!isStandardBase) {
          issues.push({ severity: 'info', message: `Spacing base unit ${min}px doesn't follow 4px or 8px grid` });
        }
      }
    }

    return { valid: issues.filter(i => i.severity === 'error').length === 0, score: Math.max(0, 100 - issues.length * 10), issues };
  }

  validateTypographyTokens(tokens: DesignToken[]): TokenValidationResult {
    const issues: TokenValidationResult['issues'] = [];
    const modScales = [1.067, 1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618];

    const sizeTokens = tokens.filter(t => t.category === 'typography' && t.name.includes('size'));
    const sizes = sizeTokens.map(t => typeof t.value === 'number' ? t.value : parseFloat(String(t.value))).filter(v => !isNaN(v) && v > 0).sort((a, b) => a - b);

    if (sizes.length >= 3) {
      const ratios: number[] = [];
      for (let i = 1; i < sizes.length; i++) {
        ratios.push(sizes[i] / sizes[i - 1]);
      }
      const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      const closest = modScales.reduce((best, s) => Math.abs(s - avgRatio) < Math.abs(best - avgRatio) ? s : best, 1.25);
      if (Math.abs(avgRatio - closest) / closest > 0.2) {
        issues.push({ severity: 'info', message: `Typography scale ratio ${avgRatio.toFixed(3)} doesn't match standard modular scales. Closest: ${closest}` });
      }
    }

    return { valid: true, score: Math.max(0, 100 - issues.length * 10), issues };
  }

  validateNamingConvention(token: DesignToken): { valid: boolean; message: string } {
    const expected = `{category}-{name}${token.group ? `[-{variant}]` : ''}`;
    const parts = token.name.split('-');
    const hasCategory = ['color', 'spacing', 'font', 'border', 'shadow', 'radius', 'opacity', 'z', 'transition', 'breakpoint', 'animation'].includes(parts[0]);
    return {
      valid: hasCategory && parts.length >= 2,
      message: hasCategory ? 'Valid naming' : `Should follow pattern: ${expected}`,
    };
  }

  validateCompleteSet(set: TokenSet): TokenValidationResult {
    const allIssues: TokenValidationResult['issues'] = [];
    const tokens = [...set.tokens.values()];
    const categories = new Set(tokens.map(t => t.category));

    const requiredCategories: TokenCategory[] = ['color', 'spacing', 'typography'];
    for (const cat of requiredCategories) {
      if (!categories.has(cat)) {
        allIssues.push({ severity: 'warning', message: `Token set missing "${cat}" category` });
      }
    }

    const colorIssues = this.validateColorTokens(tokens);
    const spacingIssues = this.validateSpacingTokens(tokens);
    const typoIssues = this.validateTypographyTokens(tokens);

    allIssues.push(...colorIssues.issues, ...spacingIssues.issues, ...typoIssues.issues);

    return {
      valid: allIssues.filter(i => i.severity === 'error').length === 0,
      score: Math.round((colorIssues.score + spacingIssues.score + typoIssues.score) / 3),
      issues: allIssues,
    };
  }
}

// =============================================================================
// Token Generator
// =============================================================================

class TokenGenerator {
  generateColorScale(baseColor: string, steps: number = 11): { name: string; value: string }[] {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return [];

    const result: { name: string; value: string }[] = [];
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].slice(0, steps);

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      let lightness: number, saturation: number;

      if (t < 0.5) {
        lightness = 95 - (t * 2) * 40; // 95 → 55
        saturation = hsl.s * (0.3 + t * 2 * 0.7); // lower for lightest
      } else {
        lightness = 55 - ((t - 0.5) * 2) * 40; // 55 → 15
        saturation = hsl.s * (1 - ((t - 0.5) * 2) * 0.3); // slightly desaturate dark
      }

      lightness = Math.max(5, Math.min(97, lightness));
      saturation = Math.max(0, Math.min(100, saturation));

      const hex = this.hslToHex(hsl.h, saturation, lightness);
      result.push({ name: `color-${stops[i]}`, value: hex });
    }

    return result;
  }

  generateSpacingScale(baseUnit: number = 8): { name: string; value: number }[] {
    const values = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];
    return values.map((v, i) => ({
      name: i < 2 ? `space-${v}` : `space-${i + 1}`,
      value: Math.round(v * baseUnit * 10) / 10,
    }));
  }

  generateTypeScale(baseSize: number = 16, ratio: number = 1.25): { name: string; value: number }[] {
    const names = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
    return names.map((name, i) => ({
      name: `font-size-${name}`,
      value: Math.round(baseSize * Math.pow(ratio, i - 2) * 100) / 100,
    }));
  }

  // ─── Color Helpers ──────────────────────────────────────────────────

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      else if (max === gn) h = ((bn - rn) / d + 2) * 60;
      else h = ((rn - gn) / d + 4) * 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  private hslToHex(h: number, s: number, l: number): string {
    const sn = s / 100, ln = l / 100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = ln - c / 2;
    let rn = 0, gn = 0, bn = 0;
    if (h < 60) { rn = c; gn = x; }
    else if (h < 120) { rn = x; gn = c; }
    else if (h < 180) { gn = c; bn = x; }
    else if (h < 240) { gn = x; bn = c; }
    else if (h < 300) { rn = x; bn = c; }
    else { rn = c; bn = x; }
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(rn)}${toHex(gn)}${toHex(bn)}`;
  }
}

// =============================================================================
// Token Exporter
// =============================================================================

class TokenExporter {
  exportToCSS(set: TokenSet): string {
    const lines = [':root {'];
    for (const [name, token] of set.tokens) {
      if (token.deprecated) continue;
      const varName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
      lines.push(`  --${varName}: ${token.value};`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  exportToTailwind(set: TokenSet): Record<string, unknown> {
    const extension: Record<string, unknown> = { theme: { extend: {} } };
    const extend = extension.theme as Record<string, unknown>;
    const ext = (extend.extend as Record<string, unknown>) || {};
    extend.extend = ext;

    const colors: Record<string, string> = {};
    const spacing: Record<string, string> = {};
    const fontSize: Record<string, string> = {};

    for (const [name, token] of set.tokens) {
      if (token.deprecated) continue;
      const val = String(token.value);
      if (token.category === 'color') colors[name.replace('color-', '')] = val;
      else if (token.category === 'spacing') spacing[name.replace('space-', '')] = val;
      else if (token.category === 'typography' && name.includes('size')) fontSize[name.replace('font-size-', '')] = val;
    }

    if (Object.keys(colors).length > 0) ext.colors = colors;
    if (Object.keys(spacing).length > 0) ext.spacing = spacing;
    if (Object.keys(fontSize).length > 0) ext.fontSize = fontSize;

    return extension;
  }

  exportToJSON(set: TokenSet): Record<string, unknown> {
    const tokens: Record<string, { value: string | number; category: string; description: string }> = {};
    for (const [name, token] of set.tokens) {
      tokens[name] = { value: token.value, category: token.category, description: token.description };
    }
    return { $schema: 'https://design-tokens.github.io/community-group/format/', [set.id]: tokens };
  }
}

// =============================================================================
// Register Default Token Set
// =============================================================================

function createDefaultTokenSet(): TokenSet {
  const tokens = new Map<string, DesignToken>();

  // Gray scale
  const grays = [
    { name: 'color-gray-50', value: '#fafafa' }, { name: 'color-gray-100', value: '#f4f4f5' },
    { name: 'color-gray-200', value: '#e4e4e7' }, { name: 'color-gray-300', value: '#d4d4d8' },
    { name: 'color-gray-400', value: '#a1a1aa' }, { name: 'color-gray-500', value: '#71717a' },
    { name: 'color-gray-600', value: '#52525b' }, { name: 'color-gray-700', value: '#3f3f46' },
    { name: 'color-gray-800', value: '#27272a' }, { name: 'color-gray-900', value: '#18181b' },
    { name: 'color-gray-950', value: '#09090b' },
  ];
  for (const g of grays) tokens.set(g.name, { ...g, category: 'color', description: `Gray ${g.name.split('-').pop()}`, group: 'neutral', inheritable: true });

  // Semantic colors
  const semantics = [
    { name: 'color-primary', value: '#171717', description: 'Primary brand color' },
    { name: 'color-secondary', value: '#6366f1', description: 'Secondary brand color' },
    { name: 'color-accent', value: '#f59e0b', description: 'Accent color' },
    { name: 'color-background', value: '#ffffff', description: 'Page background' },
    { name: 'color-foreground', value: '#0a0a0a', description: 'Primary text color' },
    { name: 'color-muted', value: '#a1a1aa', description: 'Muted text color' },
    { name: 'color-border', value: '#e4e4e7', description: 'Border color' },
    { name: 'color-card', value: '#ffffff', description: 'Card background' },
    { name: 'color-destructive', value: '#ef4444', description: 'Error/destructive color' },
    { name: 'color-success', value: '#22c55e', description: 'Success color' },
    { name: 'color-warning', value: '#f59e0b', description: 'Warning color' },
  ];
  for (const s of semantics) tokens.set(s.name, { ...s, category: 'color', group: 'semantic', inheritable: true });

  // Spacing scale
  const gen = new TokenGenerator();
  for (const sp of gen.generateSpacingScale(8)) {
    tokens.set(sp.name, { name: sp.name, value: sp.value, category: 'spacing', description: `${sp.value}px spacing`, inheritable: true });
  }

  // Typography scale
  for (const ts of gen.generateTypeScale(16, 1.25)) {
    tokens.set(ts.name, { name: ts.name, value: ts.value, category: 'typography', description: `${ts.value}px font size`, group: 'font-size' });
  }

  // Border radius
  const radii = [
    { name: 'radius-none', value: '0' }, { name: 'radius-sm', value: '0.25rem' },
    { name: 'radius-md', value: '0.375rem' }, { name: 'radius-lg', value: '0.5rem' },
    { name: 'radius-xl', value: '0.75rem' }, { name: 'radius-2xl', value: '1rem' },
    { name: 'radius-full', value: '9999px' },
  ];
  for (const r of radii) tokens.set(r.name, { ...r, category: 'radius', description: `Border radius ${r.name}` });

  // Shadows
  const shadows = [
    { name: 'shadow-sm', value: '0 1px 2px 0 rgba(0,0,0,0.05)' },
    { name: 'shadow-md', value: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    { name: 'shadow-lg', value: '0 10px 15px -3px rgba(0,0,0,0.1)' },
    { name: 'shadow-xl', value: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  ];
  for (const s of shadows) tokens.set(s.name, { ...s, category: 'shadow', description: `Shadow ${s.name}` });

  return {
    id: 'storecraft-default',
    name: 'StoreCraft Default',
    description: 'Default design token set for StoreCraft AI',
    tokens,
    version: '1.0.0',
  };
}

// =============================================================================
// Singletons
// =============================================================================

const tokenRegistry = new TokenRegistry();
const tokenValidator = new TokenValidator();
const tokenGenerator = new TokenGenerator();
const tokenExporter = new TokenExporter();

// Register default token set
tokenRegistry.registerTokenSet(createDefaultTokenSet());

export { tokenRegistry, tokenValidator, tokenGenerator, tokenExporter };
export type { DesignToken, TokenSet, TokenCategory, ResolvedToken, TokenValidationResult };
