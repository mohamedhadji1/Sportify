"use client"

import { useState } from "react"
import { Icons } from "./Icons"

export const TextInput = ({ className = "", type = "text", error, icon, label, id, helpText, helperText, showPasswordToggle = false, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Determine the actual input type based on showPasswordToggle
  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type

  const baseInputClasses = `
    w-full px-4 py-3 text-sm sm:text-base
    bg-input
    border border-border rounded-lg text-foreground
    placeholder:text-muted-foreground
    shadow-sm
    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
    transition-all duration-300 ease-in-out
    hover:border-primary/70
    disabled:cursor-not-allowed disabled:opacity-50
    ${icon ? "pl-10" : "pl-4"}
    ${showPasswordToggle ? "pr-10" : "pr-4"}
  `

  const errorClasses = error ? "border-destructive focus:ring-destructive/30" : ""
  const focusClasses = isFocused && !error ? "border-ring focus:ring-ring/30" : ""

  return (
    <div className="relative space-y-2 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center group">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors duration-300">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          className={`${baseInputClasses} ${errorClasses} ${focusClasses} ${className}`.trim()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-300"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <Icons.EyeOff className="h-5 w-5" />
            ) : (
              <Icons.Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
  {(helpText || helperText) && !error && <p className="text-xs text-muted-foreground mt-1 ml-1">{helpText || helperText}</p>}
  {error && <p className="text-xs text-destructive mt-1 ml-1">{error}</p>}
    </div>
  )
}
