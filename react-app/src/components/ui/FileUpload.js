import { useState } from "react"

export const FileUpload = ({ className = "", ...props }) => {
  const [fileName, setFileName] = useState("")

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name)
    }

    if (props.onChange) {
      props.onChange(e)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        <label className="w-full flex items-center px-4 py-2 bg-black border border-gray-700 rounded-md cursor-pointer hover:bg-gray-900 transition-colors">
          <span className="text-gray-400 truncate">{fileName || "Choose file..."}</span>
          <input type="file" className="hidden" onChange={handleChange} {...props} />
        </label>
      </div>
    </div>
  )
}
