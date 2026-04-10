import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { Architecture } from '@/components/marketing/architecture'
import { CTA } from '@/components/marketing/cta'
import { MarketingNav } from '@/components/marketing/nav'
import { Footer } from '@/components/marketing/footer'

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <Features />
        <Architecture />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
