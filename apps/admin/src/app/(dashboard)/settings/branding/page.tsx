import {
  Palette,
  Upload,
  Eye,
  ArrowLeft,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BrandingPage() {
  // TODO: Replace with actual data from Supabase
  const brandingSettings = {
    communityName: 'Greenview Village',
    logo: '/logos/greenview-village.png',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    accentColor: '#f59e0b',
    theme: 'light' as const,
  };

  const colorPresets = [
    { name: 'Emerald Green', primary: '#10b981', secondary: '#3b82f6', accent: '#f59e0b' },
    { name: 'Royal Blue', primary: '#3b82f6', secondary: '#10b981', accent: '#f59e0b' },
    { name: 'Sunset Orange', primary: '#f97316', secondary: '#3b82f6', accent: '#10b981' },
    { name: 'Purple Dream', primary: '#a855f7', secondary: '#ec4899', accent: '#f59e0b' },
    { name: 'Ocean Teal', primary: '#14b8a6', secondary: '#0ea5e9', accent: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appearance & Branding</h1>
            <p className="text-muted-foreground">
              Customize logo, colors, and community branding
            </p>
          </div>
        </div>
        <Button>
          <Eye className="mr-2 h-4 w-4" />
          Preview Changes
        </Button>
      </div>

      {/* Current Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Current Branding</CardTitle>
          <CardDescription>
            Your community's visual identity across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-3">Community Logo</p>
              <div className="border rounded-lg p-6 flex items-center justify-center bg-muted/50 h-40">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">{brandingSettings.communityName}</p>
                  <p className="text-xs text-muted-foreground">Logo Preview</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-3">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Logo
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Community Name</p>
              <div className="border rounded-lg p-4 mb-3">
                <p className="text-2xl font-bold">{brandingSettings.communityName}</p>
                <p className="text-sm text-muted-foreground mt-1">Displayed in headers and footers</p>
              </div>
              <Button variant="outline" className="w-full">
                Edit Community Name
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>
            Choose colors that represent your community's identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Primary Color</p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg border"
                    style={{ backgroundColor: brandingSettings.primaryColor }}
                  />
                  <div>
                    <p className="font-medium">{brandingSettings.primaryColor}</p>
                    <p className="text-xs text-muted-foreground">Main brand color</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Secondary Color</p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg border"
                    style={{ backgroundColor: brandingSettings.secondaryColor }}
                  />
                  <div>
                    <p className="font-medium">{brandingSettings.secondaryColor}</p>
                    <p className="text-xs text-muted-foreground">Supporting color</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Accent Color</p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg border"
                    style={{ backgroundColor: brandingSettings.accentColor }}
                  />
                  <div>
                    <p className="font-medium">{brandingSettings.accentColor}</p>
                    <p className="text-xs text-muted-foreground">Highlights</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Color Presets</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {colorPresets.map((preset, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        <div
                          className="h-6 w-6 rounded"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="h-6 w-6 rounded"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div
                          className="h-6 w-6 rounded"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <p className="font-medium text-sm">{preset.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full">
              <Palette className="mr-2 h-4 w-4" />
              Customize Colors
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>
            Configure light and dark mode preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <p className="font-medium">Light Mode</p>
                </div>
                {brandingSettings.theme === 'light' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="bg-white border rounded p-2 h-20"></div>
            </div>

            <div className="border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors opacity-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <p className="font-medium">Dark Mode</p>
                </div>
              </div>
              <div className="bg-gray-900 border rounded p-2 h-20"></div>
              <Badge variant="secondary" className="text-xs mt-2">Coming Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Previews</CardTitle>
          <CardDescription>
            See how your branding appears across different devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Web Portal Preview</p>
              </div>
              <div className="border rounded-lg bg-muted/50 h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Desktop/Laptop View</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Mobile App Preview</p>
              </div>
              <div className="border rounded-lg bg-muted/50 h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Mobile View</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Branding Guidelines</CardTitle>
          <CardDescription>
            Best practices for maintaining consistent visual identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Logo Requirements</p>
                <p className="text-muted-foreground">Use PNG format with transparent background, minimum 512x512px</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Color Accessibility</p>
                <p className="text-muted-foreground">Ensure sufficient contrast between colors for readability</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Consistent Application</p>
                <p className="text-muted-foreground">Branding will be applied across all apps (Admin, Residence, Sentinel)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
