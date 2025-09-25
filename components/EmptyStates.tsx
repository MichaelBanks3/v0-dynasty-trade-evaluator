import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Users, TrendingUp, Plus } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {icon || <Search className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function EmptySearchResults() {
  return (
    <EmptyState
      title="No results found"
      description="Try searching for a different player name or pick year"
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
    />
  )
}

export function EmptyTradeBuilder() {
  return (
    <EmptyState
      title="Build your trade"
      description="Add players and picks to both teams to see the evaluation"
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
    />
  )
}

export function EmptyDashboard() {
  return (
    <EmptyState
      title="No trades yet"
      description="Create your first trade evaluation to get started"
      action={{
        label: "Create Your First Trade",
        onClick: () => window.location.href = "/trade"
      }}
      icon={<Plus className="h-8 w-8 text-muted-foreground" />}
    />
  )
}

export function EmptyResults() {
  return (
    <EmptyState
      title="Ready to evaluate"
      description="Add assets to both teams to see the trade analysis"
      icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
    />
  )
}
