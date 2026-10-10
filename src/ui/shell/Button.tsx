import { forwardRef, type ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet'
  /** Square icon button; pass `aria-label` for its name. */
  iconOnly?: boolean
  /** Stretch to the container width. */
  block?: boolean
}

/** The one button family for the shell: pixel bezel, hard drop, ≥ 48 px target. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', iconOnly = false, block = false, className, type = 'button', ...rest },
  ref,
) {
  const classes = [
    styles.button,
    styles[variant],
    iconOnly && styles.iconOnly,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <button ref={ref} type={type} className={classes} {...rest} />
})
