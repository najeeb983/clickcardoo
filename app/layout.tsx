import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from './providers'

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cardoo - Car Rental Management System',
  description: 'Comprehensive and secure system for car rental companies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="rtl-mode">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const preferredLanguage = localStorage.getItem('preferredLanguage');
                  if (preferredLanguage === 'en') {
                    document.documentElement.lang = 'en';
                    document.documentElement.dir = 'ltr';
                    document.documentElement.classList.add('ltr-mode');
                    document.documentElement.classList.remove('rtl-mode');
                  } else {
                    document.documentElement.lang = 'ar';
                    document.documentElement.dir = 'rtl';
                    document.documentElement.classList.add('rtl-mode');
                    document.documentElement.classList.remove('ltr-mode');
                  }
                } catch (e) {
                  console.error('Error applying language settings:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={cairo.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}