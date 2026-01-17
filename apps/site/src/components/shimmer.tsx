'use client';

import { cn } from '@/lib/utils';
import type React from 'react';

import type { ReactNode } from 'react';

interface ShimmerProps {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  duration?: number;
}

export function Shimmer({
  children,
  shimmerColor = 'rgba(255,255,255,0.2)',
  className,
  duration = 1000,
}: ShimmerProps) {
  return (
    <div
      className={cn('relative overflow-hidden group transition', className)}
      style={
        {
          '--shimmer-color': shimmerColor,
          '--shimmer-duration': `${duration}ms`,
        } as React.CSSProperties
      }
    >
      {children}
      <div
        className='absolute inset-0 opacity-0 -translate-x-full
          bg-linear-to-r from-transparent via-(--shimmer-color) to-transparent
          group-hover:translate-x-full group-hover:opacity-100 transition-transform ease-in-out
          pointer-events-none'
        style={{
          transitionDuration: 'var(--shimmer-duration)',
        }}
      />
    </div>
  );
}
