"use client"

import { useState } from "react"
import { Button } from "../ui/Button"
import { TextInput } from "../ui/TextInput"
import { Card } from "../ui/Card"
import { Link } from "../ui/Link"
import { Checkbox } from "../ui/Checkbox"
import { FileUpload } from "../ui/FileUpload"
import { ManagerSignIn } from "./ManagerSignIn"

export const ManagerSignUp = () => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [cin, setCin] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [attachment, setAttachment] = useState(null)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showManager, setShowManager] = useState(false)
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0])
    }
  }

  if (showManager) {
    return <ManagerSignIn />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!agreeToTerms) {
      alert("You must agree to the Terms of Service and Privacy Policy")
      return
    }

    if (!attachment) {
      alert("Please upload the required document")
      return
    }

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('email', email)
    formData.append('cin', cin)
    formData.append('phoneNumber', phoneNumber)
    formData.append('attachment', attachment)

    try {
      const response = await fetch('/api/auth/manager/signup', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        // Handle errors (e.g., display error message to user)
        console.error('Manager signup failed:', data);
        alert(data.msg || (data.errors && data.errors[0].msg) || 'Manager registration failed');
        return;
      }
      // Handle successful signup
      console.log('Manager registration successful:', data);
      alert('Manager account created successfully! You can now sign in.');
      setShowManager(true); // Or redirect to login page
    } catch (error) {
      console.error('Error during manager signup:', error);
      if (error.message === 'Failed to fetch') {
        alert('Could not connect to the server. Please check your internet connection and try again.');
      } else {
        alert('An error occurred during registration. Please try again.');
      }
    }
  }

  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="text-2xl font-bold mb-2">Create Manager Account</h1>
      <p className="text-gray-400 mb-6">Register to manage facilities and organize events</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="fullName" className="block mb-2">
            Full Name
          </label>
          <TextInput
            id="fullName"
            placeholder="John Smith"
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
            placeholder="manager@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="cin" className="block mb-2">
            CIN (ID Number)
          </label>
          <TextInput id="cin" placeholder="AB123456" value={cin} onChange={(e) => setCin(e.target.value)} required />
        </div>

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

        <div className="mb-4">
          <label htmlFor="attachment" className="block mb-2">
            Upload Document
          </label>
          <FileUpload id="attachment" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required />
          <p className="text-xs text-gray-500 mt-1">
            Please upload a verification document (ID, business license, etc.)
          </p>
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
          Create Manager Account
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-gray-400">
          Already have an account?{" "}
          <button
          onClick={() => setShowManager(true)}
          className="text-sm text-blue-500 hover:underline"
        >
          Sign in
        </button>
        </p>
      </div>
    </Card>
  )
}
