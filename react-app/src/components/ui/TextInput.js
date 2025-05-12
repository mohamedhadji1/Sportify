export const TextInput = ({ className = "", type = "text", ...props }) => {
    return (
      <input
        type={type}
        className={`w-full px-4 py-2 bg-black border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent ${className}`}
        {...props}
      />
    )
  }  