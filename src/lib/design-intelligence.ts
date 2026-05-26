/**
 * @module design-intelligence
 * @description Design Intelligence Layer for StoreCraft AI's Interactive Demo.
 *
 * Classifies a freeform business description into a niche category and returns
 * a complete, opinionated DesignProfile with typography, color psychology,
 * spacing, section hierarchy, CTA structure, mood, and layout style.
 *
 * All profiles are hand-crafted by a design system — no LLM calls required,
 * ensuring deterministic, sub-50ms responses.
 *
 * @example
 * ```ts
 * const result = classifyBusiness('Italian restaurant in Bangalore');
 * // result.niche === 'luxury_restaurant'
 * // result.confidence === 0.92
 * // result.profile.colors.primary === '#1A1A2E'
 * ```
 */

// =============================================================================
// Exported Types
// =============================================================================

/**
 * All supported business niche identifiers.
 * Each maps to a hand-crafted DesignProfile.
 */
export type BusinessNiche =
  | 'luxury_restaurant'
  | 'casual_restaurant'
  | 'bakery'
  | 'clothing_boutique'
  | 'electronics_tech'
  | 'salon_spa'
  | 'medical_clinic'
  | 'fitness_gym'
  | 'law_firm'
  | 'real_estate'
  | 'photography'
  | 'education';

/** Typography configuration for a design profile. */
export interface TypographyProfile {
  /** Font family for headings (loaded from Google Fonts). */
  headingFont: string;
  /** Font family for body text (loaded from Google Fonts). */
  bodyFont: string;
  /** Font sizes in pixels for the type scale. */
  sizes: {
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
  };
  /** Font weight for headings. */
  headingWeight: string;
  /** Font weight for body text. */
  bodyWeight: string;
  /** Default line height for body text. */
  lineHeight: string;
  /** CSS letter-spacing for headings. */
  headingLetterSpacing: string;
}

/** Color psychology configuration. Every value is a hex string. */
export interface ColorProfile {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  textMuted: string;
  border: string;
  /** Human-readable rationale for the color choices. */
  rationale: string;
}

/** Spacing & layout tokens. */
export interface SpacingProfile {
  /** Vertical padding for each major section (px). */
  sectionPadding: string;
  /** Gap between child elements inside a section (px). */
  elementGap: string;
  /** Internal padding for cards (px). */
  cardPadding: string;
  /** Max-width of the content container (px). */
  containerMaxWidth: string;
  /** Border radius for cards (px). */
  borderRadius: string;
}

/** A single section recommendation. */
export interface SectionRecommendation {
  /** Section type identifier. */
  type: 'hero' | 'about' | 'services' | 'products' | 'testimonials' | 'gallery' | 'pricing' | 'team' | 'faq' | 'cta' | 'hours' | 'contact' | 'features' | 'events';
  /** Display title for the section. */
  title: string;
}

/** CTA configuration. */
export interface CTAProfile {
  /** Text on the primary call-to-action button. */
  primaryText: string;
  /** Text on the secondary / ghost CTA button. */
  secondaryText: string;
  /** Where CTAs should be placed on the page. */
  placement: ('hero' | 'about' | 'services' | 'products' | 'pricing' | 'hours' | 'contact' | 'gallery' | 'testimonials' | 'features' | 'faq' | 'floating' | 'footer')[];
}

/** Layout style preference. */
export interface LayoutProfile {
  /** Whether the services/products section uses a grid or stacked layout. */
  cardLayout: 'grid' | 'stacked' | 'masonry' | 'carousel';
  /** Visual style for content cards. */
  cardStyle: 'flat' | 'elevated' | 'bordered' | 'glass' | 'minimal' | 'outlined';
  /** Overall page density preference. */
  density: 'spacious' | 'comfortable' | 'compact';
  /** Whether the navigation bar is sticky. */
  stickyNav: boolean;
  /** Whether the hero section is full viewport height. */
  fullHeightHero: boolean;
}

/**
 * Complete design profile for a business niche.
 * Every niche has a unique, hand-crafted profile that produces
 * visually distinct websites.
 */
export interface DesignProfile {
  /** The niche this profile belongs to. */
  niche: BusinessNiche;
  /** Human-readable niche label. */
  label: string;
  /** Typography configuration. */
  typography: TypographyProfile;
  /** Color psychology configuration. */
  colors: ColorProfile;
  /** Spacing and layout tokens. */
  spacing: SpacingProfile;
  /** Ordered list of recommended page sections. */
  sections: SectionRecommendation[];
  /** Call-to-action configuration. */
  cta: CTAProfile;
  /** Overall mood and tone description. */
  mood: string;
  /** Layout style preferences. */
  layout: LayoutProfile;
  /** CSS animation style preference. */
  animationStyle: 'elegant' | 'playful' | 'bold' | 'minimal' | 'dynamic';
}

/** Result of classifying a business description. */
export interface NicheClassification {
  /** The best-matching niche. */
  niche: BusinessNiche;
  /** Confidence score between 0 and 1. */
  confidence: number;
  /** The design profile for the matched niche. */
  profile: DesignProfile;
  /** Top 3 matches with their confidence scores. */
  topMatches: { niche: BusinessNiche; confidence: number }[];
}

/** Keyword → niche mapping used for classification. */
interface KeywordRule {
  keywords: string[];
  niche: BusinessNiche;
  weight: number;
}

// =============================================================================
// Keyword Classification Rules
// =============================================================================

const KEYWORD_RULES: KeywordRule[] = [
  // Luxury restaurant
  {
    keywords: ['fine dining', 'luxury', 'upscale', 'gourmet', 'fine cuisine', 'haute', 'elegant restaurant', 'fine wine', 'Michelin', 'steakhouse', 'brasserie', 'bistro upscale', 'five star', '5-star'],
    niche: 'luxury_restaurant',
    weight: 1.0,
  },
  // Casual restaurant
  {
    keywords: ['restaurant', 'diner', 'cafe', 'bistro', 'pizzeria', 'pizza', 'burger', 'tacos', 'grill', 'barbecue', 'bbq', 'food truck', 'sandwich', 'pub', 'tapas', 'brunch', 'lunch', 'dinner', 'eatery', 'canteen', 'deli'],
    niche: 'casual_restaurant',
    weight: 0.85,
  },
  // Bakery
  {
    keywords: ['bakery', 'pastry', 'cake', 'bread', 'croissant', 'patisserie', 'confectionery', 'cupcake', 'donut', 'dessert shop', 'pie shop', 'boulangerie'],
    niche: 'bakery',
    weight: 1.0,
  },
  // Clothing boutique
  {
    keywords: ['clothing', 'fashion', 'boutique', 'apparel', 'womenswear', 'menswear', 'designer', 'style', 'garment', 'tailor', 'sewing', 'fashion store', 'outfit', 'wardrobe', 'dress shop', 'saree', 'ethnic wear'],
    niche: 'clothing_boutique',
    weight: 0.9,
  },
  // Electronics / Tech
  {
    keywords: ['electronics', 'tech', 'computer', 'laptop', 'phone', 'gadget', 'software', 'IT', 'repair', 'apple', 'samsung', 'gaming', 'smart home', 'drone', 'robotics', 'cyber', 'startup', 'SaaS', 'app development', 'web development'],
    niche: 'electronics_tech',
    weight: 0.9,
  },
  // Salon / Spa
  {
    keywords: ['salon', 'spa', 'hair', 'beauty', 'nail', 'massage', 'wellness', 'skincare', 'facial', 'waxing', 'aesthetic', 'cosmetology', 'haircut', 'stylist', 'barber', 'makeup', 'derma', 'lash', 'brow'],
    niche: 'salon_spa',
    weight: 0.9,
  },
  // Medical clinic
  {
    keywords: ['medical', 'clinic', 'doctor', 'hospital', 'dental', 'dentist', 'physician', 'health', 'healthcare', 'pharmacy', 'optometry', 'optician', 'physio', 'therapy', 'veterinary', 'vet', 'surgeon', 'pediatric', 'orthopedic', 'cardiology', 'dermatology'],
    niche: 'medical_clinic',
    weight: 0.9,
  },
  // Fitness / Gym
  {
    keywords: ['gym', 'fitness', 'yoga', 'crossfit', 'personal training', 'workout', 'pilates', 'weightlifting', 'boxing', 'martial arts', 'sports', 'athletic', 'bootcamp', 'zumba', 'spin', 'gymnasium', 'health club', 'training'],
    niche: 'fitness_gym',
    weight: 0.9,
  },
  // Law firm
  {
    keywords: ['law', 'lawyer', 'attorney', 'legal', 'law firm', 'advocate', 'solicitor', 'barrister', 'litigation', 'counsel', 'justice', 'court', 'paralegal', 'notary', 'law office', 'chambers'],
    niche: 'law_firm',
    weight: 1.0,
  },
  // Real estate
  {
    keywords: ['real estate', 'property', 'realtor', 'housing', 'apartment', 'condo', 'rental', 'letting', 'broker', 'agent', 'home', 'villa', 'plot', 'land', 'commercial property', 'residential', 'realty'],
    niche: 'real_estate',
    weight: 0.9,
  },
  // Photography
  {
    keywords: ['photography', 'photo', 'photographer', 'studio', 'portrait', 'wedding photo', 'event photo', 'cinematography', 'videography', 'film', 'lens', 'camera', 'gallery', 'photo studio'],
    niche: 'photography',
    weight: 1.0,
  },
  // Education
  {
    keywords: ['school', 'academy', 'education', 'tutor', 'tuition', 'training', 'institute', 'college', 'university', 'learning', 'course', 'coaching', 'preschool', 'kindergarten', 'music school', 'dance school', 'art school', 'language', 'mentoring', 'edtech'],
    niche: 'education',
    weight: 0.85,
  },
];

// =============================================================================
// Design Profiles — Hand-Crafted, One Per Niche
// =============================================================================

const PROFILES: Record<BusinessNiche, DesignProfile> = {
  // ---------------------------------------------------------------------------
  // Luxury Restaurant
  // ---------------------------------------------------------------------------
  luxury_restaurant: {
    niche: 'luxury_restaurant',
    label: 'Luxury Restaurant',
    typography: {
      headingFont: "'Playfair Display', serif",
      bodyFont: "'Lato', sans-serif",
      sizes: { h1: '56px', h2: '40px', h3: '28px', body: '17px', small: '14px' },
      headingWeight: '700',
      bodyWeight: '300',
      lineHeight: '1.8',
      headingLetterSpacing: '2px',
    },
    colors: {
      primary: '#1A1A2E',
      secondary: '#16213E',
      accent: '#C9A96E',
      background: '#0F0F1A',
      surface: '#1A1A2E',
      text: '#F5F0E8',
      textLight: '#D4C9B8',
      textMuted: '#8B7D6B',
      border: '#2A2A3E',
      rationale: 'Deep navy and charcoal evoke sophistication and exclusivity. Gold accents suggest premium quality and elegance — classic fine-dining palette.',
    },
    spacing: {
      sectionPadding: '120px',
      elementGap: '40px',
      cardPadding: '48px',
      containerMaxWidth: '1200px',
      borderRadius: '0px',
    },
    sections: [
      { type: 'hero', title: 'Welcome' },
      { type: 'about', title: 'Our Story' },
      { type: 'features', title: 'The Experience' },
      { type: 'gallery', title: 'Our Cuisine' },
      { type: 'hours', title: 'Reservations & Hours' },
      { type: 'testimonials', title: 'Guest Reviews' },
      { type: 'contact', title: 'Find Us' },
    ],
    cta: {
      primaryText: 'Reserve a Table',
      secondaryText: 'View Our Menu',
      placement: ['hero', 'hours', 'floating', 'footer'],
    },
    mood: 'Sophisticated, intimate, and timeless. Exudes refined luxury with a sense of occasion — every visit feels like an event.',
    layout: {
      cardLayout: 'stacked',
      cardStyle: 'flat',
      density: 'spacious',
      stickyNav: true,
      fullHeightHero: true,
    },
    animationStyle: 'elegant',
  },

  // ---------------------------------------------------------------------------
  // Casual Restaurant
  // ---------------------------------------------------------------------------
  casual_restaurant: {
    niche: 'casual_restaurant',
    label: 'Casual Restaurant',
    typography: {
      headingFont: "'Poppins', sans-serif",
      bodyFont: "'Inter', sans-serif",
      sizes: { h1: '48px', h2: '32px', h3: '24px', body: '16px', small: '13px' },
      headingWeight: '700',
      bodyWeight: '400',
      lineHeight: '1.7',
      headingLetterSpacing: '0.5px',
    },
    colors: {
      primary: '#E63946',
      secondary: '#F4A261',
      accent: '#2A9D8F',
      background: '#FFFBF5',
      surface: '#FFFFFF',
      text: '#1D3557',
      textLight: '#457B9D',
      textMuted: '#8B8F97',
      border: '#E8E0D5',
      rationale: 'Warm reds and oranges stimulate appetite and create an inviting atmosphere. Teal adds freshness. Soft cream background keeps it friendly.',
    },
    spacing: {
      sectionPadding: '80px',
      elementGap: '32px',
      cardPadding: '28px',
      containerMaxWidth: '1100px',
      borderRadius: '16px',
    },
    sections: [
      { type: 'hero', title: 'Welcome' },
      { type: 'features', title: 'Why Choose Us' },
      { type: 'products', title: 'Our Menu' },
      { type: 'gallery', title: 'Food Gallery' },
      { type: 'testimonials', title: 'What People Say' },
      { type: 'hours', title: 'Visit Us' },
      { type: 'contact', title: 'Get in Touch' },
    ],
    cta: {
      primaryText: 'Order Now',
      secondaryText: 'See Full Menu',
      placement: ['hero', 'products', 'footer'],
    },
    mood: 'Warm, vibrant, and approachable. Feels like your favorite neighborhood spot — casual but with care and personality.',
    layout: {
      cardLayout: 'grid',
      cardStyle: 'elevated',
      density: 'comfortable',
      stickyNav: true,
      fullHeightHero: true,
    },
    animationStyle: 'playful',
  },

  // ---------------------------------------------------------------------------
  // Bakery
  // ---------------------------------------------------------------------------
  bakery: {
    niche: 'bakery',
    label: 'Bakery & Patisserie',
    typography: {
      headingFont: "'Playfair Display', serif",
      bodyFont: "'Nunito', sans-serif",
      sizes: { h1: '52px', h2: '36px', h3: '26px', body: '16px', small: '14px' },
      headingWeight: '600',
      bodyWeight: '400',
      lineHeight: '1.75',
      headingLetterSpacing: '1px',
    },
    colors: {
      primary: '#5C3D2E',
      secondary: '#8B5E3C',
      accent: '#D4A574',
      background: '#FFF9F2',
      surface: '#FFF3E6',
      text: '#2C1810',
      textLight: '#6B4226',
      textMuted: '#9C7C5C',
      border: '#E8D5C0',
      rationale: 'Rich browns and warm creams evoke freshly baked goods, artisan craftsmanship, and the comforting aroma of a traditional bakery.',
    },
    spacing: {
      sectionPadding: '80px',
      elementGap: '28px',
      cardPadding: '24px',
      containerMaxWidth: '1080px',
      borderRadius: '12px',
    },
    sections: [
      { type: 'hero', title: 'Freshly Baked Daily' },
      { type: 'about', title: 'Our Craft' },
      { type: 'products', title: 'Our Bakes' },
      { type: 'gallery', title: 'Bakery Gallery' },
      { type: 'testimonials', title: 'Customer Love' },
      { type: 'hours', title: 'Visit Our Bakery' },
      { type: 'contact', title: 'Contact' },
    ],
    cta: {
      primaryText: 'Order Now',
      secondaryText: 'View Our Menu',
      placement: ['hero', 'products', 'footer'],
    },
    mood: 'Cozy, artisanal, and sweet. Feels like stepping into a warm bakery with the scent of fresh bread and pastries in the air.',
    layout: {
      cardLayout: 'grid',
      cardStyle: 'outlined',
      density: 'comfortable',
      stickyNav: true,
      fullHeightHero: false,
    },
    animationStyle: 'playful',
  },

  // ---------------------------------------------------------------------------
  // Clothing Boutique
  // ---------------------------------------------------------------------------
  clothing_boutique: {
    niche: 'clothing_boutique',
    label: 'Clothing Boutique',
    typography: {
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "'Montserrat', sans-serif",
      sizes: { h1: '54px', h2: '34px', h3: '22px', body: '15px', small: '12px' },
      headingWeight: '300',
      bodyWeight: '300',
      lineHeight: '1.8',
      headingLetterSpacing: '4px',
    },
    colors: {
      primary: '#0D0D0D',
      secondary: '#1A1A1A',
      accent: '#C9A96E',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#0D0D0D',
      textLight: '#4A4A4A',
      textMuted: '#999999',
      border: '#E5E5E5',
      rationale: 'Black and white creates high contrast and a fashion-forward aesthetic. Thin gold accents add luxury. Massive whitespace lets products breathe.',
    },
    spacing: {
      sectionPadding: '100px',
      elementGap: '48px',
      cardPadding: '20px',
      containerMaxWidth: '1300px',
      borderRadius: '0px',
    },
    sections: [
      { type: 'hero', title: 'New Collection' },
      { type: 'gallery', title: 'Lookbook' },
      { type: 'products', title: 'Shop the Collection' },
      { type: 'about', title: 'Our Philosophy' },
      { type: 'testimonials', title: 'Style Stories' },
      { type: 'contact', title: 'Visit Us' },
    ],
    cta: {
      primaryText: 'Shop Now',
      secondaryText: 'Explore Collection',
      placement: ['hero', 'products', 'footer'],
    },
    mood: 'Minimalist, editorial, and confident. Like flipping through a fashion magazine — every detail is intentional and effortless.',
    layout: {
      cardLayout: 'masonry',
      cardStyle: 'minimal',
      density: 'spacious',
      stickyNav: true,
      fullHeightHero: true,
    },
    animationStyle: 'minimal',
  },

  // ---------------------------------------------------------------------------
  // Electronics / Tech
  // ---------------------------------------------------------------------------
  electronics_tech: {
    niche: 'electronics_tech',
    label: 'Electronics & Technology',
    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'IBM Plex Mono', monospace",
      sizes: { h1: '44px', h2: '30px', h3: '22px', body: '15px', small: '12px' },
      headingWeight: '700',
      bodyWeight: '400',
      lineHeight: '1.7',
      headingLetterSpacing: '-0.5px',
    },
    colors: {
      primary: '#00F0FF',
      secondary: '#7B2FFF',
      accent: '#FF2EAA',
      background: '#0A0A0F',
      surface: '#12121A',
      text: '#E8E8ED',
      textLight: '#A0A0B0',
      textMuted: '#5A5A6E',
      border: '#1E1E2E',
      rationale: 'Dark backgrounds with neon cyan and purple create a futuristic, tech-forward aesthetic. Monospace elements reinforce the digital identity.',
    },
    spacing: {
      sectionPadding: '80px',
      elementGap: '24px',
      cardPadding: '32px',
      containerMaxWidth: '1100px',
      borderRadius: '8px',
    },
    sections: [
      { type: 'hero', title: 'The Future is Here' },
      { type: 'features', title: 'Why Us' },
      { type: 'products', title: 'Our Products' },
      { type: 'pricing', title: 'Plans & Pricing' },
      { type: 'testimonials', title: 'Customer Reviews' },
      { type: 'faq', title: 'FAQ' },
      { type: 'contact', title: 'Get in Touch' },
    ],
    cta: {
      primaryText: 'Get Started',
      secondaryText: 'Learn More',
      placement: ['hero', 'features', 'pricing', 'footer'],
    },
    mood: 'Futuristic, precise, and cutting-edge. Feels like stepping into a high-tech showroom where innovation meets sleek design.',
    layout: {
      cardLayout: 'grid',
      cardStyle: 'glass',
      density: 'comfortable',
      stickyNav: true,
      fullHeightHero: true,
    },
    animationStyle: 'dynamic',
  },

  // ---------------------------------------------------------------------------
  // Salon / Spa
  // ---------------------------------------------------------------------------
  salon_spa: {
    niche: 'salon_spa',
    label: 'Salon & Spa',
    typography: {
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "'Quicksand', sans-serif",
      sizes: { h1: '50px', h2: '34px', h3: '24px', body: '16px', small: '13px' },
      headingWeight: '400',
      bodyWeight: '400',
      lineHeight: '1.8',
      headingLetterSpacing: '2px',
    },
    colors: {
      primary: '#D4A5A5',
      secondary: '#B5838D',
      accent: '#E8B4B8',
      background: '#FFF5F5',
      surface: '#FFFFFF',
      text: '#3D2C2C',
      textLight: '#6B4C4C',
      textMuted: '#A08181',
      border: '#F0D5D5',
      rationale: 'Soft pinks and rose tones convey femininity, self-care, and tranquility. Gentle contrasts create a calming, luxurious spa environment.',
    },
    spacing: {
      sectionPadding: '90px',
      elementGap: '36px',
      cardPadding: '36px',
      containerMaxWidth: '1080px',
      borderRadius: '20px',
    },
    sections: [
      { type: 'hero', title: 'Welcome' },
      { type: 'about', title: 'About Our Studio' },
      { type: 'services', title: 'Our Services' },
      { type: 'pricing', title: 'Pricing' },
      { type: 'gallery', title: 'Our Work' },
      { type: 'testimonials', title: 'Client Love' },
      { type: 'contact', title: 'Book Now' },
    ],
    cta: {
      primaryText: 'Book Appointment',
      secondaryText: 'View Services',
      placement: ['hero', 'services', 'pricing', 'footer'],
    },
    mood: 'Serene, luxurious, and nurturing. A retreat from the everyday — soft textures, gentle lighting, and feminine elegance throughout.',
    layout: {
      cardLayout: 'stacked',
      cardStyle: 'elevated',
      density: 'spacious',
      stickyNav: true,
      fullHeightHero: true,
    },
    animationStyle: 'elegant',
  },

  // ---------------------------------------------------------------------------
  // Medical Clinic
  // ---------------------------------------------------------------------------
  medical_clinic: {
    niche: 'medical_clinic',
    label: 'Medical Clinic',
    typography: {
      headingFont: "'Source Sans 3', sans-serif",
      bodyFont: "'Open Sans', sans-serif",
      sizes: { h1: '42px', h2: '30px', h3: '22px', body: '16px', small: '14px' },
      headingWeight: '600',
      bodyWeight: '400',
      lineHeight: '1.7',
      headingLetterSpacing: '0.5px',
    },
    colors: {
      primary: '#1565C0',
      secondary: '#1976D2',
      accent: '#00ACC1',
      background: '#F8FAFE',
      surface: '#FFFFFF',
      text: '#1A2332',
      textLight: '#3A4A5C',
      textMuted: '#7A8A9C',
      border: '#DCE8F4',
      rationale: 'Trustworthy blues convey professionalism, cleanliness, and reliability — essential for healthcare. Clean white surfaces reinforce sterility and care.',
    },
    spacing: {
      sectionPadding: '80px',
      elementGap: '28px',
      cardPadding: '28px',
      containerMaxWidth: '1080px',
      borderRadius: '12px',
    },
    sections: [
      { type: 'hero', title: 'Your Health, Our Priority' },
      { type: 'about', title: 'About Our Practice' },
      { type: 'services', title: 'Our Services' },
      { type: 'team', title: 'Our Doctors' },
      { type: 'testimonials', title: 'Patient Stories' },
      { type: 'faq', title: 'Common Questions' },
      { type: 'hours', title: 'Hours & Location' },
      { type: 'contact', title: 'Contact Us' },
    ],
    cta: {
      primaryText: 'Book Appointment',
      secondaryText: 'Call Now',
      placement: ['hero', 'services', 'hours', 'footer'],
    },
    mood: 'Professional, clean, and trustworthy. Conveys expertise and compassion — patients feel safe and well-cared for.',
    layout: {
      cardLayout: 'grid',
      cardStyle: 'bordered',
      density: 'comfortable',
      stickyNav: true,
      fullHeightHero: false,
    },
    animationStyle: 'minimal',
  },

  // ---------------------------------------------------------------------------
  // Fitness / Gym
  // ---------------------------------------------------------------------------
  fitness_gym: {
    niche: 'fitness_gym',
    label: 'Fitness & Gym',
    typography: {
      headingFont: "'Oswald', sans-serif",
      bodyFont: "'Roboto', sans-serif",
      sizes: { h1: '56px', h2: '38px', h3: '26px', body: '16px', small: '13px' },
      headingWeight: '700',
      bodyWeight: '400',
      lineHeight: '1.6',
      headingLetterSpacing: '2px',
    },
    colors: {
      primary: '#FF4500',
      secondary: '#1A1A1A',
      accent: '#FFD700',
      background: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textLight: '#CCCCCC',
      textMuted: '#888888',
      border: '#333333',
      rationale: 'High-energy red-orange demands attention and fuels motivation. Dark backgrounds create intensity. Gold accents celebrate achievement.',
    },
    spacing: {
      sectionPadding: '80px',
      elementGap: '32px',
      cardPadding: '28px',
      containerMaxWidth: '1200px',
      borderRadius: '4px',
    },
    sections: [
      { type: 'hero', title: 'Unleash Your Potential' },
      { type: 'features', title: 'Why Train With Us' },
      { type: 'services', title: 'Programs & Classes' },
      { type: 'pricing', title: 'Membership Plans' },
      { type: 'testimonials', title: 'Member Results' },
      { type: 'team', title: 'Our Trainers' },
      { type: 'hours', title: 'Gym Hours' },
      { type: 'contact', title: 'Join Now' },
    ],
    cta: {
      primaryText: 'Start Free Trial',
      secondaryText: 'See Plans',
      placement: ['hero', 'pricing', 'floating', 'footer'],
    },
    mood: 'Energetic, powerful, and motivating. Feels like walking into a dedicated training space where results happen.',
    layout: {
      cardLayout: 'grid',
      cardStyle: 'flat',
      density: 'compact',
      stickyNav: true,
      fullHeightHero: true,
    },
    animationStyle: 'bold',
  },

  // ---------------------------------------------------------------------------
  // Law Firm
  // ---------------------------------------------------------------------------
  law_firm: {
    niche: 'law_firm',
    label: 'Law Firm',
    typography: {
      headingFont: "'Merriweather', serif",
      bodyFont: "'Source Sans 3', sans-serif",
      sizes: { h1: '44px', h2: '32px', h3: '24px', body: '17px', small: '14px' },
      headingWeight: '700',
      bodyWeight: '400',
      lineHeight: '1.8',
      headingLetterSpacing: '1px',
    },
    colors: {
      primary: '#1B2A4A',
      secondary: '#2C3E6B',
      accent: '#C9A96E',
      background: '#FAFAF8',
      surface: '#FFFFFF',
      text: '#1B2A4A',
      textLight: '#3D5278',
      textMuted: '#7A8BA8',
      border: '#D4DCE8',
      rationale: 'Navy and dark blue project authority, trust, and tradition — the foundation of legal branding. Gold accents signify prestige and excellence.',
    },
    spacing: {
      sectionPadding: '90px',
      elementGap: '32px',
      cardPadding: '32px',
      containerMaxWidth: '1080px',
      borderRadius: '2px',
    },
    sections: [
      { type: 'hero', title: 'Trusted Legal Counsel' },
      { type: 'about', title: 'About the Firm' },
      { type: 'services', title: 'Practice Areas' },
      { type: 'team', title: 'Our Attorneys' },
      { type: 'testimonials', title: 'Client Testimonials' },
      { type: 'faq', title: 'Frequently Asked' },
      { type: 'contact', title: 'Contact Us' },
    ],
    cta: {
      primaryText: 'Schedule Consultation',
      secondaryText: 'Learn More',
      placement: ['hero', 'services', 'footer'],
    },
    mood: 'Authoritative, traditional, and reassuring. Conveys decades of expertise and unwavering commitment to clients.',
    layout: {
      cardLayout: 'stacked',
      cardStyle: 'bordered',
      density: 'spacious',
      stickyNav: true,
      fullHeightHero: false,
    },
    animationStyle: 'elegant',
  },

  // ---------------------------------------------------------------------------
  // Real Estate
  // ---------------------------------------------------------------------------
  real_estate: {
    niche: 'real_estate',
    label: 'Real Estate',
    typography: {
      headingFont: "'DM Serif Display', serif",
      bodyFont: "'DM Sans', sans-serif",
      sizes: { h1: '48px', h2: '34px', h3: '24px', body: '16px', small: '14px' },
      headingWeight: '400',
      bodyWeight: '400',
      lineHeight: '1.75',
      headingLetterSpacing: '0.5px',
    },
    colors: {
      primary: '#2C5530',
      secondary: '#3A7D44',
      accent: '#C9A96E',
      background: '#FAFAF7',
      surface: '#FFFFFF',
      text: '#1A2E1C',
      textLight: '#3D5A40',
      textMuted: '#8A9E8C',
      border: '#D5DFD6',
      rationale: 'Deep greens symbolize growth, stability, and prosperity — ideal for property. Warm neutral backgrounds create an inviting, aspirational feel.',
    },
    spacing: {
      sectionPadding: '90px',
      elementGap: '32px',
      cardPadding: '24px',
      containerMaxWidth: '1200px',
      borderRadius: '8px',
    },
    sections: [
      { type: 'hero', title: 'Find Your Dream Home' },
      { type: 'about', title: 'About Us' },
      { type: 'products', title: 'Featured Listings' },
      { type: 'services', title: 'Our Services' },
      { type: 'testimonials', title: 'Client Stories' },
      { type: 'team', title: 'Our Agents' },
      { type: 'contact', title: 'Get in Touch' },
    ],
    cta: {
      primaryText: 'View Listings',
      secondaryText: 'Contact an Agent',
      placement: ['hero', 'products', 'footer'],
    },
    mood: 'Professional, aspirational, and welcoming. Makes visitors feel confident about their biggest investment decision.',
    layout: {
      cardLayout: 'grid',
      cardStyle: 'elevated',
      density: 'spacious',
      stickyNav: true,
      fullHeightHero: true,
    },
    animationStyle: 'elegant',
  },

  // ---------------------------------------------------------------------------
  // Photography
  // ---------------------------------------------------------------------------
  photography: {
    niche: 'photography',
    label: 'Photography Studio',
    typography: {
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "'Raleway', sans-serif",
      sizes: { h1: '52px', h2: '36px', h3: '24px', body: '16px', small: '13px' },
      headingWeight: '300',
      bodyWeight: '300',
      lineHeight: '1.8',
      headingLetterSpacing: '3px',
    },
    colors: {
      primary: '#1A1A1A',
      secondary: '#2A2A2A',
      accent: '#E8D5B7',
      background: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#F0EDE8',
      textLight: '#B8B0A4',
      textMuted: '#706860',
      border: '#2E2E2E',
      rationale: 'Dark backgrounds make images the hero. Muted warm tones add elegance without competing. Ultra-minimal chrome lets photography speak.',
    },
    spacing: {
      sectionPadding: '60px',
      elementGap: '20px',
      cardPadding: '0px',
      containerMaxWidth: '1400px',
      borderRadius: '0px',
    },
    sections: [
      { type: 'hero', title: 'Visual Storytelling' },
      { type: 'gallery', title: 'Portfolio' },
      { type: 'about', title: 'The Artist' },
      { type: 'services', title: 'Services' },
      { type: 'testimonials', title: 'Client Words' },
      { type: 'contact', title: 'Let\'s Create' },
    ],
    cta: {
      primaryText: 'Book a Session',
      secondaryText: 'View Portfolio',
      placement: ['hero', 'gallery', 'footer'],
    },
    mood: 'Artistic, moody, and immersive. Every element exists to showcase visuals — the design is invisible, the work is everything.',
    layout: {
      cardLayout: 'masonry',
      cardStyle: 'minimal',
      density: 'compact',
      stickyNav: false,
      fullHeightHero: true,
    },
    animationStyle: 'minimal',
  },

  // ---------------------------------------------------------------------------
  // Education
  // ---------------------------------------------------------------------------
  education: {
    niche: 'education',
    label: 'Education & Learning',
    typography: {
      headingFont: "'Nunito', sans-serif",
      bodyFont: "'Inter', sans-serif",
      sizes: { h1: '44px', h2: '32px', h3: '24px', body: '16px', small: '14px' },
      headingWeight: '700',
      bodyWeight: '400',
      lineHeight: '1.7',
      headingLetterSpacing: '0.5px',
    },
    colors: {
      primary: '#4361EE',
      secondary: '#3A0CA3',
      accent: '#F72585',
      background: '#F8F9FF',
      surface: '#FFFFFF',
      text: '#1A1A2E',
      textLight: '#4A4A6A',
      textMuted: '#8888A8',
      border: '#E0E0F0',
      rationale: 'Vibrant blues spark curiosity and trust — ideal for learning environments. The pink accent adds energy and engagement.',
    },
    spacing: {
      sectionPadding: '80px',
      elementGap: '28px',
      cardPadding: '28px',
      containerMaxWidth: '1100px',
      borderRadius: '16px',
    },
    sections: [
      { type: 'hero', title: 'Learn & Grow' },
      { type: 'features', title: 'Why Choose Us' },
      { type: 'services', title: 'Our Courses' },
      { type: 'team', title: 'Our Instructors' },
      { type: 'testimonials', title: 'Student Success' },
      { type: 'faq', title: 'Common Questions' },
      { type: 'contact', title: 'Enroll Now' },
    ],
    cta: {
      primaryText: 'Enroll Today',
      secondaryText: 'Explore Courses',
      placement: ['hero', 'services', 'faq', 'footer'],
    },
    mood: 'Friendly, encouraging, and vibrant. Makes learning feel accessible and exciting — students feel welcomed and supported.',
    layout: {
      cardLayout: 'grid',
      cardStyle: 'elevated',
      density: 'comfortable',
      stickyNav: true,
      fullHeightHero: false,
    },
    animationStyle: 'playful',
  },
};

// =============================================================================
// Classification Engine
// =============================================================================

/**
 * Classify a freeform business description into a niche category.
 *
 * Uses weighted keyword matching with fallback heuristics. Returns the best
 * matching niche along with confidence scores and the full DesignProfile.
 *
 * @param text - Freeform business description (e.g., "Italian restaurant in Bangalore")
 * @returns Classification result with niche, confidence, profile, and top matches.
 *
 * @example
 * ```ts
 * const result = classifyBusiness('A cozy bakery in Paris');
 * console.log(result.niche); // 'bakery'
 * console.log(result.confidence); // 0.95
 * ```
 */
export function classifyBusiness(text: string): NicheClassification {
  const normalizedText = text.toLowerCase().trim();

  if (!normalizedText) {
    return {
      niche: 'casual_restaurant',
      confidence: 0.3,
      profile: PROFILES.casual_restaurant,
      topMatches: [{ niche: 'casual_restaurant', confidence: 0.3 }],
    };
  }

  // Score each niche
  const scores = new Map<BusinessNiche, number>();

  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        const current = scores.get(rule.niche) ?? 0;
        scores.set(rule.niche, current + rule.weight);
      }
    }
  }

  // Normalize scores to 0-1 range
  let maxScore = 0;
  for (const score of scores.values()) {
    if (score > maxScore) maxScore = score;
  }

  // Build sorted matches
  const matches: { niche: BusinessNiche; confidence: number }[] = [];

  for (const [niche, rawScore] of scores) {
    const confidence = maxScore > 0 ? Math.min(1, rawScore / maxScore) : 0;
    matches.push({ niche, confidence });
  }

  matches.sort((a, b) => b.confidence - a.confidence);

  // If no keywords matched, use heuristic fallback
  if (matches.length === 0) {
    const fallback = guessNicheFromContext(normalizedText);
    return {
      niche: fallback,
      confidence: 0.4,
      profile: PROFILES[fallback],
      topMatches: [{ niche: fallback, confidence: 0.4 }],
    };
  }

  // Boost top match confidence if it's clearly dominant
  const topMatch = matches[0];
  if (matches.length > 1 && topMatch.confidence > matches[1].confidence + 0.2) {
    topMatch.confidence = Math.min(1, topMatch.confidence * 1.1);
  }

  return {
    niche: topMatch.niche,
    confidence: Math.round(topMatch.confidence * 100) / 100,
    profile: PROFILES[topMatch.niche],
    topMatches: matches.slice(0, 3),
  };
}

/**
 * Fallback heuristic when no keywords match.
 * Looks for context clues in the description to make a best guess.
 */
function guessNicheFromContext(text: string): BusinessNiche {
  // Check for food-related words
  const foodWords = ['food', 'eat', 'cook', 'chef', 'kitchen', 'menu', 'dish', 'meal', 'recipe', 'cuisine', 'taste', 'delicious', 'catering'];
  const medWords = ['patient', 'treatment', 'diagnosis', 'medical', 'health', 'surgery', 'prescription'];
  const styleWords = ['dress', 'outfit', 'wear', 'collection', 'trend', 'fabric'];
  const techWords = ['digital', 'code', 'software', 'hardware', 'data', 'cloud', 'device'];
  const fitnessWords = ['exercise', 'workout', 'muscle', 'body', 'training', 'cardio'];
  const lawWords = ['case', 'court', 'legal', 'contract', 'claim', 'sue', 'litigation'];
  const propertyWords = ['house', 'flat', 'plot', 'rent', 'sell', 'buy', 'mortgage', 'interior'];
  const learnWords = ['teach', 'learn', 'student', 'class', 'lesson', 'curriculum', 'study'];
  const photoWords = ['photo', 'shoot', 'camera', 'portrait', 'wedding', 'event'];
  const beautyWords = ['treatment', 'relax', 'massage', 'facial', 'hair', 'nail', 'skin'];
  const bakeWords = ['bread', 'cake', 'bake', 'pastry', 'cookie', 'muffin', 'icing'];

  const countMatches = (words: string[]) => words.filter(w => text.includes(w)).length;

  const counts: [BusinessNiche, number][] = [
    ['casual_restaurant', countMatches(foodWords)],
    ['medical_clinic', countMatches(medWords)],
    ['clothing_boutique', countMatches(styleWords)],
    ['electronics_tech', countMatches(techWords)],
    ['fitness_gym', countMatches(fitnessWords)],
    ['law_firm', countMatches(lawWords)],
    ['real_estate', countMatches(propertyWords)],
    ['education', countMatches(learnWords)],
    ['photography', countMatches(photoWords)],
    ['salon_spa', countMatches(beautyWords)],
    ['bakery', countMatches(bakeWords)],
    ['luxury_restaurant', countMatches([...foodWords, 'luxury', 'fine', 'elegant', 'premium'])],
  ];

  counts.sort((a, b) => b[1] - a[1]);

  return counts[0][1] > 0 ? counts[0][0] : 'casual_restaurant';
}

/**
 * Get a DesignProfile directly by niche identifier.
 * Useful for testing or when the niche is already known.
 *
 * @param niche - The business niche identifier.
 * @returns The complete DesignProfile, or undefined if the niche is not found.
 */
export function getProfile(niche: BusinessNiche): DesignProfile {
  return PROFILES[niche];
}

/**
 * Get all available niche identifiers and their labels.
 * Useful for building UI selectors or documentation.
 *
 * @returns Array of { niche, label } objects for all supported niches.
 */
export function getAllNiches(): { niche: BusinessNiche; label: string }[] {
  return Object.values(PROFILES).map(p => ({ niche: p.niche, label: p.label }));
}
