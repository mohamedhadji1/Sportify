"use client"

import { useState } from "react"
import { NavLink } from "../ui/NavLink"
import { AuthModal } from "../ui/AuthModal"
import { ManagerSignIn } from "../auth/ManagerSignIn"
import { PlayerSignIn } from "../auth/PlayerSignIn"
import { ManagerSignUp } from "../auth/ManagerSignUp"
import { PlayerSignUp } from "../auth/PlayerSignUp"
import { Logo } from "../ui/Logo"

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

  return (
    <nav className="bg-gradient-to-r from-neutral-900 to-neutral-800 shadow-lg sticky top-0 z-50 py-3">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link, index) => (
              <NavLink
                key={index}
                href={link.href}
                className="relative text-white hover:text-sky-300 transition-colors duration-300 text-sm font-medium py-2
                after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-sky-400 after:left-0
                after:bottom-0 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Sign In Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-white hover:text-sky-300 transition-colors duration-300 font-medium text-sm px-4 py-2 rounded-md hover:bg-neutral-700/50"
              >
                Sign In
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-10 border border-neutral-700 animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowManagerSignIn(true)
                      setIsDropdownOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                  >
                    Sign In as Manager
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayerSignIn(true)
                      setIsDropdownOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                  >
                    Sign In as Player
                  </button>
                </div>
              )}
            </div>

            {/* Sign Up Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSignUpDropdownOpen(!isSignUpDropdownOpen)}
                className="bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-300 rounded-md px-4 py-2 text-sm font-medium shadow-lg hover:shadow-sky-500/20"
              >
                Sign Up
              </button>
              {isSignUpDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-10 border border-neutral-700 animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowManagerSignUp(true)
                      setIsSignUpDropdownOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                  >
                    Sign Up as Manager
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayerSignUp(true)
                      setIsSignUpDropdownOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                  >
                    Sign Up as Player
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center p-2 rounded-md hover:bg-neutral-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-6 flex flex-col items-end space-y-1.5">
                <span
                  className={`block h-0.5 bg-white transition-transform duration-300 ${isDropdownOpen ? "w-6 rotate-45 translate-y-2" : "w-6"}`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-opacity duration-300 ${isDropdownOpen ? "opacity-0" : "w-5"}`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-transform duration-300 ${isDropdownOpen ? "w-6 -rotate-45 -translate-y-2" : "w-4"}`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isDropdownOpen && (
          <div className="md:hidden mt-4 animate-slideDown">
            <div className="flex flex-col space-y-2 pb-3 border-b border-neutral-700">
              {navLinks.map((link, index) => (
                <NavLink
                  key={index}
                  href={link.href}
                  className="block px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex flex-col space-y-3 pt-3">
              <button
                onClick={() => {
                  setShowPlayerSignIn(true)
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-white hover:bg-neutral-700 rounded-md transition-colors duration-200"
              >
                Sign In as Player
              </button>
              <button
                onClick={() => {
                  setShowManagerSignIn(true)
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-white hover:bg-neutral-700 rounded-md transition-colors duration-200"
              >
                Sign In as Manager
              </button>
              <button
                onClick={() => {
                  setShowPlayerSignUp(true)
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors duration-200"
              >
                Sign Up as Player
              </button>
              <button
                onClick={() => {
                  setShowManagerSignUp(true)
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2 bg-sky-500/80 hover:bg-sky-600 text-white rounded-md transition-colors duration-200"
              >
                Sign Up as Manager
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modals */}
      <AuthModal isOpen={showManagerSignIn} onClose={() => setShowManagerSignIn(false)}>
        <ManagerSignIn
          onClose={() => setShowManagerSignIn(false)}
          onSwitchToPlayer={() => {
            setShowManagerSignIn(false)
            setShowPlayerSignIn(true)
          }}
          onSwitchToManagerSignUp={() => {
            setShowManagerSignIn(false)
            setShowManagerSignUp(true)
          }}
        />
      </AuthModal>

      <AuthModal isOpen={showPlayerSignIn} onClose={() => setShowPlayerSignIn(false)}>
        <PlayerSignIn
          onClose={() => setShowPlayerSignIn(false)}
          onSwitchToManager={() => {
            setShowPlayerSignIn(false)
            setShowManagerSignIn(true)
          }}
          onSwitchToPlayerSignUp={() => {
            setShowPlayerSignIn(false)
            setShowPlayerSignUp(true)
          }}
        />
      </AuthModal>

      <AuthModal isOpen={showManagerSignUp} onClose={() => setShowManagerSignUp(false)}>
        <ManagerSignUp
          onClose={() => setShowManagerSignUp(false)}
          onSwitchToManagerSignIn={() => {
            setShowManagerSignUp(false)
            setShowManagerSignIn(true)
          }}
        />
      </AuthModal>

      <AuthModal isOpen={showPlayerSignUp} onClose={() => setShowPlayerSignUp(false)}>
        <PlayerSignUp
          onClose={() => setShowPlayerSignUp(false)}
          onSwitchToPlayerSignIn={() => {
            setShowPlayerSignUp(false)
            setShowPlayerSignIn(true)
          }}
        />
      </AuthModal>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 500px; opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </nav>
  )
}

export default Navbar
