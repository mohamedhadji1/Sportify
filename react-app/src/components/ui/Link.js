export const Link = ({ href, children, className = "", size = "md", ...props }) => {
    const sizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    }
  
    return (
      <a
        href={href}
        className={`text-white hover:text-gray-300 transition-colors ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </a>
    )
  }
  