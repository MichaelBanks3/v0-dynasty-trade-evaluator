"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtext?: string
  className?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

export function StatCard({ 
  title, 
  value, 
  subtext, 
  className,
  trend,
  trendValue
}: StatCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-400"
      case "down":
        return "text-red-400"
      default:
        return "text-subtext"
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "↗"
      case "down":
        return "↘"
      default:
        return ""
    }
  }

  return (
    <Card className={cn("bg-surface border-border/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-subtext">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-text">
            {value}
          </div>
          {subtext && (
            <div className="text-xs text-subtext">
              {subtext}
            </div>
          )}
          {trend && trendValue && (
            <div className={cn("text-xs font-medium", getTrendColor())}>
              {getTrendIcon()} {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
