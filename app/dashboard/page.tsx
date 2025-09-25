"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Plus, ExternalLink, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatSettingsForDisplay } from '@/lib/settings'
import { formatPts, formatPct } from '@/lib/format'
import { LeagueGrid } from '@/components/dashboard/LeagueGrid'
import { SavedTradesTable } from '@/components/trade/SavedTradesTable'

interface SavedTrade {
  id: string
  slug: string
  status: 'COMPLETED' | 'REQUESTED' | 'DENIED' | 'SANDBOX'
  verdict: string
  teamATotal: number
  teamBTotal: number
  deltaPct: number
  settings: any
  createdAt: string
}

interface League {
  id: string
  name: string
  season: string
  sport: string
  rank?: number
  score?: number
  teamCount?: number
}

export default function DashboardPage() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [trades, setTrades] = useState<SavedTrade[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    const fetchData = async () => {
      try {
        const [tradesResponse, leaguesResponse] = await Promise.all([
          fetch('/api/trades'),
          fetch('/api/sleeper/leagues')
        ])
        
        if (!tradesResponse.ok) {
          throw new Error('Failed to fetch trades')
        }
        
        const tradesData = await tradesResponse.json()
        setTrades(tradesData.trades || [])
        
        if (leaguesResponse.ok) {
          const leaguesData = await leaguesResponse.json()
          setLeagues(leaguesData.leagues || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isSignedIn, router])

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'FAVORS_A':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'FAVORS_B':
        return <TrendingDown className="h-4 w-4 text-purple-600" />
      case 'FAIR':
        return <Minus className="h-4 w-4 text-green-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'FAVORS_A':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'FAVORS_B':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'FAIR':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const calculateCompositeDelta = (totalA: number, totalB: number) => {
    const diff = Math.abs(totalA - totalB)
    const max = Math.max(totalA, totalB)
    return max > 0 ? Math.round((diff / max) * 100) : 0
  }

  const filteredTrades = trades.filter(trade => {
    const matchesFilter = filter === 'all' || trade.verdict === filter
    const matchesSearch = searchTerm === '' || 
      trade.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatSettingsForDisplay(trade.settings).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-subtext">Loading your trades...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-danger mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">Error Loading Trades</h1>
          <p className="text-subtext mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-accent text-accent-contrast hover:bg-accent/90">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const tradesByStatus = {
    COMPLETED: trades.filter(t => t.status === 'COMPLETED'),
    REQUESTED: trades.filter(t => t.status === 'REQUESTED'),
    DENIED: trades.filter(t => t.status === 'DENIED'),
    SANDBOX: trades.filter(t => t.status === 'SANDBOX'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Dashboard</h1>
          <p className="text-subtext mt-2">
            {leagues.length} leagues • {trades.length} trades
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
          <a href="/trade">
            <Plus className="h-4 w-4 mr-2" />
            New Trade
          </a>
        </Button>
      </div>

      {/* Leagues Grid */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Your Leagues</h2>
        <LeagueGrid leagues={leagues} />
      </div>

      {/* Saved Trades */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Saved Trades</h2>
        <Tabs defaultValue="SANDBOX" className="space-y-4">
          <TabsList className="bg-muted/20 border border-border/50">
            <TabsTrigger value="SANDBOX" className="data-[state=active]:bg-accent data-[state=active]:text-accent-contrast">
              Sandbox ({tradesByStatus.SANDBOX.length})
            </TabsTrigger>
            <TabsTrigger value="REQUESTED" className="data-[state=active]:bg-accent data-[state=active]:text-accent-contrast">
              Requested ({tradesByStatus.REQUESTED.length})
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" className="data-[state=active]:bg-accent data-[state=active]:text-accent-contrast">
              Completed ({tradesByStatus.COMPLETED.length})
            </TabsTrigger>
            <TabsTrigger value="DENIED" className="data-[state=active]:bg-accent data-[state=active]:text-accent-contrast">
              Denied ({tradesByStatus.DENIED.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="SANDBOX">
            <SavedTradesTable trades={tradesByStatus.SANDBOX} />
          </TabsContent>
          <TabsContent value="REQUESTED">
            <SavedTradesTable trades={tradesByStatus.REQUESTED} />
          </TabsContent>
          <TabsContent value="COMPLETED">
            <SavedTradesTable trades={tradesByStatus.COMPLETED} />
          </TabsContent>
          <TabsContent value="DENIED">
            <SavedTradesTable trades={tradesByStatus.DENIED} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}