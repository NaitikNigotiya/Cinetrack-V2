import { forwardRef } from 'react'
import { Button, type ButtonProps } from './Button'

export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly' | 'leftIcon' | 'rightIcon'> {
  'aria-label': string
  icon: React.ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, 'aria-label': ariaLabel, ...rest },
  ref
) {
  return (
    <Button ref={ref} iconOnly aria-label={ariaLabel} {...rest}>
      {icon}
    </Button>
  )
})
