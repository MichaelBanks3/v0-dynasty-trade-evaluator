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
import { AlertCircle, Plus, ExternalLink, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatSettingsForDisplay } from '@/lib/settings'

interface TradeHistory {
  id: string
  slug: string
  verdict: string
  nowDelta: number
  futureDelta: number
  totalA: number
  totalB: number
  settings: any
  createdAt: string
}

export default function DashboardPage() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [trades, setTrades] = useState<TradeHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    const fetchTrades = async () => {
      try {
        const response = await fetch('/api/trades/history')
        if (!response.ok) {
          throw new Error('Failed to fetch trades')
        }
        
        const data = await response.json()
        setTrades(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trades')
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Trade History</h1>
          <p className="text-subtext mt-2">
            {trades.length} saved trades
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
          <a href="/trade">
            <Plus className="h-4 w-4 mr-2" />
            New Trade
          </a>
        </Button>
      </div>

      {trades.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-subtext" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-text">No trades yet</h3>
              <p className="text-subtext mb-6">
                Create your first trade evaluation to get started
              </p>
              <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
                <a href="/trade">Create Your First Trade</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface border-border"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-surface border-border">
                <SelectValue placeholder="Filter by verdict" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="FAVORS_A">Favors Team A</SelectItem>
                <SelectItem value="FAVORS_B">Favors Team B</SelectItem>
                <SelectItem value="FAIR">Fair Trades</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trades Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-text">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-subtext">Date</TableHead>
                    <TableHead className="text-subtext">Verdict</TableHead>
                    <TableHead className="text-subtext">Team A Total</TableHead>
                    <TableHead className="text-subtext">Team B Total</TableHead>
                    <TableHead className="text-subtext">Delta</TableHead>
                    <TableHead className="text-subtext">Settings</TableHead>
                    <TableHead className="text-subtext">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-subtext" />
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getVerdictIcon(trade.verdict)}
                          <Badge className={getVerdictColor(trade.verdict)}>
                            {trade.verdict.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-text">
                          {Number(trade.totalA || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-text">
                          {Number(trade.totalB || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-text">
                          {calculateCompositeDelta(trade.totalA, trade.totalB)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs bg-muted/50 border-border">
                          {formatSettingsForDisplay(trade.settings)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-subtext hover:text-text"
                        >
                          <a href={`/t/${trade.slug}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}