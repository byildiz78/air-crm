'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { 
  X,
  Save,
  ArrowRight,
  ArrowLeft,
  FileText,
  Zap,
  Gift,
  Users,
  Check
} from 'lucide-react'
import { Campaign } from '@prisma/client'
import { toast } from 'sonner'

// Import our step components
import { CampaignFormStep1 } from './CampaignFormStep1'
import { CampaignFormStep2 } from './CampaignFormStep2'
import { CampaignFormStep3 } from './CampaignFormStep3'
import { CampaignFormStep4 } from './CampaignFormStep4'
import { CampaignFormData, Product, Segment } from './types'

const campaignSchema = z.object({
  name: z.string().min(2, 'Kampanya adı en az 2 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  startDate: z.string().min(1, 'Başlangıç tarihi gerekli'),
  endDate: z.string().min(1, 'Bitiş tarihi gerekli'),
  isActive: z.boolean().default(true),
  
  // Trigger conditions
  triggerType: z.enum(['purchase_amount', 'product_purchase', 'category_purchase', 'visit_count', 'birthday']),
  minPurchase: z.number().min(0).optional(),
  targetProducts: z.array(z.string()).optional(),
  targetCategories: z.array(z.string()).optional(),
  requiredQuantity: z.number().min(1).optional(),
  visitCount: z.number().min(1).optional(),
  
  // Rewards
  rewardType: z.enum(['discount_percentage', 'discount_fixed', 'free_product', 'points_multiplier', 'free_shipping']),
  discountValue: z.number().min(0).optional(),
  freeProducts: z.array(z.string()).optional(),
  pointsMultiplier: z.number().min(1).optional(),
  
  // Targeting
  maxUsage: z.number().min(1).optional(),
  maxUsagePerCustomer: z.number().min(1).default(1),
  segmentIds: z.array(z.string()).optional(),
  sendNotification: z.boolean().default(true),
  notificationTitle: z.string().optional(),
  notificationMessage: z.string().optional()
}).refine((data) => {
  // Trigger type'a göre gerekli alanları kontrol et
  if (data.triggerType === 'purchase_amount' && !data.minPurchase) {
    return false
  }
  if (data.triggerType === 'visit_count' && !data.visitCount) {
    return false
  }
  
  // Reward type'a göre gerekli alanları kontrol et
  if (['discount_percentage', 'discount_fixed'].includes(data.rewardType) && !data.discountValue) {
    return false
  }
  if (data.rewardType === 'points_multiplier' && !data.pointsMultiplier) {
    return false
  }
  
  return true
}, {
  message: "Gerekli alanlar eksik"
})

interface SimpleCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function SimpleCampaignModal({ 
  open, 
  onOpenChange, 
  campaign, 
  onSubmit, 
  isLoading 
}: SimpleCampaignModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  
  // Selection states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFreeProducts, setSelectedFreeProducts] = useState<string[]>([])
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      isActive: true,
      maxUsagePerCustomer: 1,
      sendNotification: true,
      triggerType: 'purchase_amount',
      rewardType: 'discount_percentage'
    }
  })

  const selectedTriggerType = watch('triggerType')
  const selectedRewardType = watch('rewardType')

  useEffect(() => {
    if (open) {
      Promise.all([fetchProducts(), fetchSegments()])
    }
  }, [open])

  // Load campaign data for editing OR reset for new campaign
  useEffect(() => {
    if (campaign) {
      // Kampanya düzenleme modu - mevcut verilerden trigger ve reward type belirle
      let triggerType: CampaignFormData['triggerType'] = 'purchase_amount'
      let rewardType: CampaignFormData['rewardType'] = 'discount_percentage'
      
      // Campaign type'ına göre trigger type belirle
      if (campaign.type === 'PRODUCT_BASED') {
        triggerType = 'product_purchase'
      } else if (campaign.type === 'CATEGORY_DISCOUNT') {
        triggerType = 'category_purchase'
      } else if (campaign.type === 'BIRTHDAY_SPECIAL') {
        triggerType = 'birthday'
      } else if (campaign.minPurchase) {
        triggerType = 'purchase_amount'
      }
      
      // Discount type'ına göre reward type belirle
      if (campaign.type === 'LOYALTY_POINTS' || campaign.pointsMultiplier > 1) {
        rewardType = 'points_multiplier'
      } else if (campaign.freeProducts || campaign.getSpecificProduct) {
        rewardType = 'free_product'
      } else if (campaign.discountType === 'PERCENTAGE') {
        rewardType = 'discount_percentage'
      } else if (campaign.discountType === 'FIXED_AMOUNT') {
        rewardType = 'discount_fixed'
      }

      reset({
        name: campaign.name || '',
        description: campaign.description || '',
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
        isActive: campaign.isActive ?? true,
        maxUsagePerCustomer: campaign.maxUsagePerCustomer || 1,
        sendNotification: campaign.sendNotification ?? true,
        notificationTitle: campaign.notificationTitle || '',
        notificationMessage: campaign.notificationMessage || '',
        triggerType,
        rewardType,
        minPurchase: campaign.minPurchase || undefined,
        requiredQuantity: campaign.buyQuantity || undefined,
        visitCount: undefined, // TODO: Campaign'da visitCount alanı yok
        discountValue: campaign.discountValue || undefined,
        pointsMultiplier: campaign.pointsMultiplier || undefined,
        maxUsage: campaign.maxUsage || undefined
      })
      
      // JSON alanları parse et
      try {
        if (campaign.targetProducts) {
          setSelectedProducts(JSON.parse(campaign.targetProducts))
        } else {
          setSelectedProducts([])
        }
      } catch (e) {
        setSelectedProducts([])
      }
      
      try {
        if (campaign.targetCategories) {
          setSelectedCategories(JSON.parse(campaign.targetCategories))
        } else {
          setSelectedCategories([])
        }
      } catch (e) {
        setSelectedCategories([])
      }
      
      try {
        if (campaign.freeProducts) {
          setSelectedFreeProducts(JSON.parse(campaign.freeProducts))
        } else if (campaign.getSpecificProduct) {
          setSelectedFreeProducts([campaign.getSpecificProduct])
        } else {
          setSelectedFreeProducts([])
        }
      } catch (e) {
        setSelectedFreeProducts([])
      }
      
      // Segments (campaign'da segment relation'ı varsa)
      if ((campaign as any).segments && Array.isArray((campaign as any).segments)) {
        setSelectedSegments((campaign as any).segments.map((s: any) => s.id || s))
      } else {
        setSelectedSegments([])
      }
    } else {
      // Yeni kampanya modu - herşeyi temizle
      reset({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        isActive: true,
        maxUsagePerCustomer: 1,
        sendNotification: true,
        notificationTitle: '',
        notificationMessage: '',
        triggerType: 'purchase_amount',
        rewardType: 'discount_percentage'
      })
      setSelectedProducts([])
      setSelectedCategories([])
      setSelectedFreeProducts([])
      setSelectedSegments([])
      setCurrentStep(1)
    }
  }, [campaign, reset])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        
        const uniqueCategories = [...new Set(data.products?.map((p: Product) => p.category) || [])]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Error fetching segments:', error)
    }
  }

  const handleFormSubmit = async (data: CampaignFormData) => {
    try {
      // Trigger ve reward type'a göre uygun campaign type belirle
      let campaignType = 'DISCOUNT'
      
      if (data.triggerType === 'product_purchase' || data.rewardType === 'free_product') {
        campaignType = 'PRODUCT_BASED'
      } else if (data.triggerType === 'category_purchase') {
        campaignType = 'CATEGORY_DISCOUNT'
      } else if (data.triggerType === 'birthday') {
        campaignType = 'BIRTHDAY_SPECIAL'
      } else if (data.rewardType === 'points_multiplier') {
        campaignType = 'LOYALTY_POINTS'
      } else if (data.triggerType === 'purchase_amount' && ['discount_percentage', 'discount_fixed'].includes(data.rewardType)) {
        campaignType = 'DISCOUNT'
      }

      const submitData = {
        name: data.name,
        description: data.description,
        type: campaignType,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        
        // Discount settings
        discountType: data.rewardType === 'discount_percentage' ? 'PERCENTAGE' : 
                     data.rewardType === 'discount_fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
        discountValue: data.discountValue || 0,
        
        // Trigger conditions
        minPurchase: data.minPurchase || undefined,
        buyQuantity: data.requiredQuantity || undefined, // Ürün için gerekli adet
        
        // Product/Category targeting
        targetProducts: selectedProducts.length > 0 ? JSON.stringify(selectedProducts) : null,
        targetCategories: selectedCategories.length > 0 ? JSON.stringify(selectedCategories) : null,
        
        // Free products for rewards
        freeProducts: selectedFreeProducts.length > 0 ? JSON.stringify(selectedFreeProducts) : null,
        getSpecificProduct: selectedFreeProducts.length > 0 ? selectedFreeProducts[0] : null,
        
        // Points multiplier
        pointsMultiplier: data.pointsMultiplier || 1,
        
        // Usage limits
        maxUsage: data.maxUsage || undefined,
        maxUsagePerCustomer: data.maxUsagePerCustomer || 1,
        
        // Notifications
        sendNotification: data.sendNotification,
        notificationTitle: data.notificationTitle || null,
        notificationMessage: data.notificationMessage || null,
        
        // Targeting
        segmentIds: selectedSegments
      }

      console.log('Simple campaign submit data:', submitData)
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting campaign:', error)
      toast.error('Kampanya kaydedilirken hata oluştu')
    }
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof CampaignFormData)[] = []
    
    // Her adım için sadece o adımın alanlarını validate et
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['name', 'description', 'startDate', 'endDate']
        break
      case 2:
        fieldsToValidate = ['triggerType']
        // Trigger type'a göre ilgili alanları ekle
        if (selectedTriggerType === 'purchase_amount') {
          fieldsToValidate.push('minPurchase')
        } else if (selectedTriggerType === 'visit_count') {
          fieldsToValidate.push('visitCount')
        } else if (selectedTriggerType === 'product_purchase') {
          fieldsToValidate.push('requiredQuantity')
          // Ürün seçimi yapılmış mı kontrol et
          if (selectedProducts.length === 0) {
            toast.error('En az bir ürün seçmelisiniz')
            return
          }
        } else if (selectedTriggerType === 'category_purchase') {
          fieldsToValidate.push('requiredQuantity')
          // Kategori seçimi yapılmış mı kontrol et
          if (selectedCategories.length === 0) {
            toast.error('En az bir kategori seçmelisiniz')
            return
          }
        }
        // birthday için ek alan gerekmez
        break
      case 3:
        fieldsToValidate = ['rewardType']
        // Reward type'a göre ilgili alanları ekle
        if (['discount_percentage', 'discount_fixed'].includes(selectedRewardType)) {
          fieldsToValidate.push('discountValue')
        } else if (selectedRewardType === 'points_multiplier') {
          fieldsToValidate.push('pointsMultiplier')
        } else if (selectedRewardType === 'free_product') {
          // Bedava ürün seçimi yapılmış mı kontrol et
          if (selectedFreeProducts.length === 0) {
            toast.error('En az bir bedava ürün seçmelisiniz')
            return
          }
        }
        break
      default:
        fieldsToValidate = []
    }
    
    const isValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate)
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addToSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (!list.includes(item)) {
      setList([...list, item])
    }
  }

  const removeFromSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter(i => i !== item))
  }

  if (!open) return null

  const steps = [
    { number: 1, title: 'Temel Bilgiler', icon: FileText },
    { number: 2, title: 'Ne Zaman?', icon: Zap },
    { number: 3, title: 'Ne Verilir?', icon: Gift },
    { number: 4, title: 'Kimler Görsün?', icon: Users }
  ]

  // Common props for all steps
  const commonProps = {
    register,
    errors,
    watch,
    setValue,
    products,
    segments,
    categories,
    selectedProducts,
    setSelectedProducts,
    selectedCategories,
    setSelectedCategories,
    selectedFreeProducts,
    setSelectedFreeProducts,
    selectedSegments,
    setSelectedSegments,
    addToSelection,
    removeFromSelection
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Compact Header */}
      <div className="border-b border-slate-200/60 bg-white/90 backdrop-blur-xl z-10 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="hover:bg-slate-100 rounded-full p-1"
            >
              <X className="h-4 w-4 text-slate-600" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Gift className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  {campaign ? '✨ Düzenle' : '🚀 Yeni Kampanya'}
                </h1>
                <p className="text-xs text-slate-500">
                  {steps.find(s => s.number === currentStep)?.title}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              size="sm"
              className="border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              İptal
            </Button>
            {currentStep === 4 && (
              <Button 
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    {campaign ? 'Güncelle' : 'Oluştur'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Compact Progress Steps */}
        <div className="px-6 pb-3">
          <div className="relative">
            {/* Progress Background Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between relative">
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-col items-center">
                  {/* Smaller Step Circle */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all duration-300 ${
                    currentStep >= step.number 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white shadow-md' 
                      : currentStep === step.number
                      ? 'bg-white border-blue-400 text-blue-600 shadow-md'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {currentStep > step.number ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  
                  {/* Compact Step Info */}
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${
                      currentStep >= step.number 
                        ? 'text-blue-600' 
                        : currentStep === step.number
                        ? 'text-slate-700'
                        : 'text-slate-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="animate-in slide-in-from-right-5 fade-in duration-300">
              {currentStep === 1 && <CampaignFormStep1 {...commonProps} />}
              {currentStep === 2 && <CampaignFormStep2 {...commonProps} />}
              {currentStep === 3 && <CampaignFormStep3 {...commonProps} />}
              {currentStep === 4 && <CampaignFormStep4 {...commonProps} />}
            </div>
          </form>
        </div>
      </div>

      {/* Compact Footer Navigation */}
      <div className="border-t border-slate-200/60 bg-white/90 backdrop-blur-xl px-6 py-4 shadow-sm flex-shrink-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            size="sm"
            className={`${currentStep === 1 ? 'opacity-50' : ''}`}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Önceki
          </Button>

          <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {currentStep} / 4
          </div>

          <Button
            onClick={nextStep}
            disabled={currentStep === 4}
            size="sm"
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 ${
              currentStep === 4 ? 'opacity-50' : ''
            }`}
          >
            {currentStep === 4 ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Bitti
              </>
            ) : (
              <>
                Sonraki
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}