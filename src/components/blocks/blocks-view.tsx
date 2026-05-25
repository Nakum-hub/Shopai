'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { DesignBlock, BusinessCategory } from '@/lib/types';
import {
  allDesignBlocks,
  getBlocksByType,
  getRecommendedBlocks,
  getDefaultComposition,
  TOTAL_BLOCK_COUNT,
  getBlockTypeCounts,
  searchBlocks,
} from '@/data/design-blocks';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Wand2,
  Layers,
  ArrowRight,
  X,
  Shuffle,
} from 'lucide-react';

// =============================================================================
// Constants
// =============================================================================

type BlockType = DesignBlock['type'];

const BLOCK_TYPE_FILTERS: { label: string; value: BlockType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Hero', value: 'hero' },
  { label: 'About', value: 'about' },
  { label: 'Services', value: 'services' },
  { label: 'Testimonials', value: 'testimonials' },
  { label: 'Products', value: 'products' },
  { label: 'Pricing', value: 'pricing' },
  { label: 'Footer', value: 'footer' },
  { label: 'CTA', value: 'cta' },
  { label: 'Features', value: 'features' },
  { label: 'Contact', value: 'contact' },
  { label: 'FAQ', value: 'faq' },
  { label: 'Gallery', value: 'gallery' },
  { label: 'Team', value: 'team' },
];

const CATEGORY_OPTIONS: { label: string; value: BusinessCategory }[] = [
  { label: 'Bakery', value: 'bakery' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Salon', value: 'salon' },
  { label: 'Grocery', value: 'grocery' },
  { label: 'Hardware', value: 'hardware' },
  { label: 'Medical', value: 'medical' },
  { label: 'Boutique', value: 'boutique' },
  { label: 'Service', value: 'service' },
  { label: 'Other', value: 'other' },
];

const STYLE_COLORS: Record<string, string> = {
  modern: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  classic: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  minimal: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  bold: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  elegant: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
};

// =============================================================================
// Animation Variants
// =============================================================================

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

const compositionItemVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// =============================================================================
// Helpers
// =============================================================================

/** Compute approximate factorial for combination display */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= Math.min(n, 20); i++) result *= i;
  return result;
}

function formatCombinations(count: number): string {
  if (count > 1e15) return `${(count / 1e15).toFixed(1)} quadrillion`;
  if (count > 1e12) return `${(count / 1e12).toFixed(1)} trillion`;
  if (count > 1e9) return `${(count / 1e9).toFixed(1)} billion`;
  if (count > 1e6) return `${(count / 1e6).toFixed(1)} million`;
  return count.toLocaleString();
}

// =============================================================================
// Block Library Card
// =============================================================================

function BlockCard({
  block,
  isSelected,
  isRecommended,
  onAdd,
}: {
  block: DesignBlock;
  isSelected: boolean;
  isRecommended: boolean;
  onAdd: () => void;
}) {
  return (
    <motion.div
      variants={cardItemVariants}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden border transition-all duration-200 h-full flex flex-col',
          isSelected
            ? 'border-violet-500/50 ring-1 ring-violet-500/25 shadow-md shadow-violet-500/10'
            : 'border-border/50 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5'
        )}
      >
        {/* Preview Gradient */}
        <div
          className="relative h-28 w-full shrink-0"
          style={{ background: block.preview }}
        >
          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge
              variant="secondary"
              className="bg-black/40 text-white border-0 backdrop-blur-sm text-[10px] capitalize font-medium"
            >
              {block.type}
            </Badge>
            {block.popular && (
              <Badge className="bg-amber-500/90 text-white border-0 text-[10px]">
                Popular
              </Badge>
            )}
          </div>
          {isRecommended && (
            <Badge className="absolute top-2 right-2 bg-cyan-500/90 text-white border-0 text-[10px]">
              <Sparkles className="size-2.5 mr-0.5" />
              Recommended
            </Badge>
          )}

          {/* Added overlay */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-violet-600/20 flex items-center justify-center"
            >
              <div className="size-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
                <Check className="size-4 text-white" strokeWidth={3} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3 flex-1 flex flex-col gap-1.5 min-h-0">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-sm font-semibold leading-tight truncate">
              {block.name}
            </h3>
            <span
              className={cn(
                'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0 text-[10px] font-medium capitalize',
                STYLE_COLORS[block.style] ?? ''
              )}
            >
              {block.style}
            </span>
          </div>

          <p className="text-muted-foreground text-[11px] leading-snug line-clamp-2 flex-1">
            {block.description}
          </p>

          <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-border/50">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {block.variant}
            </span>
            <Button
              size="sm"
              variant={isSelected ? 'secondary' : 'default'}
              className={cn(
                'h-6 px-2 text-[11px] gap-1 transition-all duration-200',
                isSelected
                  ? 'bg-violet-600/15 text-violet-400 hover:bg-violet-600/25 border-0'
                  : 'bg-violet-600 hover:bg-violet-700 text-white border-0'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              {isSelected ? (
                <>
                  <Check className="size-3" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="size-3" />
                  Add
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// Composition List Item
// =============================================================================

function CompositionItem({
  block,
  index,
  total,
  onRemove,
  onMove,
}: {
  block: DesignBlock;
  index: number;
  total: number;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  return (
    <motion.div
      variants={compositionItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className="group flex items-center gap-2.5 p-2 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors"
    >
      {/* Position number */}
      <span className="size-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
        {index + 1}
      </span>

      {/* Gradient swatch */}
      <div
        className="size-9 shrink-0 rounded-md border border-border/30"
        style={{ background: block.preview }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{block.name}</p>
        <p className="text-[10px] text-muted-foreground capitalize">{block.type}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-muted-foreground hover:text-foreground"
          disabled={index === 0}
          onClick={() => onMove('up')}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-muted-foreground hover:text-foreground"
          disabled={index === total - 1}
          onClick={() => onMove('down')}
        >
          <ChevronDown className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// BlocksView — Main Component
// =============================================================================

export function BlocksView() {
  // ── Store ──
  const {
    selectedBlocks: storeBlocks,
    setSelectedBlocks: storeSetBlocks,
    addBlock: storeAddBlock,
    removeBlock: storeRemoveBlock,
    clearBlocks: storeClearBlocks,
    setCurrentView,
    businessProfile,
  } = useAppStore();

  // ── Local State ──
  const [selectedBlocks, setSelectedBlocks] = useState<DesignBlock[]>(
    storeBlocks
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<BlockType | 'all'>('all');
  const [autoComposeCategory, setAutoComposeCategory] =
    useState<BusinessCategory>('service');

  // ── Sync store → local (when navigating back) ──
  // Keep local state as source of truth; only read from store on mount.

  // ── Derived: selected block IDs for fast lookup ──
  const selectedBlockIds = useMemo(
    () => new Set(selectedBlocks.map((b) => b.id)),
    [selectedBlocks]
  );

  // ── Determine recommended category ──
  const recommendedCategory: BusinessCategory =
    businessProfile?.category ?? autoComposeCategory;

  // ── Filtered blocks for library ──
  const filteredBlocks = useMemo(() => {
    let blocks: DesignBlock[];

    if (searchQuery.trim()) {
      blocks = searchBlocks(searchQuery);
    } else if (activeType !== 'all') {
      blocks = getBlocksByType(activeType);
    } else {
      blocks = allDesignBlocks;
    }

    // Sort: popular first, then alphabetically
    blocks = [...blocks].sort((a, b) => {
      const popDiff = (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      if (popDiff !== 0) return popDiff;
      return a.name.localeCompare(b.name);
    });

    return blocks;
  }, [searchQuery, activeType]);

  // ── Recommended blocks for current category ──
  const recommendedIds = useMemo(() => {
    const recs = getRecommendedBlocks(recommendedCategory);
    return new Set(recs.map((b) => b.id));
  }, [recommendedCategory]);

  // ── Combinations math ──
  const combinations = useMemo(() => {
    const n = selectedBlocks.length;
    if (n === 0) return 0;
    // Each position can be one of TOTAL_BLOCK_COUNT blocks, order matters
    return Math.pow(TOTAL_BLOCK_COUNT, n);
  }, [selectedBlocks.length]);

  // ── Handlers ──

  const handleAddBlock = useCallback(
    (block: DesignBlock) => {
      if (selectedBlockIds.has(block.id)) return; // prevent duplicates
      setSelectedBlocks((prev) => [...prev, block]);
    },
    [selectedBlockIds]
  );

  const handleRemoveBlock = useCallback((blockId: string) => {
    setSelectedBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const handleMoveBlock = useCallback(
    (index: number, direction: 'up' | 'down') => {
      setSelectedBlocks((prev) => {
        const next = [...prev];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return prev;
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return next;
      });
    },
    []
  );

  const handleClearBlocks = useCallback(() => {
    setSelectedBlocks([]);
  }, []);

  const handleAutoCompose = useCallback(() => {
    const ids = getDefaultComposition(autoComposeCategory);
    const blocks = ids
      .map((id) => allDesignBlocks.find((b) => b.id === id))
      .filter((b): b is DesignBlock => b !== undefined);
    setSelectedBlocks(blocks);
  }, [autoComposeCategory]);

  const handleShuffle = useCallback(() => {
    if (selectedBlocks.length < 2) return;
    setSelectedBlocks((prev) => {
      const shuffled = [...prev];
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, [selectedBlocks.length]);

  const handleGenerate = useCallback(() => {
    storeSetBlocks(selectedBlocks);
    setCurrentView('builder');
  }, [
    selectedBlocks,
    storeSetBlocks,
    setCurrentView,
  ]);

  const blockTypeCounts = useMemo(() => getBlockTypeCounts(), []);

  // ── Render ──

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Layers className="size-4 text-white" />
            </div>
            Design Blocks
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mix and match blocks to create a unique website
          </p>
        </div>
        <Badge
          variant="secondary"
          className="w-fit text-xs font-medium bg-violet-600/15 text-violet-400 border-violet-500/25 px-3 py-1"
        >
          <Layers className="size-3.5 mr-1" />
          {TOTAL_BLOCK_COUNT} blocks available
        </Badge>
      </motion.div>

      {/* ── AI Auto-Compose Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-950/80 via-violet-900/60 to-cyan-950/80 p-4"
      >
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 size-32 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 size-32 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="size-9 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Wand2 className="size-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Let AI assemble your page
              </p>
              <p className="text-[11px] text-violet-200/70">
                Auto-compose a complete layout for your business type
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
            <Select
              value={autoComposeCategory}
              onValueChange={(v) => setAutoComposeCategory(v as BusinessCategory)}
            >
              <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white text-sm backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAutoCompose}
              className="bg-white text-violet-900 hover:bg-violet-50 font-semibold gap-1.5 shadow-lg shadow-white/10"
            >
              <Sparkles className="size-4" />
              Auto Compose
            </Button>
          </div>
        </div>

        {/* Combination tagline */}
        <p className="relative mt-3 text-[11px] text-violet-200/50 text-center">
          {TOTAL_BLOCK_COUNT} blocks = millions of unique combinations
        </p>
      </motion.div>

      {/* ── Search & Filter Row ── */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-3"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search blocks by name, type, or keyword..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveType('all');
            }}
            className="pl-9 bg-card"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {BLOCK_TYPE_FILTERS.map((filter) => {
            const count =
              filter.value === 'all'
                ? allDesignBlocks.length
                : blockTypeCounts[filter.value] ?? 0;
            return (
              <button
                key={filter.value}
                onClick={() => {
                  setActiveType(filter.value);
                  setSearchQuery('');
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                  activeType === filter.value && !searchQuery
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    activeType === filter.value && !searchQuery
                      ? 'bg-white/20 text-white'
                      : 'bg-background text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Two-panel Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* ── Left: Block Library Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">
                {filteredBlocks.length}
              </span>{' '}
              block{filteredBlocks.length !== 1 ? 's' : ''}
              {(activeType !== 'all' || searchQuery) && (
                <span className="ml-0.5">
                  {' '}
                  (of {TOTAL_BLOCK_COUNT} total)
                </span>
              )}
            </p>
          </div>

          {filteredBlocks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Search className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No blocks found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try a different search or filter
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={cardContainerVariants}
              initial="hidden"
              animate="visible"
              key={activeType + searchQuery}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredBlocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockIds.has(block.id)}
                    isRecommended={recommendedIds.has(block.id)}
                    onAdd={() => handleAddBlock(block)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* ── Right: Composition Panel ── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card className="border-border/50 overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-3 bg-gradient-to-r from-violet-600/10 to-cyan-500/10 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-violet-400" />
                  <h3 className="text-sm font-semibold">Your Composition</h3>
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-violet-600/15 text-violet-400 border-0 px-1.5"
                  >
                    {selectedBlocks.length}
                  </Badge>
                </div>
                {selectedBlocks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                    onClick={handleClearBlocks}
                  >
                    <Trash2 className="size-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Composition list */}
            <ScrollArea className="max-h-[420px]">
              {selectedBlocks.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="size-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <Layers className="size-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No blocks selected
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                    Browse the library and click &quot;Add&quot; on blocks, or use
                    Auto Compose to get started quickly.
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-1.5">
                  <AnimatePresence mode="popLayout">
                    {selectedBlocks.map((block, index) => (
                      <CompositionItem
                        key={block.id}
                        block={block}
                        index={index}
                        total={selectedBlocks.length}
                        onRemove={() => handleRemoveBlock(block.id)}
                        onMove={(dir) => handleMoveBlock(index, dir)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>

            {/* Panel footer */}
            {selectedBlocks.length > 0 && (
              <div className="border-t border-border/50 p-4 space-y-3">
                {/* Combinations info */}
                <p className="text-[11px] text-center text-muted-foreground">
                  Your unique combination: 1 in{' '}
                  <span className="font-semibold text-foreground">
                    {formatCombinations(combinations)}
                  </span>
                </p>

                {/* Shuffle button */}
                {selectedBlocks.length >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={handleShuffle}
                  >
                    <Shuffle className="size-3.5" />
                    Shuffle Order
                  </Button>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  disabled={selectedBlocks.length < 2}
                  className={cn(
                    'w-full font-semibold gap-2 transition-all duration-200',
                    selectedBlocks.length >= 2
                      ? 'bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Sparkles className="size-4" />
                  Generate Website
                  {selectedBlocks.length >= 2 && (
                    <span className="text-sm opacity-80">
                      ({selectedBlocks.length} blocks)
                    </span>
                  )}
                  {selectedBlocks.length >= 2 && (
                    <ArrowRight className="size-4 ml-auto" />
                  )}
                </Button>

                {selectedBlocks.length < 2 && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    Add at least 2 blocks to generate a website
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
