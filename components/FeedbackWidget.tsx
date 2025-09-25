"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { trackEvent } from '@/lib/analytics'

interface FeedbackWidgetProps {
  tradeSlug?: string
  settingsHash?: string
  className?: string
}

export function FeedbackWidget({ tradeSlug, settingsHash, className }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!sentiment) return

    setSubmitting(true)
    try {
      // Track feedback event
      await trackEvent('feedback_submit', {
        payloadHash: `${sentiment}-${feedback.length}`,
        durationMs: Date.now() - (window as any).feedbackStartTime
      })

      // In a real app, you'd send this to your feedback API
      console.log('Feedback submitted:', { sentiment, feedback, tradeSlug, settingsHash })

      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve the trade evaluator.",
      })

      // Reset form
      setSentiment(null)
      setFeedback('')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSentimentClick = (newSentiment: 'positive' | 'negative') => {
    if (!isOpen) {
      setIsOpen(true)
      ;(window as any).feedbackStartTime = Date.now()
    }
    setSentiment(newSentiment)
  }

  if (!isOpen) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSentimentClick('positive')}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Fair
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSentimentClick('negative')}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          Off
        </Button>
      </div>
    )
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={sentiment === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSentiment('positive')}
            className="gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            Fair
          </Button>
          <Button
            variant={sentiment === 'negative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSentiment('negative')}
            className="gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            Off
          </Button>
        </div>

        <div>
          <Textarea
            placeholder="Tell us more about your experience (optional)..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!sentiment || submitting}
            className="flex-1"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
