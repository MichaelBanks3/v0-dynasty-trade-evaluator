"use client"

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Trade {
  id: string
  createdAt: string
  totalA: number
  totalB: number
  verdict: string
  sideAPlayerIds: string[]
  sideBPlayerIds: string[]
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/trades/my-trades')
        .then(res => res.json())
        .then(data => setTrades(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isSignedIn])

  if (!isSignedIn) {
  return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Please sign in to view your trade history.</p>
            </CardContent>
          </Card>
        </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Trades</h1>
        
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Loading your trades...</p>
            </CardContent>
          </Card>
        ) : trades.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-6">No trades yet. Create your first trade!</p>
              <div className="flex justify-center space-x-4">
                <Link href="/trade">
                  <Button 
                    variant="outline" 
                    className="rounded-md border hover:bg-accent hover:text-accent-foreground"
                    data-testid="go-to-trade-button"
                  >
                    Create a Trade
                  </Button>
                </Link>
                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="rounded-md border hover:bg-accent hover:text-accent-foreground"
                    data-testid="back-home-button"
                  >
                    Back to Home
                </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="my-trades">
            {trades.map(trade => (
              <Card key={trade.id}>
            <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Trade #{trades.indexOf(trade) + 1}
                    </CardTitle>
              <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </Badge>
                      <Badge className={
                        trade.verdict === 'FAIR' ? 'bg-green-100 text-green-800' :
                        trade.verdict === 'FAVORS_A' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }>
                        {trade.verdict}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Team A: {trade.totalA} points</h4>
                      <p className="text-sm text-muted-foreground">
                        {trade.sideAPlayerIds.length} players
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Team B: {trade.totalB} points</h4>
                      <p className="text-sm text-muted-foreground">
                        {trade.sideBPlayerIds.length} players
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Difference: {Math.abs(trade.totalA - trade.totalB)} points
                  </p>
            </CardContent>
          </Card>
            ))}
        </div>
        )}
      </div>
    </div>
  )
}
