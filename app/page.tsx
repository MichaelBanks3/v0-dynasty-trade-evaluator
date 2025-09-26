import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, BarChart3 } from "lucide-react"
import { SiteShell } from "@/components/layout/SiteShell"

export default function HomePage() {
  return (
    <SiteShell
      title="Dynasty Trade Evaluator"
      subtitle="Make smarter dynasty trades..."
      right={
        <div className="flex gap-4">
          <Link href="/trade" className="btn-primary focus-ring">Create Trade</Link>
          <Link href="/dashboard" className="btn-ghost focus-ring">My Dashboard</Link>
        </div>
      }
    >
      {/* Value Props */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="theme-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6" style={{color: 'hsl(var(--primary))'}} />
            <h3 className="text-lg font-semibold">Smart Valuations</h3>
          </div>
          <p className="theme-muted">
            Get accurate player valuations based on age, position, and league settings. Our algorithm considers both
            current value and future potential.
          </p>
        </div>

        <div className="theme-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-6 w-6" style={{color: 'hsl(var(--primary))'}} />
            <h3 className="text-lg font-semibold">League Customization</h3>
          </div>
          <p className="theme-muted">
            Tailor evaluations to your specific league settings including Superflex, TE Premium, and custom scoring
            to get the most accurate assessments.
          </p>
        </div>

        <div className="theme-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-6 w-6" style={{color: 'hsl(var(--primary))'}} />
            <h3 className="text-lg font-semibold">Win-Now vs Future</h3>
          </div>
          <p className="theme-muted">
            Understand whether a trade helps you compete now or builds for the future. Perfect for making strategic
            decisions based on your team's timeline.
          </p>
        </div>
      </div>
    </SiteShell>
  )
}