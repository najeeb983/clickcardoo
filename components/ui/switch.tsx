"use client"

import * as React from "react"

interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
  ...props
}: SwitchProps) {
  const [isChecked, setIsChecked] = React.useState(checked)

  React.useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleClick = () => {
    if (disabled) return
    
    const newValue = !isChecked
    setIsChecked(newValue)
    onCheckedChange?.(newValue)
  }

  return (
    <div
      role="switch"
      aria-checked={isChecked}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors 
        ${isChecked ? 'bg-blue-600' : 'bg-gray-300'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}`}
      {...props}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform 
          ${isChecked ? 'translate-x-5' : 'translate-x-1'}`}
        style={{ marginTop: '2px' }}
      />
    </div>
  )
}