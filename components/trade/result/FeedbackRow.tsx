"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface FeedbackRowProps {
  tradeId: string
  verdict: string
}

export function FeedbackRow({ tradeId, verdict }: FeedbackRowProps) {
  const handleFeedback = (value: 'fair' | 'off') => {
    console.info('[FEEDBACK]', { tradeId, value, verdict })
  }

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <span className="text-sm text-muted">Was this evaluation helpful?</span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('fair')}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Fair
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('off')}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          Off
        </Button>
      </div>
    </div>
  )
}
