import React from 'react'
import clsx from 'clsx'
import styles from './StatRow.module.css'

export interface StatTileProps {
  icon?: React.ReactNode
  value: React.ReactNode
  label: string
  sublabel?: string
  className?: string
  iconBg?: string
  iconColor?: string
}

export function StatTile({
  icon,
  value,
  label,
  sublabel,
  className,
  iconBg,
  iconColor,
}: StatTileProps) {
  return (
    <div className={clsx(styles.statTile, className)}>
      {icon && (
        <div
          className={styles.iconBox}
          style={{
            ...(iconBg ? { backgroundColor: iconBg } : {}),
            ...(iconColor ? { color: iconColor } : {}),
          }}
        >
          {icon}
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
        {sublabel && <div className={styles.sublabel}>{sublabel}</div>}
      </div>
    </div>
  )
}
