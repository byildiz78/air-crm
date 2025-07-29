import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aircrm.com' },
    update: {},
    create: {
      email: 'admin@aircrm.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  // Test restoranı oluştur
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'default-restaurant-id' },
    update: {},
    create: {
      id: 'default-restaurant-id',
      name: 'Air Restaurant',
      address: 'İstanbul, Türkiye',
      phone: '0212 123 45 67'
    }
  })

  // Test müşterileri oluştur
  const customers = [
    {
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      phone: '0555 123 45 67',
      points: 150,
      level: 'BRONZE',
      restaurantId: restaurant.id
    },
    {
      name: 'Ayşe Demir',
      email: 'ayse@example.com',
      phone: '0555 234 56 78',
      points: 320,
      level: 'SILVER',
      restaurantId: restaurant.id
    },
    {
      name: 'Mehmet Kaya',
      email: 'mehmet@example.com',
      phone: '0555 345 67 89',
      points: 580,
      level: 'GOLD',
      restaurantId: restaurant.id
    },
    {
      name: 'Fatma Özkan',
      email: 'fatma@example.com',
      phone: '0555 456 78 90',
      points: 45,
      level: 'REGULAR',
      restaurantId: restaurant.id
    },
    {
      name: 'Ali Çelik',
      email: 'ali@example.com',
      phone: '0555 567 89 01',
      points: 1250,
      level: 'PLATINUM',
      restaurantId: restaurant.id
    }
  ]

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        ...customer,
        level: customer.level as any,
        birthDate: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        lastVisit: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      }
    })
  }

  // Test segmentleri oluştur
  const segments = [
    {
      name: 'VIP Müşteriler',
      description: '500+ puan sahibi müşteriler',
      restaurantId: restaurant.id,
      isAutomatic: true,
      criteria: JSON.stringify({
        averageOrderValue: { min: 700 },
        purchaseCount: { min: 20 },
        period: 'last_90_days'
      })
    },
    {
      name: 'Yeni Müşteriler',
      description: 'Son 30 gün içinde kayıt olan müşteriler',
      restaurantId: restaurant.id,
      isAutomatic: false
    },
    {
      name: 'Aktif Müşteriler',
      description: 'Son 7 gün içinde ziyaret eden müşteriler',
      restaurantId: restaurant.id,
      isAutomatic: true,
      criteria: JSON.stringify({
        daysSinceLastPurchase: { max: 7 },
        period: 'last_30_days'
      })
    }
  ]

  for (const segment of segments) {
    await prisma.segment.upsert({
      where: { 
        name_restaurantId: {
          name: segment.name,
          restaurantId: segment.restaurantId
        }
      },
      update: {},
      create: segment
    })
  }

  // Test kampanyaları oluştur
  const campaigns = [
    {
      name: 'Yaz İndirimi',
      description: 'Yaz aylarında geçerli özel indirim kampanyası',
      type: 'DISCOUNT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minPurchase: 100,
      maxUsagePerCustomer: 3,
      sendNotification: true,
      notificationTitle: 'Yaz İndirimi Başladı!',
      notificationMessage: '%20 indirim fırsatını kaçırmayın!',
      restaurantId: restaurant.id
    },
    {
      name: 'Happy Hour',
      description: '14:00-17:00 arası özel indirim',
      type: 'TIME_BASED',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 gün sonra
      discountType: 'PERCENTAGE',
      discountValue: 30,
      validHours: JSON.stringify({ start: '14:00', end: '17:00' }),
      maxUsagePerCustomer: 1,
      sendNotification: true,
      restaurantId: restaurant.id
    },
    {
      name: 'VIP Özel',
      description: 'VIP müşteriler için özel kampanya',
      type: 'DISCOUNT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 gün sonra
      discountType: 'FIXED_AMOUNT',
      discountValue: 50,
      minPurchase: 200,
      maxUsagePerCustomer: 5,
      sendNotification: true,
      restaurantId: restaurant.id
    }
  ]

  for (const campaign of campaigns) {
    await prisma.campaign.upsert({
      where: { 
        name_restaurantId: {
          name: campaign.name,
          restaurantId: campaign.restaurantId
        }
      },
      update: {},
      create: campaign
    })
  }

  // Test işlemleri oluştur
  const allCustomers = await prisma.customer.findMany()
  const allProducts = await prisma.product.findMany()
  
  for (const customer of allCustomers) {
    const transactionCount = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < transactionCount; i++) {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
      const itemCount = Math.floor(Math.random() * 3) + 1
      let totalAmount = 0
      const transactionItems = []
      
      for (let j = 0; j < itemCount; j++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)]
        const quantity = Math.floor(Math.random() * 2) + 1
        const itemTotal = product.price * quantity
        totalAmount += itemTotal
        
        transactionItems.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          quantity,
          unitPrice: product.price,
          totalPrice: itemTotal
        })
      }
      
      const pointsEarned = Math.floor(totalAmount / 10)
      
      await prisma.transaction.create({
        data: {
          orderNumber,
          totalAmount,
          discountAmount: 0,
          finalAmount: totalAmount,
          pointsEarned,
          pointsUsed: 0,
          paymentMethod: ['CASH', 'CARD', 'MOBILE'][Math.floor(Math.random() * 3)],
          customerId: customer.id,
          transactionDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
          items: {
            create: transactionItems
          }
        }
      })
    }
  }

  console.log('✅ Seed data created successfully!')
  console.log('📧 Admin Email: admin@aircrm.com')
  console.log('🔑 Admin Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })