import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import { NavLink } from "../../shared/ui/components/NavLink"
import { AuthModal } from "../../shared/ui/components/AuthModal"
import { Logo } from "../../shared/ui/components/Logo"
import { Avatar } from "../../shared/ui/components/Avatar"
import NotificationBell from "../../components/NotificationBell"
import { getImageUrl, handleImageError } from "../../shared/utils/imageUtils"
import { useToast, ToastContainer } from "../../shared/ui/components/Toast"
import { initGlobalToast } from "../../shared/utils/toastUtils"

// Lazy load auth components to prevent reCAPTCHA from loading globally
const ManagerSignIn = lazy(() =>
  import("../../features/auth/components/ManagerSignIn").then((module) => ({ default: module.ManagerSignIn })),
)
const PlayerSignIn = lazy(() =>
  import("../../features/auth/components/PlayerSignIn").then((module) => ({ default: module.PlayerSignIn })),
)
const ManagerSignUp = lazy(() =>
  import("../../features/auth/components/ManagerSignUp").then((module) => ({ default: module.ManagerSignUp })),
)
const PlayerSignUp = lazy(() =>
  import("../../features/auth/components/PlayerSignUp").then((module) => ({ default: module.PlayerSignUp })),
)
const PlayerPasswordReset = lazy(() =>
  import("../../features/auth/components/PlayerPasswordReset").then((module) => ({
    default: module.PlayerPasswordReset,
  })),
)
const ManagerPasswordReset = lazy(() =>
  import("../../features/auth/components/ManagerPasswordReset").then((module) => ({
    default: module.ManagerPasswordReset,
  })),
)
const TwoFactorModal = lazy(() => import("../../features/auth/components/TwoFactorModal"))

export const Navbar = () => {
  const navigate = useNavigate()
  const navLinks = [
    { label: "Courts", href: "/courts" },
    { label: "Padel", href: "#padel" },
    { label: "Football", href: "#football" },
    { label: "Basketball", href: "#basketball" },
    { label: "Tennis", href: "#tennis" },
  ]

  // Initialize toast
  const toastMethods = useToast()
  const { toasts, removeToast } = toastMethods

  // Initialize global toast
  useEffect(() => {
    initGlobalToast(toastMethods)
  }, [toastMethods])

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isSignInDropdownOpen, setIsSignInDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false)
  const [showManagerSignIn, setShowManagerSignIn] = useState(false)
  const [showPlayerSignIn, setShowPlayerSignIn] = useState(false)
  const [isSignUpDropdownOpen, setIsSignUpDropdownOpen] = useState(false)
  const [showManagerSignUp, setShowManagerSignUp] = useState(false)
  const [showPlayerSignUp, setShowPlayerSignUp] = useState(false)
  const [showPlayerPasswordReset, setShowPlayerPasswordReset] = useState(false)
  const [showManagerPasswordReset, setShowManagerPasswordReset] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState("")
  const [userProfileImage, setUserProfileImage] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // 2FA related state
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFAData, setTwoFAData] = useState({
    email: "",
    tempToken: "",
    onSuccess: null,
  })

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUserName("")
    setUserProfileImage(null)
    setUserRole(null)
    window.location.href = "/"
  }, [])

  // Handle 2FA requirement
  const handle2FARequired = useCallback((email, tempToken, onSuccess) => {
    setTwoFAData({
      email,
      tempToken,
      onSuccess,
    })
    setShow2FAModal(true)
    setShowManagerSignIn(false)
    setShowPlayerSignIn(false)
  }, [])

  const fetchUserDetails = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const response = await fetch("/api/auth/profile", {
          headers: {
            "x-auth-token": token,
          },
        })
        if (response.ok) {
          const userData = await response.json()
          if (userData.success && userData.user) {
            const profileImage = userData.user.profileImage || null
            console.log("Profile image from backend:", profileImage)

            setUserName(userData.user.fullName || "User")
            setUserProfileImage(profileImage)
            setUserRole(userData.user.role || null)
            setIsAuthenticated(true)
            localStorage.setItem(
              "user",
              JSON.stringify({
                id: userData.user.id,
                _id: userData.user.id,
                fullName: userData.user.fullName,
                email: userData.user.email,
                role: userData.user.role,
                profileImage: profileImage,
              }),
            )
          } else {
            handleLogout()
          }
        } else {
          console.error("Failed to fetch user details, status:", response.status)
          handleLogout()
        }
      } catch (error) {
        console.error("Error fetching user details:", error)
        setIsAuthenticated(false)
        setUserName("")
        setUserProfileImage(null)
        setUserRole(null)
      }
    } else {
      setIsAuthenticated(false)
      setUserName("")
      setUserProfileImage(null)
      setUserRole(null)
    }
  }, [handleLogout])

  const loadUser = useCallback(() => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (token) {
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUserName(userData.fullName || "User")

          const profileImage = userData.profileImage || null
          console.log("Profile image from localStorage:", profileImage)

          setUserProfileImage(profileImage)
          setUserRole(userData.role || null)
          setIsAuthenticated(true)
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error)
          fetchUserDetails()
        }
      } else {
        fetchUserDetails()
      }
    } else {
      setIsAuthenticated(false)
      setUserName("")
      setUserProfileImage(null)
      setUserRole(null)
    }
  }, [fetchUserDetails])

  useEffect(() => {
    loadUser()

    window.addEventListener("authChange", loadUser)

    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setIsUserDropdownOpen(false)
        setIsSignInDropdownOpen(false)
        setIsSignUpDropdownOpen(false)
        setIsEquipmentDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("authChange", loadUser)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [loadUser])

  return (
    <>
      <nav className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-800 shadow-xl border-b border-neutral-700/50 sticky top-0 z-50 py-4 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-full max-w-7xl mx-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 min-w-0">
              <Logo />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2 xl:space-x-4 flex-1 justify-center min-w-0 mx-8">
              {navLinks.map((link, index) => {
                if (link.authRequired && !isAuthenticated) return null

                return (
                  <NavLink
                    key={index}
                    href={link.href}
                    className="relative text-white/90 hover:text-white transition-all duration-300 text-sm font-medium py-3 px-4 rounded-lg flex-shrink-0
                    hover:bg-white/5 hover:shadow-lg hover:shadow-sky-500/10
                    after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-sky-400 after:to-sky-300 after:left-1/2 after:-translate-x-1/2
                    after:bottom-1 after:transition-all after:duration-300 hover:after:w-3/4 whitespace-nowrap
                    border border-transparent hover:border-white/10"
                  >
                    {link.label}
                  </NavLink>
                )
              })}

              {/* Equipment Dropdown */}
              <div className="relative dropdown-container" style={{ zIndex: 50 }}>
                <button
                  onClick={() => {
                    setIsEquipmentDropdownOpen(!isEquipmentDropdownOpen)
                    setIsUserDropdownOpen(false)
                    setIsSignInDropdownOpen(false)
                    setIsSignUpDropdownOpen(false)
                    setIsMobileMenuOpen(false)
                  }}
                  className="relative text-white/90 hover:text-white transition-all duration-300 text-sm font-medium py-3 px-4 rounded-lg flex items-center
                  hover:bg-white/5 hover:shadow-lg hover:shadow-sky-500/10
                  after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-sky-400 after:to-sky-300 after:left-1/2 after:-translate-x-1/2
                  after:bottom-1 after:transition-all after:duration-300 hover:after:w-3/4 whitespace-nowrap
                  border border-transparent hover:border-white/10"
                >
                  Equipment
                  <svg
                    className="w-4 h-4 ml-2 transition-transform duration-300"
                    style={{ transform: isEquipmentDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isEquipmentDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-neutral-800/95 backdrop-blur-md rounded-xl shadow-2xl py-3 z-50 border border-neutral-600/50 animate-fadeIn overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 rounded-xl"></div>
                    <div className="relative">
                      <NavLink
                        href="/equipment"
                        className="flex items-center px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                        onClick={() => setIsEquipmentDropdownOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Products
                      </NavLink>
                      <NavLink
                        href="/equipment/submit"
                        className="flex items-center px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                        onClick={() => setIsEquipmentDropdownOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Sell Products
                      </NavLink>
                      <NavLink
                        href="/cart"
                        className="flex items-center px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                        onClick={() => setIsEquipmentDropdownOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8"
                          />
                        </svg>
                        My Cart
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3 flex-shrink-0 min-w-0">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {/* Notification Bell */}
                  <div className="relative">
                    <NotificationBell
                      user={{
                        fullName: userName,
                        email: JSON.parse(localStorage.getItem("user") || "{}").email || "",
                        role: userRole,
                        profileImage: userProfileImage,
                      }}
                    />
                  </div>

                  {/* Look for a team button - only for Players */}
                  {userRole === "Player" && (
                    <button
                      onClick={() => navigate("/browse-teams")}
                      className="text-white hover:text-sky-300 transition-all duration-300 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-sky-500/10 whitespace-nowrap bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 shadow-lg hover:shadow-sky-500/25 border border-sky-500/20"
                      title="Look for a team to join"
                    >
                      <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="hidden lg:inline">Find Team</span>
                      <span className="lg:hidden">Teams</span>
                    </button>
                  )}

                  <div className="relative dropdown-container" style={{ zIndex: 60 }}>
                    <button
                      onClick={() => {
                        console.log("User dropdown clicked, current state:", isUserDropdownOpen)
                        setIsUserDropdownOpen(!isUserDropdownOpen)
                        setIsSignInDropdownOpen(false)
                        setIsSignUpDropdownOpen(false)
                        setIsEquipmentDropdownOpen(false)
                        setIsMobileMenuOpen(false)
                      }}
                      className="text-white hover:text-sky-300 transition-all duration-300 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-white/5 flex items-center space-x-3 whitespace-nowrap min-w-0 border border-transparent hover:border-white/10 shadow-lg hover:shadow-sky-500/10"
                    >
                      <Avatar
                        src={userProfileImage ? getImageUrl(userProfileImage, "user") : null}
                        alt={userName}
                        size="sm"
                        className="flex-shrink-0 ring-2 ring-sky-400/20"
                        onError={(e) => {
                          console.log("Error loading desktop avatar image, using fallback", userProfileImage)
                          console.log("Attempted URL was:", e.target.src)
                          handleImageError(e, "user", userName)
                        }}
                      />
                      <div className="flex flex-col items-start min-w-0">
                        <span className="hidden xl:inline truncate text-xs text-sky-300 font-normal">Welcome back</span>
                        <span className="truncate max-w-[120px] font-medium">{userName}</span>
                      </div>
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isUserDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-neutral-800/95 backdrop-blur-md rounded-xl shadow-2xl py-3 z-[60] border border-neutral-600/50 overflow-hidden"
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          zIndex: 60,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 rounded-xl"></div>
                        <div className="relative">
                          {(userRole === "Admin" || userRole === "Manager") && (
                            <button
                              onClick={() => {
                                window.location.href = "/dashboard"
                                setIsUserDropdownOpen(false)
                              }}
                              className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                            >
                              <svg
                                className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                              Dashboard
                            </button>
                          )}
                          {userRole === "Player" && (
                            <>
                              <button
                                onClick={() => {
                                  window.location.href = "/profile"
                                  setIsUserDropdownOpen(false)
                                }}
                                className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                Profile
                              </button>
                              <button
                                onClick={() => {
                                  window.location.href = "/my-team"
                                  setIsUserDropdownOpen(false)
                                }}
                                className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                                My Team
                              </button>
                              <button
                                onClick={() => {
                                  window.location.href = "/my-bookings"
                                  setIsUserDropdownOpen(false)
                                }}
                                className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7"
                                  />
                                </svg>
                                My Bookings
                              </button>
                              <button
                                onClick={() => {
                                  window.location.href = "/my-complaints"
                                  setIsUserDropdownOpen(false)
                                }}
                                className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                My Complaints
                              </button>
                            </>
                          )}
                          <div className="border-t border-neutral-700/50 my-2"></div>
                          <button
                            onClick={() => {
                              window.location.href = "/account-settings"
                              setIsUserDropdownOpen(false)
                            }}
                            className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Account Settings
                          </button>
                          <button
                            onClick={() => {
                              handleLogout()
                              setIsUserDropdownOpen(false)
                            }}
                            className="flex items-center w-full text-left px-5 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-red-400 group-hover:text-red-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Sign In Dropdown */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => {
                        setIsSignInDropdownOpen(!isSignInDropdownOpen)
                        setIsSignUpDropdownOpen(false)
                        setIsUserDropdownOpen(false)
                        setIsEquipmentDropdownOpen(false)
                        setIsMobileMenuOpen(false)
                      }}
                      className="text-white/90 hover:text-white transition-all duration-300 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-white/5 whitespace-nowrap border border-transparent hover:border-white/10"
                    >
                      Sign In
                    </button>
                    {isSignInDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-neutral-800/95 backdrop-blur-md rounded-xl shadow-2xl py-3 z-[60] border border-neutral-600/50 animate-fadeIn overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 rounded-xl"></div>
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowManagerSignIn(true)
                              setIsSignInDropdownOpen(false)
                            }}
                            className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                              />
                            </svg>
                            Sign In as Manager
                          </button>
                          <button
                            onClick={() => {
                              setShowPlayerSignIn(true)
                              setIsSignInDropdownOpen(false)
                            }}
                            className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Sign In as Player
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sign Up Dropdown */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => {
                        setIsSignUpDropdownOpen(!isSignUpDropdownOpen)
                        setIsSignInDropdownOpen(false)
                        setIsUserDropdownOpen(false)
                        setIsEquipmentDropdownOpen(false)
                        setIsMobileMenuOpen(false)
                      }}
                      className="bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white transition-all duration-300 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg hover:shadow-sky-500/25 whitespace-nowrap border border-sky-500/20"
                    >
                      Sign Up
                    </button>
                    {isSignUpDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-neutral-800/95 backdrop-blur-md rounded-xl shadow-2xl py-3 z-[60] border border-neutral-600/50 animate-fadeIn overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 rounded-xl"></div>
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowManagerSignUp(true)
                              setIsSignUpDropdownOpen(false)
                            }}
                            className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                              />
                            </svg>
                            Sign Up as Manager
                          </button>
                          <button
                            onClick={() => {
                              setShowPlayerSignUp(true)
                              setIsSignUpDropdownOpen(false)
                            }}
                            className="flex items-center w-full text-left px-5 py-3 text-sm text-white/90 hover:text-white hover:bg-sky-500/10 transition-all duration-200 group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-sky-400 group-hover:text-sky-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Sign Up as Player
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex-shrink-0">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen)
                  setIsSignUpDropdownOpen(false)
                  setIsSignInDropdownOpen(false)
                  setIsUserDropdownOpen(false)
                  setIsEquipmentDropdownOpen(false)
                }}
                className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
                aria-label="Toggle menu"
              >
                <div className="w-6 flex flex-col items-end space-y-1.5">
                  <span
                    className={`block h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? "w-6 rotate-45 translate-y-2" : "w-6"}`}
                  ></span>
                  <span
                    className={`block h-0.5 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-0" : "w-5"}`}
                  ></span>
                  <span
                    className={`block h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? "w-6 -rotate-45 -translate-y-2" : "w-4"}`}
                  ></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-6 animate-slideDown max-w-full bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-4">
              <div className="flex flex-col space-y-1 pb-4 border-b border-neutral-700/50">
                {navLinks.map((link, index) => {
                  if (link.authRequired && !isAuthenticated) return null

                  return (
                    <NavLink
                      key={index}
                      href={link.href}
                      className="block px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200 border border-transparent hover:border-white/10"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  )
                })}

                {/* Equipment Section in Mobile Menu */}
                <div className="px-4 py-3 text-white">
                  <div className="mb-3 font-medium text-sky-400 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    Equipment
                  </div>
                  <div className="flex flex-col pl-4 space-y-2 border-l-2 border-sky-500/30">
                    <NavLink
                      href="/equipment"
                      className="flex items-center px-4 py-2.5 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/70 text-white/90 hover:text-white text-sm transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      View Products
                    </NavLink>
                    <NavLink
                      href="/equipment/submit"
                      className="flex items-center px-4 py-2.5 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/70 text-white/90 hover:text-white text-sm transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Sell Products
                    </NavLink>
                    <NavLink
                      href="/cart"
                      className="flex items-center px-4 py-2.5 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/70 text-white/90 hover:text-white text-sm transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8"
                        />
                      </svg>
                      My Cart
                    </NavLink>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 pt-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-3 bg-neutral-700/30 rounded-lg">
                      <Avatar
                        src={userProfileImage ? getImageUrl(userProfileImage, "user") : null}
                        alt={userName}
                        size="sm"
                        className="flex-shrink-0 ring-2 ring-sky-400/20"
                        onError={(e) => {
                          console.log("Error loading mobile avatar image, using fallback", userProfileImage)
                          console.log("Attempted URL was:", e.target.src)
                          handleImageError(e, "user", userName)
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-sky-300 font-normal">Welcome back</span>
                        <span className="text-white font-medium text-sm truncate">{userName}</span>
                      </div>
                    </div>
                    {(userRole === "Admin" || userRole === "Manager") && (
                      <button
                        onClick={() => {
                          window.location.href = "/dashboard"
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Dashboard
                      </button>
                    )}
                    {userRole === "Player" && (
                      <>
                        <button
                          onClick={() => {
                            window.location.href = "/profile"
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-sky-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = "/my-team"
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-sky-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          My Team
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = "/my-bookings"
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-sky-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7"
                            />
                          </svg>
                          My Bookings
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = "/my-complaints"
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-sky-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          My Complaints
                        </button>
                      </>
                    )}
                    <div className="border-t border-neutral-700/50 my-2"></div>
                    <button
                      onClick={() => {
                        window.location.href = "/account-settings"
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="text-sky-400 font-medium text-sm px-4 py-2">Sign In</div>
                      <button
                        onClick={() => {
                          setShowManagerSignIn(true)
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                          />
                        </svg>
                        Sign In as Manager
                      </button>
                      <button
                        onClick={() => {
                          setShowPlayerSignIn(true)
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-white/90 hover:text-white transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Sign In as Player
                      </button>
                    </div>
                    <div className="border-t border-neutral-700/50 my-3"></div>
                    <div className="space-y-2">
                      <div className="text-sky-400 font-medium text-sm px-4 py-2">Sign Up</div>
                      <button
                        onClick={() => {
                          setShowManagerSignUp(true)
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white transition-all duration-300 shadow-lg"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                          />
                        </svg>
                        Sign Up as Manager
                      </button>
                      <button
                        onClick={() => {
                          setShowPlayerSignUp(true)
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white transition-all duration-300 shadow-lg"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Sign Up as Player
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modals */}
      <AuthModal isOpen={showManagerSignIn} onClose={() => setShowManagerSignIn(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
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
            onSwitchToForgotPassword={() => {
              setShowManagerSignIn(false)
              setShowManagerPasswordReset(true)
            }}
            on2FARequired={handle2FARequired}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showPlayerSignIn} onClose={() => setShowPlayerSignIn(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
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
            onSwitchToPasswordReset={() => {
              setShowPlayerSignIn(false)
              setShowPlayerPasswordReset(true)
            }}
            on2FARequired={handle2FARequired}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showManagerSignUp} onClose={() => setShowManagerSignUp(false)} maxWidth="max-w-lg">
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <ManagerSignUp
            onClose={() => setShowManagerSignUp(false)}
            onSwitchToManagerSignIn={() => {
              setShowManagerSignUp(false)
              setShowManagerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showPlayerSignUp} onClose={() => setShowPlayerSignUp(false)} maxWidth="max-w-lg">
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <PlayerSignUp
            onClose={() => setShowPlayerSignUp(false)}
            onSwitchToPlayerSignIn={() => {
              setShowPlayerSignUp(false)
              setShowPlayerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showPlayerPasswordReset} onClose={() => setShowPlayerPasswordReset(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <PlayerPasswordReset
            onClose={() => setShowPlayerPasswordReset(false)}
            onSwitchToSignIn={() => {
              setShowPlayerPasswordReset(false)
              setShowPlayerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showManagerPasswordReset} onClose={() => setShowManagerPasswordReset(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <ManagerPasswordReset
            onClose={() => setShowManagerPasswordReset(false)}
            onSwitchToSignIn={() => {
              setShowManagerPasswordReset(false)
              setShowManagerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      {/* 2FA Modal */}
      <AuthModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <TwoFactorModal
            isVisible={show2FAModal}
            onClose={() => setShow2FAModal(false)}
            email={twoFAData.email}
            tempToken={twoFAData.tempToken}
            onVerifySuccess={(data) => {
              setShow2FAModal(false)
              if (twoFAData.onSuccess) {
                twoFAData.onSuccess(data)
              }
            }}
          />
        </Suspense>
      </AuthModal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}

export default Navbar
