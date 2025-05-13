"use client"

import { useState } from "react"

export const TextInput = ({ className = "", type = "text", error, icon, label, id, helpText, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)

  const baseInputClasses = `
    w-full px-4 py-3 text-sm sm:text-base
    bg-[#0a0a1a]/60 
    border border-[#2a2a40] rounded-lg text-white 
    placeholder:text-gray-500
    shadow-sm 
    focus:outline-none focus:ring-1 focus:border-[#3a3a60] 
    transition-all duration-300 ease-in-out 
    hover:border-[#3a3a60]
    disabled:cursor-not-allowed disabled:opacity-50
    ${icon ? "pl-10" : "pl-4"}
  `

  const errorClasses = error ? "border-red-500 focus:ring-red-500/30" : ""
  const focusClasses = isFocused && !error ? "border-[#4a4a80] focus:ring-[#4a4a80]/30" : ""

  return (
    <div className="relative space-y-2 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center group">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-gray-400 transition-colors duration-300">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`${baseInputClasses} ${errorClasses} ${focusClasses} ${className}`.trim()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      {helpText && !error && <p className="text-xs text-gray-400 mt-1 ml-1">{helpText}</p>}
      {error && <p className="text-xs text-red-400 mt-1 ml-1">{error}</p>}
    </div>
  )
}
