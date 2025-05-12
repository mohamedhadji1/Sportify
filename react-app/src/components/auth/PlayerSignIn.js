import { useState } from "react"
import { Button } from "../ui/Button"
import { TextInput } from "../ui/TextInput"
import { Card } from "../ui/Card"
import { ManagerSignIn } from "./ManagerSignIn"
import { PlayerSignUp } from "./PlayerSignUp"

export const PlayerSignIn = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showManager, setShowManager] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Live validation
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      const data = await response.json();
      console.log('Sign in successful:', data);
      // Store token and user role (e.g., in localStorage or context)
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      // Redirect based on role or to a general dashboard
      alert('Sign in successful! Role: ' + data.role);
      // Example: window.location.href = '/dashboard'; 
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMsg = error.response ? await error.response.json() : null;
      alert(errorMsg?.msg || errorMsg?.errors?.[0]?.msg || 'Sign in failed. Please check your credentials.');
    }
  }

  if (showManager) {
    return <ManagerSignIn />
  }

  if (showPlayer) {
    return <PlayerSignUp />
  }

  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="text-2xl font-bold mb-2">Player Sign In</h1>
      <p className="text-gray-400 mb-6">
        Enter your credentials to access your player account
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">
            Email
          </label>
          <TextInput
            id="email"
            type="email"
            placeholder="m.johnson@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password">Password</label>
            {/* This can stay if you want */}
          </div>
          <TextInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" variant="primary" className="w-full mb-4">
          Sign In as Player
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-gray-400 mb-2">
          Don't have a player account?{" "}
          <button
            onClick={() => setShowPlayer(true)}
            className="text-sm text-blue-500 hover:underline"
          >
            Sign up
          </button>
        </p>
        <button
          onClick={() => setShowManager(true)}
          className="text-sm text-blue-500 hover:underline"
        >
          Sign in as Manager instead
        </button>
      </div>
    </Card>
  )
}
