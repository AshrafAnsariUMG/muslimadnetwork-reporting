import IslamicWatermark from '@/components/ui/IslamicWatermark'
import Footer from '@/components/layout/Footer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IslamicWatermark />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
        <Footer />
      </div>
    </>
  )
}
