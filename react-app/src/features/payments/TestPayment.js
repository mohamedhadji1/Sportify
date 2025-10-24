import { useState } from 'react'

export default function TestPayment() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const testStripePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: '68d17d668146e2defae17ace',
          userId: '68adda94367315640a45a132',
          amount: 25,
          currency: 'USD',
          success_url: `${window.location.origin}/payments/success`,
          cancel_url: `${window.location.origin}/payments/cancel`
        })
      })

      const data = await response.json()
      
      if (response.ok && data.url) {
        setResult({ type: 'success', data })
        // Redirect to Stripe if it's a real Stripe URL
        if (data.url.includes('stripe.com')) {
          window.location.href = data.url
        }
      } else {
        setResult({ type: 'error', data })
      }
    } catch (error) {
      console.error('Payment test error:', error)
      setResult({ type: 'error', error: error.message })
    }
    setLoading(false)
  }

  const testMockPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: '68d17d668146e2defae17ace',
          userId: '68adda94367315640a45a132',
          amount: 25,
          currency: 'USD',
          success_url: `${window.location.origin}/payments/success`,
          cancel_url: `${window.location.origin}/payments/cancel`,
          force_mock: true
        })
      })

      const data = await response.json()
      setResult({ type: 'success', data })
      
      // Navigate to mock payment if it's a mock URL
      if (data.url && data.url.includes('/payments/mock')) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Mock payment test error:', error)
      setResult({ type: 'error', error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Test Payment Integration</h1>
        
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Payment System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testStripePayment}
              disabled={loading}
              className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
              )}
              Test Real Stripe Payment
            </button>

            <button
              onClick={testMockPayment}
              disabled={loading}
              className="flex items-center justify-center px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
                </svg>
              )}
              Test Mock Payment
            </button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${
              result.type === 'success' 
                ? 'bg-green-100 border border-green-300 text-green-800' 
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              <h3 className="font-semibold mb-2">
                {result.type === 'success' ? 'Success ✅' : 'Error ❌'}
              </h3>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Integration Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Stripe Integration</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                ✅ Active
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Mock Payment Fallback</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                ✅ Available
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Dual Mode Support</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                ✅ Configured
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Test amount: $25 USD | Booking ID: 68d17d668146e2defae17ace
          </p>
        </div>
      </div>
    </div>
  )
}