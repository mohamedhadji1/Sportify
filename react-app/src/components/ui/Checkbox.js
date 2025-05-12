export const Checkbox = ({ id, label, className = "", ...props }) => {
    return (
      <div className={`flex items-start ${className}`}>
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4 mt-1 border border-gray-700 rounded bg-black focus:ring-2 focus:ring-white"
          {...props}
        />
        {label && (
          <label htmlFor={id} className="ml-2 block text-sm text-gray-300">
            {label}
          </label>
        )}
      </div>
    )
  }
  