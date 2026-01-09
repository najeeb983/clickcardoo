'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { User, Lock, Bell, Globe } from 'lucide-react'
import { useTranslation } from '@/components/translation-provider'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { language, changeLanguage } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isLanguageLoading, setIsLanguageLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en'>(language as 'ar' | 'en')
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Dubai')
  const [selectedCurrency, setSelectedCurrency] = useState('AED')
  
  // Load saved preferences on component mount
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const savedTimezone = localStorage.getItem('preferredTimezone')
      const savedCurrency = localStorage.getItem('preferredCurrency')
      
      if (savedTimezone) setSelectedTimezone(savedTimezone)
      if (savedCurrency) setSelectedCurrency(savedCurrency)
      
      // Set the language from the translation context
      setSelectedLanguage(language as 'ar' | 'en')
    }
  }, [language])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث الملف الشخصي بنجاح',
      })
      setIsLoading(false)
    }, 1000)
  }
  
  const handleSaveLanguageSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLanguageLoading(true)
    
    try {
      // Save timezone and currency preferences to localStorage
      localStorage.setItem('preferredTimezone', selectedTimezone)
      localStorage.setItem('preferredCurrency', selectedCurrency)
      
      // Use the translation context to change the language
      if (selectedLanguage !== language) {
        changeLanguage(selectedLanguage)
      }
      
      toast({
        title: selectedLanguage === 'ar' ? 'تم الحفظ' : 'Saved',
        description: selectedLanguage === 'ar' ? 'تم تحديث إعدادات اللغة والمنطقة بنجاح' : 'Language settings updated successfully',
      })
    } catch (error) {
      console.error('Error saving language settings:', error)
      toast({
        title: selectedLanguage === 'ar' ? 'خطأ' : 'Error',
        description: selectedLanguage === 'ar' ? 'حدث خطأ أثناء حفظ إعدادات اللغة' : 'An error occurred while saving language settings',
        variant: 'destructive',
      })
    } finally {
      setIsLanguageLoading(false)
    }
  }

  // Use the translation context
  const { t: translate } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{translate('nav.settings')}</h1>
        <p className="text-gray-600 mt-1">
          {language === 'ar' ? 'إدارة إعدادات حسابك' : 'Manage your account settings'}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{translate('nav.profile')}</CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' ? 'تحديث معلومات حسابك الشخصية' : 'Update your personal account information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{translate('bookings.customerName')}</Label>
                  <Input
                    id="name"
                    defaultValue={session?.user?.name || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{translate('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={session?.user?.email || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{translate('bookings.customerPhone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+971501234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">
                    {language === 'ar' ? 'اسم الشركة' : 'Company Name'}
                  </Label>
                  <Input
                    id="company"
                    placeholder={language === 'ar' ? 'شركة تأجير السيارات' : 'Car Rental Company'}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : translate('common.save')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>{language === 'ar' ? 'الأمان' : 'Security'}</CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' ? 'إدارة إعدادات الأمان وكلمة المرور' : 'Manage security settings and password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <Button>
              {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
            </Button>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'ar' ? 'التحقق بخطوتين' : 'Two-Factor Authentication'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === 'ar' 
                      ? 'أضف طبقة أمان إضافية لحسابك' 
                      : 'Add an extra layer of security to your account'}
                  </p>
                </div>
                <Button variant="outline">
                  {language === 'ar' ? 'تفعيل' : 'Enable'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' ? 'إدارة تفضيلات الإشعارات' : 'Manage notification preferences'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' 
                    ? 'تلقي إشعارات عن الحجوزات الجديدة' 
                    : 'Receive notifications about new bookings'}
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'إشعارات التجاوزات' : 'Excess Notifications'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' 
                    ? 'تلقي تنبيهات عند إضافة تجاوزات جديدة' 
                    : 'Receive alerts when new excesses are added'}
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'إشعارات الدفع' : 'Payment Notifications'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' 
                    ? 'تلقي تأكيدات عمليات الدفع' 
                    : 'Receive payment confirmations'}
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>
                {language === 'ar' ? 'اللغة والمنطقة' : 'Language & Region'}
              </CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' ? 'تخصيص اللغة والإعدادات الإقليمية' : 'Customize language and regional settings'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveLanguageSettings} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">
                  {language === 'ar' ? 'اللغة' : 'Language'}
                </Label>
                <select
                  id="language"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'ar' | 'en')}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  {language === 'ar' ? 'المنطقة الزمنية' : 'Timezone'}
                </Label>
                <select
                  id="timezone"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                >
                  <option value="Asia/Dubai">Dubai (GMT+4)</option>
                  <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                  <option value="Africa/Cairo">Cairo (GMT+2)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">
                  {language === 'ar' ? 'العملة' : 'Currency'}
                </Label>
                <select
                  id="currency"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="AED">AED (درهم إماراتي)</option>
                  <option value="SAR">SAR (ريال سعودي)</option>
                  <option value="EGP">EGP (جنيه مصري)</option>
                </select>
              </div>
              <Button type="submit" disabled={isLanguageLoading}>
                {isLanguageLoading 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : (language === 'ar' ? 'حفظ إعدادات اللغة' : 'Save Language Settings')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}