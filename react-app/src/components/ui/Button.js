export const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
  const baseClasses = "font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"

  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 focus:ring-white",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500",
    ghost: "bg-transparent text-white hover:bg-gray-800 focus:ring-gray-500",
    outline: "bg-transparent border border-white text-white hover:bg-gray-800 focus:ring-white",
  }

  const sizes = {
    sm: "py-1 px-3 text-sm",
    md: "py-2 px-4",
    lg: "py-3 px-6 text-lg",
  }

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
