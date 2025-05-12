export const Card = ({ children, className = "" }) => {
    return <div className={`bg-gray-900 border border-gray-800 rounded-lg ${className}`}>{children}</div>
  }
  