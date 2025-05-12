import Logo from "../ui/Logo"
import NavLink from "../ui/NavLink"
import Button from "../ui/Button"

const Navbar = () => {
  const navLinks = [
    { label: "Padel", href: "#padel" },
    { label: "Football", href: "#football" },
    { label: "Basketball", href: "#basketball" },
    { label: "Tennis", href: "#tennis" },
  ]

  return (
    <nav className="bg-black py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Logo />

        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <NavLink key={link.label} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex space-x-4">
          <Button variant="ghost">Sign In</Button>
          <Button variant="primary">Sign Up</Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
