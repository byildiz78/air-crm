import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Layout, Container } from '@/components/ui/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Target, Megaphone, Smartphone } from 'lucide-react'

export default function Home() {
  return (
    <Layout className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <Container className="py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Air-<span className="text-amber-600">CRM</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Restoranınız için modern müşteri ilişkileri yönetimi ve sadakat programı sistemi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
              <Link href="/login">Admin Girişi</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/loyalty-card">Sadakat Kartım</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Müşteri Yönetimi</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Müşteri bilgilerini merkezi olarak yönetin ve segmentlere ayırın
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Akıllı Segmentasyon</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Müşteri davranışlarına göre otomatik segmentler oluşturun
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Megaphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Hedefli Kampanyalar</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Doğru müşteriye doğru zamanda özel kampanyalar sunun
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Smartphone className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Dijital Sadakat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                QR kodlu dijital sadakat kartları ve puan sistemi
              </CardDescription>
            </CardContent>
          </Card>
        </div>
  );
}

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Restoranınızı Dijitalleştirin
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Air-CRM ile müşteri sadakatini artırın, kampanya etkinliğini ölçün ve 
            restoranınızın büyümesini hızlandırın. Modern PWA teknolojisi ile 
            müşterileriniz her zaman cebinde sadakat kartını taşıyabilir.
          </p>
        </div>
      </Container>
    </Layout>
  )
}