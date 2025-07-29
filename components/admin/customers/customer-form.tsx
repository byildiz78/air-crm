'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { Customer, CustomerLevel } from '@prisma/client'

const customerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  points: z.number().min(0).optional(),
  level: z.enum(['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSubmit: (data: CustomerFormData) => Promise<void>
  isLoading?: boolean
}

const levelOptions = [
  { value: 'REGULAR', label: 'Normal' },
  { value: 'BRONZE', label: 'Bronz' },
  { value: 'SILVER', label: 'Gümüş' },
  { value: 'GOLD', label: 'Altın' },
  { value: 'PLATINUM', label: 'Platin' }
]

export function CustomerForm({ open, onOpenChange, customer, onSubmit, isLoading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      birthDate: customer?.birthDate ? new Date(customer.birthDate).toISOString().split('T')[0] : '',
      points: customer?.points || 0,
      level: customer?.level || 'REGULAR'
    }
  })

  const selectedLevel = watch('level')

  const handleFormSubmit = async (data: CustomerFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
          </DialogTitle>
          <DialogDescription>
            {customer 
              ? 'Müşteri bilgilerini güncelleyin.' 
              : 'Yeni müşteri bilgilerini girin.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Müşteri adı soyadı"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="ornek@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="0555 123 45 67"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Doğum Tarihi</Label>
            <Input
              id="birthDate"
              type="date"
              {...register('birthDate')}
            />
          </div>

          {customer && (
            <>
              <div className="space-y-2">
                <Label htmlFor="points">Puan</Label>
                <Input
                  id="points"
                  type="number"
                  {...register('points', { valueAsNumber: true })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Müşteri Seviyesi</Label>
                <Select
                  value={selectedLevel}
                  onValueChange={(value) => setValue('level', value as CustomerLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seviye seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customer ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}