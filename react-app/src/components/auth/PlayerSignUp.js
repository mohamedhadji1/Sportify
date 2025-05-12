"use client"

import { useState } from "react"
import { Button } from "../ui/Button"
import { TextInput } from "../ui/TextInput"
import { Card } from "../ui/Card"
import { Link } from "../ui/Link"
import { Select } from "../ui/Select"
import { Checkbox } from "../ui/Checkbox"
import { PlayerSignIn } from "./PlayerSignIn"

export const PlayerSignUp = () => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [preferredSport, setPreferredSport] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [position, setPosition] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)

  const sportOptions = [
    { value: "", label: "Select your preferred sport" },
    { value: "padel", label: "Padel" },
    { value: "football", label: "Football" },
    { value: "basketball", label: "Basketball" },
    { value: "tennis", label: "Tennis" },
  ]

  const positionOptions = [
    { value: "", label: "Select your position" },
    { value: "goalkeeper", label: "Goalkeeper" },
    { value: "defender", label: "Defender" },
    { value: "midfielder", label: "Midfielder" },
    { value: "attacker", label: "Attacker" },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords don't match")
      return
    }

    if (!agreeToTerms) {
      alert("You must agree to the Terms of Service and Privacy Policy")
      return
    }

    const userData = {
      fullName,
      email,
      password,
      preferredSport,
      phoneNumber,
      ...(preferredSport === "football" && { position }),
    }

    console.log("Creating player account:", userData)
    // Handle sign up logic here
    fetch('/api/auth/player/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        // Handle errors (e.g., display error message to user)
        console.error('Signup failed:', data);
        alert(data.msg || (data.errors && data.errors[0].msg) || 'Signup failed');
        return;
      }
      // Handle successful signup (e.g., redirect to login or dashboard)
      console.log('Signup successful:', data);
      alert('Player account created successfully! Please sign in.');
      setShowPlayer(true); // Or redirect to login page
    })
    .catch(error => {
      console.error('Error during player signup:', error);
      alert('An error occurred during signup. Please try again.');
    });
  }
  if (showPlayer) {
    return <PlayerSignIn />
  }

  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="text-2xl font-bold mb-2">Create Player Account</h1>
      <p className="text-gray-400 mb-6">Register to book courts and join sports activities</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="fullName" className="block mb-2">
            Full Name
          </label>
          <TextInput
            id="fullName"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">
            Email
          </label>
          <TextInput
            id="email"
            type="email"
            placeholder="player@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">
            Password
          </label>
          <TextInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block mb-2">
            Confirm Password
          </label>
          <TextInput
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="preferredSport" className="block mb-2">
            Preferred Sport
          </label>
          <Select
            id="preferredSport"
            options={sportOptions}
            value={preferredSport}
            onChange={(e) => setPreferredSport(e.target.value)}
            required
          />
        </div>

        {preferredSport === "football" && (
          <div className="mb-4">
            <label htmlFor="position" className="block mb-2">
              Position
            </label>
            <Select
              id="position"
              options={positionOptions}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            />
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block mb-2">
            Phone Number
          </label>
          <TextInput
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <Checkbox
            id="agreeToTerms"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            label={
              <span className="text-sm">
                I agree to the{" "}
                <Link href="/terms" size="sm">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" size="sm">
                  Privacy Policy
                </Link>
              </span>
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            By checking this box, you agree to our{" "}
            <Link href="/terms" size="sm">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" size="sm">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <Button type="submit" variant="primary" className="w-full mb-4">
          Create Player Account
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => setShowPlayer(true)}
            className="text-sm text-blue-500 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </Card>
  )
}
