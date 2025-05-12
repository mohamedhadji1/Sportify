import { Logo } from "./ui/Logo"
import { NavLink } from "./ui/NavLink"
import { useState } from "react"
import { ManagerSignIn } from "./auth/ManagerSignIn"
import { PlayerSignIn } from "./auth/PlayerSignIn"
import { ManagerSignUp } from "./auth/ManagerSignUp"
import { PlayerSignUp } from "./auth/PlayerSignUp"

export const Navbar = () => {
  const navLinks = [
    { label: "Padel", href: "#padel" },
    { label: "Football", href: "#football" },
    { label: "Basketball", href: "#basketball" },
    { label: "Tennis", href: "#tennis" },
  ]
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showManagerSignIn, setShowManagerSignIn] = useState(false)
  const [showPlayerSignIn, setShowPlayerSignIn] = useState(false)
  const [isSignUpDropdownOpen, setIsSignUpDropdownOpen] = useState(false)
  const [showManagerSignUp, setShowManagerSignUp] = useState(false)
  const [showPlayerSignUp, setShowPlayerSignUp] = useState(false)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleSignUpDropdown = () => {
    setIsSignUpDropdownOpen(!isSignUpDropdownOpen)
  }

  const handleManagerSignIn = (e) => {
    e.preventDefault()
    setShowManagerSignIn(true)
    setShowPlayerSignIn(false)
    setIsDropdownOpen(false)
  }
  const handleManagerSignUp = (e) => {
    e.preventDefault()
    setShowManagerSignUp(true)
    setShowPlayerSignUp(false)
    setShowManagerSignIn(false)
    setShowPlayerSignIn(false)
    setIsSignUpDropdownOpen(false)
  }

  const handlePlayerSignUp = (e) => {
    e.preventDefault()
    setShowPlayerSignUp(true)
    setShowManagerSignUp(false)
    setShowManagerSignIn(false)
    setShowPlayerSignIn(false)
    setIsSignUpDropdownOpen(false)
  }
  const handlePlayerSignIn = (e) => {
    e.preventDefault()
    setShowPlayerSignIn(true)
    setShowManagerSignIn(false)
    setIsDropdownOpen(false)
  }

  const handleCloseSignIn = () => {
    setShowManagerSignIn(false)
    setShowPlayerSignIn(false)
  }

  const handleCloseModal = () => {
    setShowManagerSignUp(false)
    setShowPlayerSignUp(false)
  }

  return (
    <>
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

          <div className="flex space-x-4 items-center">
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="text-white hover:text-gray-300 px-4 py-2 rounded-md text-sm font-medium border border-white hover:border-gray-300"
              >
                Sign In
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 z-50 ring-1 ring-white ring-opacity-5">
                  <a
                    href="#manager"
                    onClick={handleManagerSignIn}
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    Sign in as Manager
                  </a>
                  <a
                    href="#player"
                    onClick={handlePlayerSignIn}
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    Sign in as Player
                  </a>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={toggleSignUpDropdown}
                className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium border border-black"
              >
                Sign Up
              </button>
              {isSignUpDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 z-50 ring-1 ring-white ring-opacity-5">
                  <a
                    href="#manager-signup"
                    onClick={handleManagerSignUp}
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    Sign up as Manager
                  </a>
                  <a
                    href="#player-signup"
                    onClick={handlePlayerSignUp}
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    Sign up as Player
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showManagerSignIn && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={handleCloseSignIn}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-xl"
            >
              ✕
            </button>
            <ManagerSignIn />
          </div>
        </div>
      )}

      {showPlayerSignIn && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="relative">
                  <button
                    onClick={handleCloseSignIn}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 text-xl"
                  >
                    ✕
                  </button>
                  <PlayerSignIn />
                </div>
              </div>
            )}
    {/* Modal for Manager Sign Up */}
    {showManagerSignUp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
          <div className="relative my-8">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-xl"
            >
              ✕
            </button>
            <ManagerSignUp />
          </div>
        </div>
      )}

      {/* Modal for Player Sign Up */}
      {showPlayerSignUp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
          <div className="relative my-8">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-xl"
            >
              ✕
            </button>
            <PlayerSignUp />
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar;