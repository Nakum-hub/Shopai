// =============================================================================
// StoreCraft AI — Section Normalization Engine
// =============================================================================
import type { BusinessCategory, StorefrontSection } from '@/lib/types';
import { SECTION_TYPES } from '@/lib/template-schema';

// =============================================================================
// Section Metadata Registry
// =============================================================================

interface SectionMeta {
  label: string;
  description: string;
  requiredFor: BusinessCategory[];
  recommendedFor: BusinessCategory[];
  defaultConfig: Record<string, unknown>;
  maxCount: number;
  recommendedOrder: number;
}

const SECTION_METADATA: Record<string, SectionMeta> = {
  hero: { label: 'Hero', description: 'Primary headline and call-to-action banner', requiredFor: ['bakery','restaurant','clothing','electronics','salon','grocery','hardware','medical','boutique','service','other'], recommendedFor: [], defaultConfig: { backgroundStyle: 'gradient', showCTA: true, ctaCount: 1 }, maxCount: 1, recommendedOrder: 0 },
  about: { label: 'About', description: 'Business story and mission', requiredFor: [], recommendedFor: ['bakery','restaurant','clothing','electronics','salon','grocery','hardware','medical','boutique','service','other'], defaultConfig: { showImage: true, layout: 'split' }, maxCount: 1, recommendedOrder: 1 },
  products: { label: 'Products', description: 'Product showcase or menu', requiredFor: ['bakery','restaurant','clothing','electronics','grocery','hardware','boutique'], recommendedFor: ['salon'], defaultConfig: { gridColumns: 3, cardStyle: 'standard' }, maxCount: 2, recommendedOrder: 2 },
  services: { label: 'Services', description: 'Service offerings and pricing', requiredFor: ['salon','medical','service'], recommendedFor: ['hardware','grocery'], defaultConfig: { showPricing: false, layout: 'cards' }, maxCount: 2, recommendedOrder: 3 },
  features: { label: 'Features', description: 'Key features or benefits', requiredFor: [], recommendedFor: ['electronics','grocery','hardware','service','other'], defaultConfig: { iconStyle: 'outlined', columns: 3 }, maxCount: 2, recommendedOrder: 4 },
  testimonials: { label: 'Testimonials', description: 'Customer reviews and ratings', requiredFor: [], recommendedFor: ['bakery','restaurant','clothing','electronics','salon','grocery','hardware','medical','boutique','service','other'], defaultConfig: { layout: 'grid', maxVisible: 6 }, maxCount: 2, recommendedOrder: 5 },
  gallery: { label: 'Gallery', description: 'Photo or video gallery', requiredFor: [], recommendedFor: ['bakery','restaurant','salon','clothing','boutique','medical'], defaultConfig: { layout: 'grid', columns: 3, imageCount: 6 }, maxCount: 2, recommendedOrder: 6 },
  pricing: { label: 'Pricing', description: 'Pricing plans or packages', requiredFor: [], recommendedFor: ['salon','service','electronics'], defaultConfig: { planCount: 3, showToggle: false }, maxCount: 1, recommendedOrder: 7 },
  team: { label: 'Team', description: 'Team members and staff', requiredFor: ['medical'], recommendedFor: ['salon','service','restaurant'], defaultConfig: { layout: 'grid', columns: 3 }, maxCount: 1, recommendedOrder: 8 },
  faq: { label: 'FAQ', description: 'Frequently asked questions', requiredFor: [], recommendedFor: ['restaurant','grocery','medical','service','other'], defaultConfig: { maxItems: 6 }, maxCount: 1, recommendedOrder: 9 },
  hours: { label: 'Hours', description: 'Business hours and schedule', requiredFor: ['restaurant'], recommendedFor: ['bakery','salon','grocery','hardware','medical','boutique','service'], defaultConfig: { showHolidayHours: false }, maxCount: 1, recommendedOrder: 10 },
  events: { label: 'Events', description: 'Upcoming events and special offers', requiredFor: [], recommendedFor: ['restaurant','salon','boutique'], defaultConfig: { maxEvents: 4 }, maxCount: 1, recommendedOrder: 11 },
  cta: { label: 'CTA', description: 'Call-to-action banner', requiredFor: [], recommendedFor: ['bakery','restaurant','clothing','salon','boutique','service'], defaultConfig: { style: 'gradient', buttonText: 'Get Started' }, maxCount: 1, recommendedOrder: 12 },
  map: { label: 'Map', description: 'Location map and directions', requiredFor: [], recommendedFor: ['restaurant','bakery','salon','grocery','hardware','medical','boutique','service'], defaultConfig: { showDirections: true, zoom: 14 }, maxCount: 1, recommendedOrder: 13 },
  contact: { label: 'Contact', description: 'Contact form and information', requiredFor: ['service'], recommendedFor: ['bakery','restaurant','clothing','electronics','salon','grocery','hardware','medical','boutique','other'], defaultConfig: { showForm: true, showMap: false }, maxCount: 1, recommendedOrder: 14 },
  footer: { label: 'Footer', description: 'Site footer with links and info', requiredFor: [], recommendedFor: ['bakery','restaurant','clothing','electronics','salon','grocery','hardware','medical','boutique','service','other'], defaultConfig: { showSocial: true, columns: 3 }, maxCount: 1, recommendedOrder: 15 },
};

const DEFAULT_ORDER: string[] = [
  'hero', 'about', 'products', 'services', 'features', 'testimonials',
  'gallery', 'pricing', 'team', 'faq', 'hours', 'events', 'cta', 'map', 'contact', 'footer',
];

// Category-specific ordering overrides
const CATEGORY_ORDER: Partial<Record<BusinessCategory, string[]>> = {
  restaurant: ['hero', 'about', 'products', 'hours', 'testimonials', 'gallery', 'events', 'cta', 'contact'],
  salon: ['hero', 'about', 'services', 'team', 'gallery', 'testimonials', 'pricing', 'cta', 'contact'],
  bakery: ['hero', 'about', 'products', 'gallery', 'testimonials', 'hours', 'cta', 'contact'],
  medical: ['hero', 'about', 'services', 'team', 'testimonials', 'faq', 'cta', 'contact'],
  boutique: ['hero', 'about', 'products', 'gallery', 'testimonials', 'events', 'cta', 'contact'],
};

// =============================================================================
// Types
// =============================================================================

interface NormalizationResult {
  sections: StorefrontSection[];
  changes: string[];
  addedSections: string[];
  removedSections: string[];
  reordered: boolean;
}

interface SectionRecommendation {
  type: string;
  label: string;
  priority: 'required' | 'recommended' | 'optional';
  reason: string;
}

// =============================================================================
// Section Normalizer
// =============================================================================

class SectionNormalizer {
  private meta = SECTION_METADATA;

  /** Get metadata for a section type */
  getSectionMeta(type: string): SectionMeta | undefined {
    return this.meta[type];
  }

  /** Get all section metadata */
  getAllMetadata(): Record<string, SectionMeta> {
    return { ...this.meta };
  }

  /** Normalize section order to canonical order for category */
  normalize(sections: StorefrontSection[], category: BusinessCategory): NormalizationResult {
    const changes: string[] = [];
    const orderKey = CATEGORY_ORDER[category] || DEFAULT_ORDER;

    // Deduplicate first
    let processed = this.deduplicateSections(sections);
    changes.push(...processed.changes);

    // Reorder
    const ordered = [...processed.sections].sort((a, b) => {
      const idxA = orderKey.indexOf(a.type);
      const idxB = orderKey.indexOf(b.type);
      if (idxA === -1 && idxB === -1) return a.order - b.order;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    // Reassign order values
    const reordered = ordered.map((s, i) => ({ ...s, order: i }));
    const wasReordered = reordered.some((s, i) => s.id !== processed.sections[i]?.id || s.order !== processed.sections[i]?.order);
    if (wasReordered) {
      changes.push(`Reordered ${sections.length} sections to canonical ${category} order`);
    }

    return {
      sections: reordered,
      changes,
      addedSections: [],
      removedSections: processed.removedTypes,
      reordered: wasReordered,
    };
  }

  /** Deep merge base sections with overrides */
  mergeSections(baseSections: StorefrontSection[], overrideSections: StorefrontSection[]): StorefrontSection[] {
    const overridesById = new Map(overrideSections.map(s => [s.id, s]));
    return baseSections.map(base => {
      const override = overridesById.get(base.id);
      if (!override) return base;
      return {
        ...base,
        ...override,
        config: { ...base.config, ...override.config },
      } as StorefrontSection;
    });
  }

  /** Remove duplicate section types, keep first occurrence */
  deduplicateSections(sections: StorefrontSection[]): { sections: StorefrontSection[]; changes: string[]; removedTypes: string[] } {
    const changes: string[] = [];
    const seen = new Map<string, number>();
    const removedTypes: string[] = [];

    const filtered = sections.filter((s) => {
      const meta = this.meta[s.type];
      const maxCount = meta?.maxCount ?? 1;
      const current = (seen.get(s.type) || 0) + 1;

      if (current > maxCount) {
        removedTypes.push(s.type);
        changes.push(`Removed duplicate "${s.type}" section (max ${maxCount})`);
        return false;
      }
      seen.set(s.type, current);
      return true;
    });

    return { sections: filtered, changes, removedTypes };
  }

  /** Auto-fill missing recommended sections for a category */
  fillMissingSections(sections: StorefrontSection[], category: BusinessCategory): NormalizationResult {
    const existing = new Set<string>(sections.map(s => s.type));
    const recommended = CATEGORY_ORDER[category] || DEFAULT_ORDER;
    const changes: string[] = [];
    const added: string[] = [];
    const result = [...sections];
    let nextOrder = sections.length;

    for (const type of recommended) {
      if (!existing.has(type)) {
        const meta = this.meta[type as keyof typeof SECTION_METADATA];
        if (!meta) continue;
        const isRequired = (meta.requiredFor as BusinessCategory[]).includes(category);
        const isRecommended = (meta.recommendedFor as BusinessCategory[]).includes(category);

        if (isRequired || isRecommended) {
          const newSection: StorefrontSection = {
            id: `s-auto-${type}-${nextOrder}`,
            type: type as StorefrontSection['type'],
            title: meta.label,
            content: meta.description,
            order: nextOrder,
            visible: true,
            config: { ...meta.defaultConfig },
          };
          result.push(newSection);
          existing.add(type);
          nextOrder++;
          added.push(type);
          changes.push(`Added missing ${isRequired ? 'required' : 'recommended'} section: "${type}"`);
        }
      }
    }

    return {
      sections: this.normalize(result, category).sections,
      changes,
      addedSections: added,
      removedSections: [],
      reordered: false,
    };
  }

  /** Validate section count against category requirements */
  validateSectionCount(sections: StorefrontSection[], category: BusinessCategory): { valid: boolean; min: number; max: number; current: number; message: string } {
    const count = sections.length;
    const recommended = CATEGORY_ORDER[category] || DEFAULT_ORDER;
    const recommendedCount = recommended.filter(type => {
      const meta = this.meta[type];
      return meta?.requiredFor.includes(category) || meta?.recommendedFor.includes(category);
    }).length;

    const min = 3;
    const max = 12;
    const valid = count >= min && count <= max;

    let message = valid
      ? `Section count ${count} is within range (${min}-${max})`
      : `Section count ${count} is out of range (${min}-${max})`;

    return { valid, min, max, current: count, message };
  }

  /** Get section recommendations for a category */
  getSectionRecommendations(category: BusinessCategory, existingSections: { type: string }[]): SectionRecommendation[] {
    const existing = new Set(existingSections.map(s => s.type));
    const recommendations: SectionRecommendation[] = [];

    for (const type of DEFAULT_ORDER) {
      if (existing.has(type)) continue;
      const meta = this.meta[type];
      if (!meta) continue;

      if (meta.requiredFor.includes(category)) {
        recommendations.push({ type, label: meta.label, priority: 'required', reason: `Required for ${category} templates` });
      } else if (meta.recommendedFor.includes(category)) {
        recommendations.push({ type, label: meta.label, priority: 'recommended', reason: `Recommended for ${category} templates` });
      } else {
        recommendations.push({ type, label: meta.label, priority: 'optional', reason: `Optional section: ${meta.description}` });
      }
    }

    return recommendations;
  }

  /** Generate default config for a section type */
  generateSectionConfig(type: string, _category?: BusinessCategory): Record<string, unknown> {
    return this.meta[type]?.defaultConfig ?? {};
  }
}

export const sectionNormalizer = new SectionNormalizer();
export type { SectionMeta, NormalizationResult, SectionRecommendation };
export { SECTION_METADATA, DEFAULT_ORDER, CATEGORY_ORDER };
