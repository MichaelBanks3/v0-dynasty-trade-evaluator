import { Badge } from '@/components/ui/badge'
import { LeagueSettings, formatSettingsForDisplay } from '@/lib/settings'

interface ActiveSettingsProps {
  settings: LeagueSettings
}

export function ActiveSettings({ settings }: ActiveSettingsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Active Settings:</span>
      <Badge variant="secondary" className="font-mono text-xs">
        {formatSettingsForDisplay(settings)}
      </Badge>
    </div>
  )
}
