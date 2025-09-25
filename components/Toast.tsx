"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose, duration])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-foreground">{message}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Hook for managing toast state
export function useToast() {
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({
    message: "",
    isVisible: false,
  })

  const showToast = (message: string) => {
    setToast({ message, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  return {
    toast,
    showToast,
    hideToast,
  }
}
