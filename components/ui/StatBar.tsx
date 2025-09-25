import { cn } from "@/lib/utils"

interface StatBarProps {
  label: string
  value: number
  max: number
  tone?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  showValue?: boolean
  className?: string
}

export function StatBar({ 
  label, 
  value, 
  max, 
  tone = 'blue', 
  showValue = true,
  className 
}: StatBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  const toneClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-subtext">{label}</span>
        {showValue && (
          <span className="text-text font-mono">
            {Math.round(value).toLocaleString()}
          </span>
        )}
      </div>
      <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            toneClasses[tone]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}