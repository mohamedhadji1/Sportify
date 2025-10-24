import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const sessionId = searchParams.get('session_id')
  const paymentId = searchParams.get('payment_id')

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (paymentId) {
        try {
          const response = await fetch(`/api/payments/${paymentId}`)
          const data = await response.json()
          if (response.ok && data.payment) {
            setPaymentDetails(data.payment)
          }
        } catch (error) {
          console.error('Error fetching payment details:', error)
        }
      }
      setLoading(false)
    }

    fetchPaymentDetails()

    // Auto redirect timer
    const t = setTimeout(() => navigate('/my-bookings'), 5000)
    return () => clearTimeout(t)
  }, [navigate, paymentId])

  const isStripePayment = sessionId && sessionId.startsWith('cs_')
  const isMockPayment = !isStripePayment

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Successful!</h1>
        
        <p className="text-sm text-muted-foreground mb-6">
          {isStripePayment 
            ? "Your payment has been processed securely by Stripe. You will receive a confirmation email shortly."
            : "Your payment was processed successfully. Thank you for your booking!"
          }
        </p>

        {/* Payment Details */}
        {!loading && paymentDetails && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-2">Payment Details</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{paymentDetails.amount} {paymentDetails.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-medium capitalize">
                  {isStripePayment ? 'Stripe' : 'Mock'} Payment
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-emerald-600">Confirmed</span>
              </div>
              {sessionId && (
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono text-xs">{sessionId.substring(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provider Badge */}
        <div className="flex justify-center mb-6">
          {isStripePayment ? (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
              <span>Secured by Stripe</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
              </svg>
              <span>Test Mode</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/my-bookings')} 
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            View My Bookings
          </button>
          <button 
            onClick={() => navigate('/courts')} 
            className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Book Another Court
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Redirecting to bookings in 5 seconds...
        </p>
      </div>
    </div>
  )
}
