'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Download, Upload, Eye, Save, Undo2 } from 'lucide-react'
import { ThemeConfig, defaultTheme, restaurantThemes, applyTheme, themeToCssVariables } from '@/lib/theme-config'

interface LiveThemeEditorProps {
  onSave?: (theme: ThemeConfig, options: { isDefault: boolean, name: string, description?: string }) => void
  onCancel?: () => void
  initialTheme?: ThemeConfig
  editingTheme?: { id: string, name: string, description?: string, isDefault: boolean } | null
}

export function LiveThemeEditor({ onSave, onCancel, initialTheme = defaultTheme, editingTheme }: LiveThemeEditorProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(initialTheme)
  const [originalTheme, setOriginalTheme] = useState<ThemeConfig>(initialTheme)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const [saveOptions, setSaveOptions] = useState({
    name: '',
    description: '',
    isDefault: false
  })

  // Apply theme changes in real-time (NEVER apply in admin context)
  useEffect(() => {
    if (isPreviewMode && typeof window !== 'undefined') {
      // NEVER apply dynamic themes in admin context
      // Admin themes are for mobile preview only, not for changing admin UI
      if (window.location.pathname.startsWith('/admin')) {
        console.warn('LiveThemeEditor: Admin context - theme preview disabled for admin UI')
        return
      }
      
      // Only apply theme if we're in a mobile app context
      const mobileApp = document.querySelector('.mobile-app')
      if (mobileApp) {
        applyTheme(currentTheme)
      }
    }
  }, [currentTheme, isPreviewMode])

  // Set portal container after mount
  useEffect(() => {
    setPortalContainer(document.querySelector('.admin-app'))
  }, [])

  // Detect changes
  useEffect(() => {
    setHasChanges(JSON.stringify(currentTheme) !== JSON.stringify(originalTheme))
  }, [currentTheme, originalTheme])

  // Update theme property
  const updateTheme = (key: keyof ThemeConfig, value: any) => {
    setCurrentTheme(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Reset to original theme
  const resetTheme = () => {
    setCurrentTheme(originalTheme)
    if (isPreviewMode) {
      applyTheme(originalTheme)
    }
  }

  // Load preset theme
  const loadPreset = (presetKey: string) => {
    if (presetKey === 'default') {
      setCurrentTheme(defaultTheme)
    } else if (restaurantThemes[presetKey]) {
      setCurrentTheme({
        ...defaultTheme,
        ...restaurantThemes[presetKey]
      })
    }
  }

  // Open save dialog
  const openSaveDialog = () => {
    setSaveOptions({
      name: editingTheme?.name || '',
      description: editingTheme?.description || '',
      isDefault: editingTheme?.isDefault || false
    })
    setShowSaveDialog(true)
  }

  // Save theme
  const saveTheme = () => {
    if (!saveOptions.name.trim()) {
      alert('Tema adı gerekli!')
      return
    }

    // Save to localStorage for live editing
    localStorage.setItem('custom-theme', JSON.stringify(currentTheme))
    setOriginalTheme(currentTheme)
    
    onSave?.(currentTheme, {
      name: saveOptions.name.trim(),
      description: saveOptions.description.trim() || undefined,
      isDefault: saveOptions.isDefault
    })

    setShowSaveDialog(false)
  }

  // Export theme as JSON
  const exportTheme = () => {
    const dataStr = JSON.stringify(currentTheme, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'theme-config.json'
    link.click()
  }

  // Import theme from JSON
  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTheme = JSON.parse(e.target?.result as string)
        setCurrentTheme({ ...defaultTheme, ...importedTheme })
      } catch (error) {
        alert('Geçersiz tema dosyası')
      }
    }
    reader.readAsText(file)
  }

  // Generate CSS variables preview
  const cssVars = themeToCssVariables(currentTheme)

  return (
    <div className="space-y-6">
      {isPreviewMode && (
        <div className="theme-preview-container bg-gray-100 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Tema Önizlemesi</h3>
          <div 
            className="theme-preview bg-white rounded-lg p-6 shadow-sm"
            style={themeToCssVariables(currentTheme) as React.CSSProperties}
          >
            <div className="space-y-4">
              <div style={{ backgroundColor: currentTheme.background, color: currentTheme.textPrimary }} className="p-4 rounded-lg">
                <h4 className="text-lg font-bold mb-2" style={{ color: currentTheme.primary }}>Örnek Başlık</h4>
                <p className="mb-3" style={{ color: currentTheme.textSecondary }}>Bu bir örnek açıklama metnidir.</p>
                <div className="flex gap-2">
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    Ana Buton
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: currentTheme.secondary }}
                  >
                    İkincil Buton
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: currentTheme.accent }}
                  >
                    Vurgu Buton
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                {editingTheme ? `"${editingTheme.name}" Temasını Düzenle` : 'Yeni Tema Oluştur'}
              </CardTitle>
              <CardDescription>
                {editingTheme 
                  ? 'Mevcut tema ayarlarını düzenleyin ve güncelleyin'
                  : 'Yeni tema oluşturun ve mobil uygulamada kullanın'
                }
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary">Değişiklikler var</Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreviewMode ? 'Önizlemeyi Kapat' : 'Önizleme'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tema Ayarları</CardTitle>
                
                <div className="flex items-center gap-2">
                  <Select onValueChange={loadPreset}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Hazır Tema" />
                    </SelectTrigger>
                    <SelectContent container={portalContainer}>
                      <SelectItem value="default">Varsayılan</SelectItem>
                      <SelectItem value="burger-king">Burger King</SelectItem>
                      <SelectItem value="starbucks">Starbucks</SelectItem>
                      <SelectItem value="mcdonalds">McDonald's</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={exportTheme}>
                    <Download className="w-4 h-4" />
                  </Button>

                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTheme}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="colors" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="colors">Renkler</TabsTrigger>
                  <TabsTrigger value="typography">Yazı</TabsTrigger>
                  <TabsTrigger value="layout">Düzen</TabsTrigger>
                  <TabsTrigger value="assets">Logolar</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Brand Colors */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Marka Renkleri</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="primary">Ana Renk</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary"
                            type="color"
                            value={currentTheme.primary}
                            onChange={(e) => updateTheme('primary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.primary}
                            onChange={(e) => updateTheme('primary', e.target.value)}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryDark">Ana Renk (Koyu)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryDark"
                            type="color"
                            value={currentTheme.primaryDark}
                            onChange={(e) => updateTheme('primaryDark', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.primaryDark}
                            onChange={(e) => updateTheme('primaryDark', e.target.value)}
                            placeholder="#2563eb"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary">İkincil Renk</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary"
                            type="color"
                            value={currentTheme.secondary}
                            onChange={(e) => updateTheme('secondary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.secondary}
                            onChange={(e) => updateTheme('secondary', e.target.value)}
                            placeholder="#8b5cf6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accent">Vurgu Rengi</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accent"
                            type="color"
                            value={currentTheme.accent}
                            onChange={(e) => updateTheme('accent', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.accent}
                            onChange={(e) => updateTheme('accent', e.target.value)}
                            placeholder="#f59e0b"
                          />
                        </div>
                      </div>
                    </div>

                    {/* UI Colors */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Arayüz Renkleri</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="background">Arkaplan</Label>
                        <div className="flex gap-2">
                          <Input
                            id="background"
                            type="color"
                            value={currentTheme.background}
                            onChange={(e) => updateTheme('background', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.background}
                            onChange={(e) => updateTheme('background', e.target.value)}
                            placeholder="#f9fafb"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="surface">Yüzey</Label>
                        <div className="flex gap-2">
                          <Input
                            id="surface"
                            type="color"
                            value={currentTheme.surface}
                            onChange={(e) => updateTheme('surface', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.surface}
                            onChange={(e) => updateTheme('surface', e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textPrimary">Ana Metin</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textPrimary"
                            type="color"
                            value={currentTheme.textPrimary}
                            onChange={(e) => updateTheme('textPrimary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.textPrimary}
                            onChange={(e) => updateTheme('textPrimary', e.target.value)}
                            placeholder="#111827"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textSecondary">İkincil Metin</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textSecondary"
                            type="color"
                            value={currentTheme.textSecondary}
                            onChange={(e) => updateTheme('textSecondary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.textSecondary}
                            onChange={(e) => updateTheme('textSecondary', e.target.value)}
                            placeholder="#6b7280"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Font Ailesi</Label>
                      <Input
                        id="fontFamily"
                        value={currentTheme.fontFamily || ''}
                        onChange={(e) => updateTheme('fontFamily', e.target.value)}
                        placeholder="Inter, system-ui, sans-serif"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headingFontFamily">Başlık Font Ailesi</Label>
                      <Input
                        id="headingFontFamily"
                        value={currentTheme.headingFontFamily || ''}
                        onChange={(e) => updateTheme('headingFontFamily', e.target.value)}
                        placeholder="Inter, system-ui, sans-serif"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="borderRadius">Köşe Yuvarlaklığı</Label>
                      <Select 
                        value={currentTheme.borderRadius} 
                        onValueChange={(value: any) => updateTheme('borderRadius', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent container={portalContainer}>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="sm">Küçük</SelectItem>
                          <SelectItem value="md">Orta</SelectItem>
                          <SelectItem value="lg">Büyük</SelectItem>
                          <SelectItem value="xl">Çok Büyük</SelectItem>
                          <SelectItem value="full">Tam Yuvarlak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shadowStyle">Gölge Stili</Label>
                      <Select 
                        value={currentTheme.shadowStyle} 
                        onValueChange={(value: any) => updateTheme('shadowStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent container={portalContainer}>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="sm">Küçük</SelectItem>
                          <SelectItem value="md">Orta</SelectItem>
                          <SelectItem value="lg">Büyük</SelectItem>
                          <SelectItem value="xl">Çok Büyük</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assets" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo URL</Label>
                      <Input
                        id="logo"
                        value={currentTheme.logo || ''}
                        onChange={(e) => updateTheme('logo', e.target.value)}
                        placeholder="/logos/restaurant-logo.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoLight">Logo URL (Açık)</Label>
                      <Input
                        id="logoLight"
                        value={currentTheme.logoLight || ''}
                        onChange={(e) => updateTheme('logoLight', e.target.value)}
                        placeholder="/logos/restaurant-logo-light.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="favicon">Favicon URL</Label>
                      <Input
                        id="favicon"
                        value={currentTheme.favicon || ''}
                        onChange={(e) => updateTheme('favicon', e.target.value)}
                        placeholder="/favicon.ico"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={openSaveDialog} 
                className="w-full"
                disabled={!hasChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTheme ? 'Güncelle' : 'Temayı Kaydet'}
              </Button>

              <Button 
                variant="outline" 
                onClick={resetTheme} 
                className="w-full"
                disabled={!hasChanges}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Değişiklikleri Geri Al
              </Button>

              {editingTheme && onCancel && (
                <Button 
                  variant="secondary" 
                  onClick={onCancel} 
                  className="w-full"
                >
                  Düzenlemeyi İptal Et
                </Button>
              )}

              {isPreviewMode && (
                <div className="text-sm text-center text-muted-foreground">
                  ✅ Önizleme aktif
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSS Variables Preview */}
          <Card>
            <CardHeader>
              <CardTitle>CSS Değişkenleri</CardTitle>
              <CardDescription>
                Üretilen CSS değişkenleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-96">
                {Object.entries(cssVars).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-blue-600">{key}</span>: {value};
                  </div>
                ))}
              </pre>
            </CardContent>
          </Card>

          {/* Color Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Renk Önizlemesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div 
                  className="h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Ana
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: currentTheme.secondary }}
                >
                  İkincil
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: currentTheme.accent }}
                >
                  Vurgu
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center"
                  style={{ 
                    backgroundColor: currentTheme.surface,
                    color: currentTheme.textPrimary,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  Yüzey
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Theme Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? 'Temayı Güncelle' : 'Temayı Kaydet'}
            </DialogTitle>
            <DialogDescription>
              {editingTheme 
                ? 'Mevcut tema ayarlarını güncelleyin.'
                : 'Tema ayarlarını veritabanına kaydedin ve mobile uygulamada kullanın.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme-name">Tema Adı *</Label>
              <Input
                id="theme-name"
                placeholder="Örn: McDonald's Teması"
                value={saveOptions.name}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme-description">Açıklama</Label>
              <Textarea
                id="theme-description"
                placeholder="Tema hakkında kısa açıklama..."
                value={saveOptions.description}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-default"
                checked={saveOptions.isDefault}
                onCheckedChange={(checked) => setSaveOptions(prev => ({ ...prev, isDefault: Boolean(checked) }))}
              />
              <Label htmlFor="is-default" className="text-sm">
                Bu temayı varsayılan tema olarak ayarla
              </Label>
            </div>

            {saveOptions.isDefault && (
              <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                ⚠️ Varsayılan tema olarak ayarlanırsa, diğer varsayılan temalar otomatik olarak devre dışı bırakılır.
                Mobile uygulamada bu tema otomatik olarak yüklenir.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveTheme} disabled={!saveOptions.name.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {editingTheme ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}