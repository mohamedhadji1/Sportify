"use client"

import { useState } from "react"
import { Button } from "../ui/Button"
import { TextInput } from "../ui/TextInput"
import { Link } from "../ui/Link"
import { Icons } from "../ui/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"

export const ManagerSignIn = ({ onClose, onSwitchToPlayer, onSwitchToManagerSignUp }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email || !password) {
      setError("Email and password are required.")
      setIsLoading(false)
      return
    }

    try {
      // Mock API call for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Sign in attempt:", { email, password })
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role: "manager" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.msg || "Authentication failed")
      }

      const data = await response.json()
      console.log("Sign in successful:", data)
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role)
      if (onClose) onClose() // Close modal on success
    } catch (error) {
      console.error("Sign in error:", error)
      setError(error.message || "Sign in failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full z-20 transition-colors"
          onClick={onClose}
          aria-label="Close sign in form"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
      )}
      <div className="space-y-5 md:space-y-6">
        <AuthHeader title="Manager Sign In" subtitle="Access your facility management dashboard." />

        <AuthAlert type="error" message={error} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <TextInput
            id="email-manager"
            label="Email Address"
            type="email"
            placeholder="manager@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            icon={<Icons.Mail className="h-5 w-5" />}
          />
          <TextInput
            id="password-manager"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            icon={<Icons.Lock className="h-5 w-5" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-3 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a40]"></div>
            </div>
            <div className="relative bg-card px-4 text-xs text-gray-500 uppercase">or</div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-gray-400 text-sm">
              Not a manager?{" "}
              <Link
                onClick={onSwitchToPlayer}
                variant="primary"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in as Player
              </Link>
            </p>
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link
                onClick={onSwitchToManagerSignUp}
                variant="primary"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign up as Manager
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ManagerSignIn
