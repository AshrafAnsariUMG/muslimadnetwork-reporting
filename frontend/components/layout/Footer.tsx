import IslamicDivider from '@/components/ui/IslamicDivider'

export default function Footer() {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ opacity: 0.2 }}>
        <IslamicDivider variant="simple" />
      </div>
      <footer
        className="w-full text-center py-6 px-8"
        style={{ backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}
      >
        <p className="text-sm" style={{ color: '#64748b' }}>
          © {new Date().getFullYear()} Muslim Ad Network ✦ All rights reserved.
        </p>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          A property of{' '}
          <a
            href="https://ummahmediagroup.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#1a4a2e] hover:text-[#C9A84C] transition-colors duration-200 underline-offset-2 hover:underline"
          >
            Ummah Media Group LLC
          </a>
        </p>
      </footer>
    </div>
  )
}
