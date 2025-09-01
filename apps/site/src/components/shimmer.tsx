'use client';

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
      className={`relative overflow-hidden group hover:brightness-110 transition ${className}`}
      style={
        {
          '--shimmer-color': shimmerColor,
          '--shimmer-duration': `${duration}ms`,
        } as React.CSSProperties
      }
    >
      {children}

      {/* Shimmer overlay */}
      <div
        className={`absolute inset-0 opacity-0 -translate-x-full
          bg-gradient-to-r from-transparent via-[var(--shimmer-color)] to-transparent
          group-hover:translate-x-full group-hover:opacity-100 brightness-125 transition-transform ease-in-out
          pointer-events-none`}
        style={{
          transitionDuration: 'var(--shimmer-duration)',
        }}
      />
    </div>
  );
}
