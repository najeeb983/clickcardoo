'use client'

import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession, signOut } from 'next-auth/react'
import { useTranslation } from '@/components/translation-provider'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session } = useSession()
  const { t, isRTL, language, changeLanguage } = useTranslation()

  const toggleLanguage = () => {
    changeLanguage(language === 'ar' ? 'en' : 'ar')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            type="search"
            placeholder={t('common.search') + "..."}
            className={cn(
              "w-full",
              isRTL ? "pr-10" : "pl-10"
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage}
          className="text-xs"
        >
          {language === 'ar' ? 'English' : 'العربية'}
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className={cn(
            "absolute -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white",
            isRTL ? "-right-1" : "-left-1"
          )}>
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {session?.user?.name || (isRTL ? 'المستخدم' : 'User')}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{isRTL ? 'حسابي' : 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="w-full">
                {t('nav.profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/settings" className="w-full">
                {t('nav.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}