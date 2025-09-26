import * as React from 'react'
import { cn } from '@/lib/utils'

interface SrOnlyProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

export function SrOnly({ className, children, ...props }: SrOnlyProps) {
  return (
    <span
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
