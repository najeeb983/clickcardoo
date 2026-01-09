'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Car, Lock, Mail, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        twoFactorCode: formData.twoFactorCode,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === '2FA_REQUIRED') {
          setShow2FA(true)
          toast({
            title: 'التحقق بخطوتين مطلوب',
            description: 'يرجى إدخال رمز التحقق بخطوتين',
          })
        } else if (result.error === 'TOO_MANY_ATTEMPTS') {
          toast({
            title: 'عدد كبير من المحاولات',
            description: 'يرجى المحاولة لاحقاً',
            variant: 'destructive',
          })
        } else if (result.error === 'ACCOUNT_DISABLED') {
          toast({
            title: 'الحساب معطل',
            description: 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'خطأ في تسجيل الدخول',
            description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بك في لوحة التحكم',
        })
        // استخدام window.location.href لضمان تحديث الجلسة بالكامل على Vercel
        window.location.href = '/dashboard'
      }
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        description: 'يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg"
          >
            <Car className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">كاردو</h1>
          <p className="text-gray-600">نظام إدارة تأجير السيارات</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center">
              أدخل بياناتك للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    className="pr-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {show2FA && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label htmlFor="twoFactorCode">رمز التحقق بخطوتين</Label>
                  <div className="relative">
                    <Shield className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="twoFactorCode"
                      type="text"
                      placeholder="123456"
                      className="pr-10"
                      value={formData.twoFactorCode}
                      onChange={(e) => setFormData({ ...formData, twoFactorCode: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'جاري تسجيل الدخول...' : 'دخول'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              
              
              <Button 
                variant="link" 
                className="text-xs text-primary mt-2"
                onClick={async () => {
                  try {
                    setIsFixing(true);
                    const response = await fetch('/api/fix-login');
                    const data = await response.json();
                    if (data.status === 'success') {
                      toast({
                        title: 'تم بنجاح',
                        description: data.message,
                      });
                    } else {
                      toast({
                        title: 'خطأ',
                        description: data.message,
                        variant: 'destructive',
                      });
                    }
                  } catch (error) {
                    toast({
                      title: 'خطأ',
                      description: 'فشل إصلاح مشكلة تسجيل الدخول',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsFixing(false);
                  }
                }}
                disabled={isFixing || isLoading}
              >
                {isFixing ? 'جاري الإصلاح...' : 'إصلاح مشكلة تسجيل الدخول'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          محمي بتشفير SSL وتقنيات الأمان المتقدمة
        </p>
      </motion.div>
    </div>
  )
}