import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-foreground">
                Dynasty Trade Evaluator
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/trade/new" className="text-muted-foreground hover:text-foreground">
                Create Trade
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl md:text-6xl text-balance">
            Dynasty Trade Evaluator
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Make smarter dynasty fantasy football trades with our comprehensive evaluation tool. Analyze player values,
            future potential, and trade fairness in seconds.
          </p>
          <div className="mt-10">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle>Smart Valuations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get accurate player valuations based on age, position, and league settings. Our algorithm considers both
                current value and future potential.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>League Customization</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tailor evaluations to your specific league settings including Superflex, TE Premium, and custom scoring
                to get the most accurate assessments.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle>Win-Now vs Future</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Understand whether a trade helps you compete now or builds for the future. Perfect for making strategic
                decisions based on your team's timeline.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
