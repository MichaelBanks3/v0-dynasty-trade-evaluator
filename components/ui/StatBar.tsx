"use client"

import { cn } from "@/lib/utils"
import { safePercentage } from "@/lib/format"

interface StatBarProps {
  label: string
  value: number | string | null | undefined
  max: number | string | null | undefined
  tone?: "blue" | "green" | "purple" | "orange" | "red"
  className?: string
  showValue?: boolean
  showPercentage?: boolean
}

const toneClasses = {
  blue: "bg-blue-500",
  green: "bg-green-500", 
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
}

export function StatBar({ 
  label, 
  value, 
  max, 
  tone = "blue", 
  className,
  showValue = true,
  showPercentage = true
}: StatBarProps) {
  const percentage = safePercentage(value, max)
  const displayValue = Number(value) || 0
  const displayMax = Number(max) || 0

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-subtext">{label}</span>
        <div className="flex items-center gap-2">
          {showValue && (
            <span className="font-medium text-text">
              {displayValue.toLocaleString()}
            </span>
          )}
          {showPercentage && (
            <span className="text-xs text-subtext">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
      <div 
        className="w-full bg-muted/20 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={displayValue}
        aria-valuemin={0}
        aria-valuemax={displayMax}
        aria-label={`${label}: ${displayValue.toLocaleString()} out of ${displayMax.toLocaleString()}`}
      >
        <div 
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            toneClasses[tone]
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  )
}
