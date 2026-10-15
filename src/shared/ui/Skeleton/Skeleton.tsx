import React from 'react'
import clsx from 'clsx'
import styles from './Skeleton.module.css'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  variant?: 'rect' | 'circle' | 'pill'
}

export function Skeleton({
  width,
  height,
  variant = 'rect',
  className,
  style,
  ...rest
}: SkeletonProps) {
  const dynamicStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  }

  return (
    <div
      className={clsx(
        styles.skeleton,
        variant === 'circle' && styles.circle,
        variant === 'pill' && styles.pill,
        className
      )}
      style={dynamicStyle}
      aria-hidden="true"
      {...rest}
    />
  )
}
