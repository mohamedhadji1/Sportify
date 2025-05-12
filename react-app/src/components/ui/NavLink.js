export const NavLink = ({ href, children }) => {
  return (
    <a href={href} className="text-white hover:text-gray-300 transition-colors">
      {children}
    </a>
  )
}
