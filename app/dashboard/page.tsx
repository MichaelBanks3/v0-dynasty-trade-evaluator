import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignedIn, SignedOut, UserButton, SignOutButton } from "@clerk/nextjs"
import { AuthEnvBanner } from "@/components/AuthEnvBanner"
import { Plus, History, Settings, TrendingUp, TrendingDown, Minus } from "lucide-react"

// Mock recent trades data
const mockRecentTrades = [
  {
    id: "1",
    date: "2024-01-15",
    teamA: ["Justin Jefferson", "2025 2nd"],
    teamB: ["Ja'Marr Chase", "Bijan Robinson"],
    result: "Leans Team B",
    winNowScore: 65,
  },
  {
    id: "2",
    date: "2024-01-12",
    teamA: ["Patrick Mahomes"],
    teamB: ["Josh Allen", "2025 3rd"],
    result: "Even",
    winNowScore: 50,
  },
  {
    id: "3",
    date: "2024-01-10",
    teamA: ["Travis Kelce", "Derrick Henry"],
    teamB: ["Kyle Pitts", "2025 1st (Early)"],
    result: "Leans Team A",
    winNowScore: 75,
  },
]

export default function DashboardPage() {
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
              <Link href="/dashboard" className="text-foreground font-medium">
                Dashboard
              </Link>
              <Link href="/trade/new" className="text-muted-foreground hover:text-foreground">
                Create Trade
              </Link>
              <SignedOut>
                <Link href="/sign-in" className="text-muted-foreground hover:text-foreground" data-testid="auth-signin-link">
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton data-testid="auth-user-button" />
                <SignOutButton>
                  <button className="text-muted-foreground hover:text-foreground" data-testid="auth-signout-button">Sign out</button>
                </SignOutButton>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuthEnvBanner />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your dynasty trades and league settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Trade Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle>Create Trade</CardTitle>
              </div>
              <CardDescription>Build and evaluate a new dynasty trade</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/trade/new">
                <Button className="w-full" size="lg">
                  Start New Trade
                </Button>
              </Link>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>• Compare player values</p>
                <p>• Analyze win-now vs future</p>
                <p>• Apply league settings</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle>Recent Trades</CardTitle>
                </div>
                <Badge variant="secondary">{mockRecentTrades.length} trades</Badge>
              </div>
              <CardDescription>Your recently evaluated trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentTrades.map((trade) => (
                  <div key={trade.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{new Date(trade.date).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            trade.result === "Even"
                              ? "secondary"
                              : trade.result.includes("Team A")
                                ? "default"
                                : "outline"
                          }
                        >
                          {trade.result}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm">
                          {trade.winNowScore > 60 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : trade.winNowScore < 40 ? (
                            <TrendingDown className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {trade.winNowScore > 60 ? "Win-Now" : trade.winNowScore < 40 ? "Future" : "Balanced"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Team A</p>
                        <div className="space-y-1">
                          {trade.teamA.map((asset, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              {asset}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Team B</p>
                        <div className="space-y-1">
                          {trade.teamB.map((asset, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              {asset}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Button variant="outline" className="w-full bg-transparent" disabled>
                  View All Trades (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* League Settings Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>League Settings</CardTitle>
              </div>
              <CardDescription>Configure your league settings to get accurate trade evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Scoring Format</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Superflex</span>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">TE Premium</span>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">League Size</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Teams</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Roster Size</span>
                      <Badge variant="secondary">25</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Starting Lineup</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">QB</span>
                      <Badge variant="secondary">1</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">RB</span>
                      <Badge variant="secondary">2</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">WR</span>
                      <Badge variant="secondary">3</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">TE</span>
                      <Badge variant="secondary">1</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">FLEX</span>
                      <Badge variant="secondary">2</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full bg-transparent" disabled>
                    Edit Settings (Coming Soon)
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    League settings will be customizable in future updates. Current settings are used for all
                    evaluations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
