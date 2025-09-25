import { Metadata } from 'next'

interface TradeData {
  verdict: string
  totals: {
    teamA: { compositeValue: number }
    teamB: { compositeValue: number }
  }
  assets: {
    teamA: Array<{ label: string; type: string }>
    teamB: Array<{ label: string; type: string }>
  }
  settings: {
    scoring: string
    superflex: boolean
    tePremium: boolean
    leagueSize: number
  }
}

export function generateTradeMetadata(trade: TradeData, slug: string): Metadata {
  const delta = Math.abs(trade.totals.teamA.compositeValue - trade.totals.teamB.compositeValue)
  const max = Math.max(trade.totals.teamA.compositeValue, trade.totals.teamB.compositeValue)
  const percentage = Math.round((delta / max) * 100)

  const getVerdictText = () => {
    switch (trade.verdict) {
      case 'FAVORS_A':
        return `Favors Team A by ${percentage}%`
      case 'FAVORS_B':
        return `Favors Team B by ${percentage}%`
      case 'FAIR':
        return 'Even Trade'
      default:
        return 'Trade Evaluation'
    }
  }

  const getTopAssets = (assets: Array<{ label: string; type: string }>) => {
    return assets.slice(0, 3).map(asset => asset.label).join(', ')
  }

  const settingsPill = [
    trade.settings.scoring,
    trade.settings.superflex ? 'SF' : '',
    trade.settings.tePremium ? 'TEP' : '',
    `${trade.settings.leagueSize}-team`
  ].filter(Boolean).join(' • ')

  const title = `${getVerdictText()} - Dynasty Trade Evaluator`
  const description = `Team A: ${getTopAssets(trade.assets.teamA)} vs Team B: ${getTopAssets(trade.assets.teamB)} • ${settingsPill}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://dynasty-trade-evaluator.vercel.app/t/${slug}`,
      siteName: 'Dynasty Trade Evaluator',
      images: [
        {
          url: `https://dynasty-trade-evaluator.vercel.app/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`https://dynasty-trade-evaluator.vercel.app/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://dynasty-trade-evaluator.vercel.app/t/${slug}`,
    },
  }
}
