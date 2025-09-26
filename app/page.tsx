import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">Dynasty Trade Evaluator</h1>
          <p className="mt-4 text-lg text-[color:var(--muted)]">Make smarter dynasty trades...</p>
          <div className="mt-8 flex justify-center gap-4">
            <a href="/trade" className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-2xl px-6 py-3 font-semibold hover:opacity-90">Create Trade</a>
            <a href="/dashboard" className="bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-2xl px-6 py-3 font-semibold hover:opacity-90">My Dashboard</a>
          </div>
        </div>
      </section>

        {/* Value Props */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-[color:var(--primary)]" />
                <CardTitle className="text-fg">Smart Valuations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[color:var(--muted)]">
                Get accurate player valuations based on age, position, and league settings. Our algorithm considers both
                current value and future potential.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-[color:var(--primary)]" />
                <CardTitle className="text-fg">League Customization</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[color:var(--muted)]">
                Tailor evaluations to your specific league settings including Superflex, TE Premium, and custom scoring
                to get the most accurate assessments.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-[color:var(--primary)]" />
                <CardTitle className="text-fg">Win-Now vs Future</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[color:var(--muted)]">
                Understand whether a trade helps you compete now or builds for the future. Perfect for making strategic
                decisions based on your team's timeline.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}