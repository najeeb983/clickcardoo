'use client'

import { SessionProvider } from 'next-auth/react'
import { TranslationProvider } from '@/components/translation-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TranslationProvider>
        {children}
      </TranslationProvider>
    </SessionProvider>
  )
}