import { useState } from "react"
import { Button } from "../ui/Button"
import { TextInput } from "../ui/TextInput"
import { Link } from "../ui/Link"
import { Select } from "../ui/Select"
import { Checkbox } from "../ui/Checkbox"
import { Icons } from "../ui/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"

export const PlayerSignUp = ({ onClose, onSwitchToPlayerSignIn }) => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [preferredSport, setPreferredSport] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [position, setPosition] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const sportOptions = [
    { value: "", label: "Select preferred sport" },
    { value: "padel", label: "Padel" },
    { value: "football", label: "Football" },
    { value: "basketball", label: "Basketball" },
    { value: "tennis", label: "Tennis" },
  ]

  const positionOptions = [
    { value: "", label: "Select position (if applicable)" },
    { value: "goalkeeper", label: "Goalkeeper" },
    { value: "defender", label: "Defender" },
    { value: "midfielder", label: "Midfielder" },
    { value: "attacker", label: "Attacker" },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.")
      return
    }
    // Basic validation
    if (!fullName || !email || !password || !preferredSport || !phoneNumber) {
      setError("Please fill in all required fields.")
      return
    }

    setIsLoading(true)
    const userData = {
      fullName,
      email,
      password,
      preferredSport,
      phoneNumber,
      ...(preferredSport === "football" && { position }),
    }

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log("Creating player account:", userData)
      const response = await fetch("/api/auth/player/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.msg || (data.errors && data.errors[0].msg) || "Signup failed")
      }
      setSuccessMessage("Account created! You can now sign in.")
      if (onClose) onClose()
    } catch (error) {
      console.error("Error during player signup:", error)
      setError(error.message || "An error occurred during signup.")
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
          aria-label="Close sign up form"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
      )}
      <div className="space-y-5 md:space-y-6">
        <AuthHeader title="Player Sign Up" subtitle="Join us and start playing!" />

        <AuthAlert type="error" message={error} />
        <AuthAlert type="success" message={successMessage} />

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              id="fullName-player"
              label="Full Name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.User className="h-5 w-5" />}
            />
            <TextInput
              id="email-player-signup"
              label="Email Address"
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.Mail className="h-5 w-5" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextInput
                id="password-player-signup"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                icon={<Icons.Lock className="h-5 w-5" />}
              />
              <TextInput
                id="confirmPassword-player"
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                icon={<Icons.Lock className="h-5 w-5" />}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 w-full">
                <label htmlFor="preferredSport-player" className="block text-sm font-medium text-gray-300 mb-1">
                  Preferred Sport
                </label>
                <Select
                  id="preferredSport-player"
                  options={sportOptions}
                  value={preferredSport}
                  onChange={(e) => setPreferredSport(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-3 text-sm sm:text-base bg-[#0a0a1a]/60 border border-[#2a2a40] rounded-lg text-white shadow-sm focus:outline-none focus:ring-1 focus:border-[#3a3a60] transition-all duration-300 ease-in-out hover:border-[#3a3a60]"
                />
              </div>
              <TextInput
                id="phoneNumber-player"
                label="Phone Number"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
                required
                icon={<Icons.Phone className="h-5 w-5" />}
              />
            </div>

            {preferredSport === "football" && (
              <div className="space-y-2 w-full">
                <label htmlFor="position-player" className="block text-sm font-medium text-gray-300 mb-1">
                  Position (for Football)
                </label>
                <Select
                  id="position-player"
                  options={positionOptions}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={isLoading || preferredSport !== "football"}
                  className={`w-full px-4 py-3 text-sm sm:text-base bg-[#0a0a1a]/60 border border-[#2a2a40] rounded-lg text-white shadow-sm focus:outline-none focus:ring-1 focus:border-[#3a3a60] transition-all duration-300 ease-in-out hover:border-[#3a3a60] ${
                    preferredSport !== "football" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            )}

            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="terms-player"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={isLoading}
                className="mt-1"
              />
              <label htmlFor="terms-player" className="text-sm text-gray-300 select-none leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" variant="primary" className="font-medium text-blue-400 hover:text-blue-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" variant="primary" className="font-medium text-blue-400 hover:text-blue-300">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
              disabled={isLoading || !agreeToTerms}
            >
              {isLoading ? (
                <>
                  <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Player Account"
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link
              onClick={onSwitchToPlayerSignIn}
              variant="primary"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
