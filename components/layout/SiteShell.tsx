import { ReactNode } from 'react'

interface SiteShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  right?: ReactNode
}

export function SiteShell({ children, title, subtitle, right }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header Section */}
      {(title || subtitle || right) && (
        <section className="relative overflow-hidden" style={{position:'relative', zIndex:50}}>
          <div className="relative mx-auto max-w-6xl px-6 py-16">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h1 className="text-5xl font-extrabold tracking-tight text-fg">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-4 text-lg text-muted">
                    {subtitle}
                  </p>
                )}
              </div>
              {right && (
                <div className="flex items-center gap-4">
                  {right}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {children}
      </div>
    </div>
  )
}
