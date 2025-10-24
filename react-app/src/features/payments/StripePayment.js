import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"

/**
 * StripePayment Component
 * 
 * Handles real Stripe payment processing when Stripe is configured.
 * Shows a loading state while redirecting to Stripe Checkout.
 * Falls back to MockPayment if Stripe is not available.
 */
export default function StripePayment() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paymentId = searchParams.get("paymentId")
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payment, setPayment] = useState(null)

  useEffect(() => {
    if (!paymentId) {
      setError("Missing payment ID")
      setLoading(false)
      return
    }

    // If we have a session_id, this is a return from Stripe Checkout
    if (sessionId) {
      handleStripeReturn()
    } else {
      // This is the initial payment request
      fetchPaymentAndRedirect()
    }
  }, [paymentId, sessionId])

  const fetchPaymentAndRedirect = async () => {
    try {
      // Fetch payment details
      const response = await fetch(`/api/payments/${paymentId}`)
      const data = await response.json()
      
      if (!response.ok || !data.payment) {
        throw new Error("Payment not found")
      }

      setPayment(data.payment)

      // If this is a Stripe payment, redirect to the checkout URL
      if (data.payment.provider === 'stripe' && data.payment.providerChargeId) {
        // The session should already be created, redirect to success
        navigate(`/payments/success?session_id=${data.payment.providerChargeId}`)
      } else {
        // This is a mock payment, redirect to mock interface
        navigate(`/payments/mock?paymentId=${paymentId}`)
      }
    } catch (err) {
      console.error("Error fetching payment:", err)
      setError(err.message || "Failed to load payment")
      setLoading(false)
    }
  }

  const handleStripeReturn = async () => {
    try {
      // Verify the payment was successful with Stripe
      const response = await fetch(`/api/payments/${paymentId}`)
      const data = await response.json()
      
      if (response.ok && data.payment) {
        setPayment(data.payment)
        // Redirect to success page
        navigate(`/payments/success?session_id=${sessionId}&payment_id=${paymentId}`)
      } else {
        throw new Error("Payment verification failed")
      }
    } catch (err) {
      console.error("Error verifying Stripe payment:", err)
      setError("Payment verification failed")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          {/* Stripe Logo */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground mb-2">Processing Payment</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {sessionId ? "Verifying your payment..." : "Redirecting to secure checkout..."}
          </p>
          
          {/* Loading animation */}
          <div className="flex justify-center mb-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full"></div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Powered by Stripe - Secure Payment Processing
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Error</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => navigate('/my-bookings')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              View Bookings
            </button>
            <button 
              onClick={() => navigate('/courts')}
              className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted"
            >
              Browse Courts
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}