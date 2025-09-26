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
    <div className="fixed top-4 right-4 z-50 theme-card p-4 max-w-sm" style={{pointerEvents: 'auto'}}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">{message}</p>
        <button
          onClick={onClose}
          className="h-6 w-6 p-0 btn-ghost focus-ring"
        >
          <X className="h-4 w-4" />
        </button>
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
