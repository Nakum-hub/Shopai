'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Settings,
  User,
  Palette,
  Bot,
  Rocket,
  Search,
  Bell,
  Shield,
  Info,
  Globe,
  Save,
  Trash2,
  Download,
  ExternalLink,
  Monitor,
  Sun,
  Moon,
  Sparkles,
  Thermometer,
  Languages,
} from 'lucide-react';

// =============================================================================
// Settings Sections
// =============================================================================

type SettingsSection =
  | 'general'
  | 'appearance'
  | 'ai'
  | 'deployment'
  | 'seo'
  | 'notifications'
  | 'privacy'
  | 'about';

const settingsSections: {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'general', label: 'General', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'ai', label: 'AI Configuration', icon: Bot },
  { id: 'deployment', label: 'Deployment', icon: Rocket },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Data & Privacy', icon: Shield },
  { id: 'about', label: 'About', icon: Info },
];

// =============================================================================
// Color Presets
// =============================================================================

const colorPresets = [
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Fuchsia', value: '#d946ef' },
];

const fontOptions = [
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Playfair Display',
  'Space Grotesk',
  'DM Sans',
];

const aiModels = [
  { label: 'Claude 4 Sonnet', value: 'claude-4-sonnet' },
  { label: 'Claude 4 Opus', value: 'claude-4-opus' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Arabic', value: 'ar' },
];

const themeOptions = [
  { label: 'Modern', value: 'modern' },
  { label: 'Classic', value: 'classic' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Bold', value: 'bold' },
  { label: 'Elegant', value: 'elegant' },
];

// =============================================================================
// Animation Variants
// =============================================================================

const contentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

// =============================================================================
// SettingsView
// =============================================================================

export function SettingsView() {
  const { settings, updateSettings } = useAppStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your platform preferences and defaults
          </p>
        </div>
        <Button
          onClick={handleSave}
          className={cn(
            'transition-all duration-300',
            saved
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white'
          )}
        >
          {saved ? (
            <>
              <Sparkles className="size-4 mr-1.5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="size-4 mr-1.5" />
              Save Changes
            </>
          )}
        </Button>
      </motion.div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full md:w-56 shrink-0"
        >
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 w-full text-left',
                  activeSection === section.id
                    ? 'bg-violet-600/15 text-violet-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <section.icon
                  className={cn(
                    'size-4 shrink-0',
                    activeSection === section.id ? 'text-violet-400' : ''
                  )}
                />
                {section.label}
              </button>
            ))}
          </nav>
        </motion.aside>

        {/* Content Area */}
        <motion.div
          key={activeSection}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 min-w-0"
        >
          {activeSection === 'general' && <GeneralSection />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'ai' && <AISection />}
          {activeSection === 'deployment' && <DeploymentSection />}
          {activeSection === 'seo' && <SEOSection />}
          {activeSection === 'notifications' && <NotificationsSection />}
          {activeSection === 'privacy' && <PrivacySection />}
          {activeSection === 'about' && <AboutSection />}
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// General Section
// =============================================================================

function GeneralSection() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your business information and contact details
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Your Business Name"
                value={settings.businessName}
                onChange={(e) => updateSettings({ businessName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                placeholder="Your Name"
                value={settings.ownerName}
                onChange={(e) => updateSettings({ ownerName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={settings.email}
                onChange={(e) => updateSettings({ email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={settings.phone}
                onChange={(e) => updateSettings({ phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Appearance Section
// =============================================================================

function AppearanceSection() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize the look and feel of your generated websites
        </p>
      </div>

      {/* Theme */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Monitor className="size-4 text-muted-foreground" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateSettings({ theme: value as 'light' | 'dark' | 'system' })}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                  settings.theme === value
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-border/50 hover:border-border'
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    settings.theme === value ? 'text-violet-400' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    settings.theme === value ? 'text-violet-400' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Default Style */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" />
            Default Brand Style
          </CardTitle>
          <CardDescription>
            These defaults will be applied to new websites you create
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-5">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  onClick={() =>
                    updateSettings({
                      defaultStyle: { ...settings.defaultStyle, primaryColor: color.value },
                    })
                  }
                  className={cn(
                    'size-8 rounded-full transition-all duration-200 border-2',
                    settings.defaultStyle.primaryColor === color.value
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <div className="relative">
                <Input
                  type="color"
                  value={settings.defaultStyle.primaryColor}
                  onChange={(e) =>
                    updateSettings({
                      defaultStyle: { ...settings.defaultStyle, primaryColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 p-0 border-0 cursor-pointer rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  onClick={() =>
                    updateSettings({
                      defaultStyle: { ...settings.defaultStyle, secondaryColor: color.value },
                    })
                  }
                  className={cn(
                    'size-8 rounded-full transition-all duration-200 border-2',
                    settings.defaultStyle.secondaryColor === color.value
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <div className="relative">
                <Input
                  type="color"
                  value={settings.defaultStyle.secondaryColor}
                  onChange={(e) =>
                    updateSettings({
                      defaultStyle: { ...settings.defaultStyle, secondaryColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 p-0 border-0 cursor-pointer rounded-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Font */}
          <div className="space-y-2">
            <Label>Default Font</Label>
            <Select
              value={settings.defaultStyle.fontFamily}
              onValueChange={(v) =>
                updateSettings({
                  defaultStyle: { ...settings.defaultStyle, fontFamily: v },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Style */}
          <div className="space-y-2">
            <Label>Theme Style</Label>
            <Select
              value={settings.defaultStyle.theme}
              onValueChange={(v) =>
                updateSettings({
                  defaultStyle: {
                    ...settings.defaultStyle,
                    theme: v as 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant',
                  },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// AI Configuration Section
// =============================================================================

function AISection() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Configuration</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure AI model settings for website generation
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Bot className="size-3.5" />
              AI Model
            </Label>
            <Select
              value={settings.aiModel}
              onValueChange={(v) => updateSettings({ aiModel: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Claude models generally produce better website content and layouts
            </p>
          </div>

          <Separator />

          {/* Temperature */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="size-3.5" />
              Creativity Level
            </Label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-12">Focused</span>
              <div className="flex-1 flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    onClick={() => updateSettings({ aiModel: settings.aiModel })} // Placeholder — temperature isn't in the store type
                    className={cn(
                      'h-3 flex-1 rounded-full transition-all duration-200',
                      level <= 2
                        ? 'bg-violet-500'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground w-14">Creative</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher creativity produces more varied content but may be less accurate
            </p>
          </div>

          <Separator />

          {/* Language */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Languages className="size-3.5" />
              Output Language
            </Label>
            <Select
              value={settings.language}
              onValueChange={(v) => updateSettings({ language: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The language AI will use to generate website content
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Deployment Section
// =============================================================================

function DeploymentSection() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Deployment</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure where and how your websites are deployed
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          {/* Deployment Target */}
          <div className="space-y-2">
            <Label>Deployment Target</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'preview', label: 'Preview', desc: 'Built-in preview only' },
                { value: 'vercel', label: 'Vercel', desc: 'Deploy to Vercel' },
                { value: 'cloudflare', label: 'Cloudflare', desc: 'Deploy to Cloudflare Pages' },
              ].map((target) => (
                <button
                  key={target.value}
                  onClick={() =>
                    updateSettings({
                      deploymentTarget: target.value as 'preview' | 'vercel' | 'cloudflare' | 'custom',
                    })
                  }
                  className={cn(
                    'flex flex-col items-center gap-1 p-4 rounded-lg border-2 transition-all duration-200 text-center',
                    settings.deploymentTarget === target.value
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-border/50 hover:border-border'
                  )}
                >
                  <Rocket
                    className={cn(
                      'size-5 mb-1',
                      settings.deploymentTarget === target.value
                        ? 'text-violet-400'
                        : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      settings.deploymentTarget === target.value
                        ? 'text-violet-400'
                        : 'text-foreground'
                    )}
                  >
                    {target.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{target.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Domain */}
          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              placeholder="www.yourbusiness.com"
              value={settings.customDomain || ''}
              onChange={(e) => updateSettings({ customDomain: e.target.value || null })}
            />
            <p className="text-xs text-muted-foreground">
              Configure a custom domain for your deployed websites. Requires DNS configuration.
            </p>
          </div>

          <Separator />

          {/* Current Status */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Target</span>
              <Badge variant="secondary" className="capitalize">
                {settings.deploymentTarget}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Custom Domain</span>
              <span className="text-foreground">
                {settings.customDomain || (
                  <span className="text-muted-foreground">Not configured</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// SEO Section
// =============================================================================

function SEOSection() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">SEO</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Search engine optimization settings for generated websites
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          {/* Auto-generate SEO */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-generate SEO</Label>
              <p className="text-xs text-muted-foreground">
                Automatically generate meta tags, descriptions, and structured data
              </p>
            </div>
            <Switch
              checked={settings.seoAutoGenerate}
              onCheckedChange={(checked) => updateSettings({ seoAutoGenerate: checked })}
            />
          </div>

          <Separator />

          {/* Meta Description Template */}
          <div className="space-y-2">
            <Label>Meta Description Template</Label>
            <Textarea
              placeholder="Visit {business_name} - {category} in {location}. {tagline}"
              className="min-h-[80px] resize-none"
              defaultValue="{business_name} is your trusted {category} in {location}. Discover our {services} and {products}. Contact us today!"
            />
            <p className="text-xs text-muted-foreground">
              Available variables: {'{business_name}'}, {'{category}'}, {'{location}'}, {'{services}'}, {'{products}'}, {'{tagline}'}
            </p>
          </div>

          <Separator />

          {/* Analytics Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analytics Tracking</Label>
              <p className="text-xs text-muted-foreground">
                Enable built-in analytics for deployed websites
              </p>
            </div>
            <Switch
              checked={settings.analyticsEnabled}
              onCheckedChange={(checked) => updateSettings({ analyticsEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Notifications Section
// =============================================================================

function NotificationsSection() {
  const { settings, updateSettings } = useAppStore();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [deployNotifs, setDeployNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage how and when you receive notifications
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive browser push notifications
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => updateSettings({ notifications: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive email alerts for important events
              </p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Deployment Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when deployments succeed or fail
              </p>
            </div>
            <Switch checked={deployNotifs} onCheckedChange={setDeployNotifs} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Analytics Digest</Label>
              <p className="text-xs text-muted-foreground">
                Receive a weekly summary of your website performance
              </p>
            </div>
            <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Data & Privacy Section
// =============================================================================

function PrivacySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Data & Privacy</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your data and privacy settings
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Download className="size-3.5" />
                Export All Data
              </Label>
              <p className="text-xs text-muted-foreground">
                Download all your websites, settings, and analytics as a JSON file
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-1.5" />
              Export
            </Button>
          </div>

          <Separator />

          {/* Export Websites Only */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Globe className="size-3.5" />
                Export Websites
              </Label>
              <p className="text-xs text-muted-foreground">
                Export only your generated website HTML files
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-1.5" />
              Export
            </Button>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="size-4" />
              Danger Zone
            </h4>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Delete Account</Label>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// About Section
// =============================================================================

function AboutSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">About</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform information and resources
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          {/* Logo & Version */}
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <Settings className="size-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">StoreCraft</h3>
              <p className="text-sm text-muted-foreground">Voice-to-Website Platform</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                Version 1.0.0
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Built With</p>
              <p className="text-sm font-medium">Next.js 16 + AI</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">License</p>
              <p className="text-sm font-medium">Commercial</p>
            </div>
          </div>

          <Separator />

          {/* Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Resources</h4>
            <div className="space-y-1">
              {[
                { label: 'Documentation', url: '#' },
                { label: 'API Reference', url: '#' },
                { label: 'Changelog', url: '#' },
                { label: 'Support', url: '#' },
              ].map((link) => (
                <button
                  key={link.label}
                  className="flex items-center justify-between w-full p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="size-3.5" />
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Credits */}
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by the StoreCraft team
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              © 2025 StoreCraft. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
