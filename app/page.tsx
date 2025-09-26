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
          <Button asChild size="lg" className="rounded-2xl">
            <a href="/trade">Create Trade</a>
          </Button>
          <Button asChild variant="secondary" size="lg" className="rounded-2xl">
            <a href="/dashboard">My Dashboard</a>
          </Button>
        </div>
      }
    >
      {/* Value Props */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <CardTitle className="text-fg">Smart Valuations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted">
              Get accurate player valuations based on age, position, and league settings. Our algorithm considers both
              current value and future potential.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="text-fg">League Customization</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted">
              Tailor evaluations to your specific league settings including Superflex, TE Premium, and custom scoring
              to get the most accurate assessments.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <CardTitle className="text-fg">Win-Now vs Future</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted">
              Understand whether a trade helps you compete now or builds for the future. Perfect for making strategic
              decisions based on your team's timeline.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  )
}