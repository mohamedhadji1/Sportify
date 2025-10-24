import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { stripeConfig } from "./config/stripeConfig"

export default function MockPayment() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paymentId = searchParams.get("paymentId")
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  // Card form state (prefilled with a common test card)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardExpiry, setCardExpiry] = useState('12/34')
  const [cardCvc, setCardCvc] = useState('123')
  const [cardName, setCardName] = useState('Test User')

  useEffect(() => {
    if (!paymentId) return
    // Try to fetch the payment record for display (best-effort)
    fetch(`/api/payments/${paymentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.payment) setPayment(data.payment)
      })
      .catch((err) => {
        // ignore errors, show minimal info
        console.warn("Could not fetch payment:", err)
      })
  }, [paymentId])

  async function completeMockPayment() {
    if (!paymentId) return setError("Missing paymentId")
    // Basic client-side card validation enforced in mock flow
    if (!isCardValid()) return setError('Please provide valid test card details')
    setLoading(true)
    setError(null)

    try {
      // Call the webhook endpoint on the payment service to mark it PAID (mock)
      const webhookBody = { providerChargeId: payment ? payment.providerChargeId : `mock_${paymentId}`, status: "PAID" }
      const resp = await fetch("/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookBody),
      })

      const json = await resp.json()
      if (!resp.ok) throw new Error(json.error || "Webhook failed")

      // optimistic UI update
      setDone(true)
      setPayment((prev) => (prev ? { ...prev, status: "PAID" } : prev))
      // show modal success
      openModal({ ok: true, title: 'Payment succeeded', message: 'Payment completed successfully.' })
    } catch (err) {
      console.error("Mock payment complete error:", err)
      const msg = err.message || String(err)
      setError(msg)
      setLoading(false)
      openModal({ ok: false, title: 'Payment failed', message: msg })
    }
  }

  // --- Modal state and helpers ---
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPayload, setModalPayload] = useState({ ok: false, title: '', message: '' })

  function openModal(payload) {
    setModalPayload(payload)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-success/10 text-success border-success/20"
      case "PENDING":
        return "bg-warning/10 text-warning border-warning/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case "PENDING":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  // --- Card validation helpers ---
  function luhnCheck(num) {
    const digits = num.replace(/\s+/g, '').split('').reverse().map((d) => parseInt(d, 10))
    let sum = 0
    for (let i = 0; i < digits.length; i++) {
      let digit = digits[i]
      if (i % 2 === 1) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
    }
    return sum % 10 === 0
  }

  function expiryValid(exp) {
    // expect MM/YY
    const m = exp.split('/').map((s) => s.trim())
    if (m.length !== 2) return false
    const mm = parseInt(m[0], 10)
    const yy = parseInt(m[1], 10)
    if (!mm || !yy) return false
    if (mm < 1 || mm > 12) return false
    // build a Date at end of month
    const current = new Date()
    const fullYear = yy < 100 ? 2000 + yy : yy
    const expDate = new Date(fullYear, mm)
    return expDate > current
  }

  function cvcValid(cvc) {
    return /^[0-9]{3,4}$/.test(cvc)
  }

  function isCardValid() {
    return luhnCheck(cardNumber) && expiryValid(cardExpiry) && cvcValid(cardCvc) && cardName.trim().length > 1
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Payment Checkout</h1>
                <p className="text-sm text-muted-foreground">Development Environment</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span className="text-sm text-muted-foreground font-mono">MOCK</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Payment Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Details Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Payment Details</h2>
                  <p className="text-sm text-muted-foreground">Review your transaction information</p>
                </div>
                <div
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusColor(payment?.status || (done ? "PAID" : "PENDING"))}`}
                >
                  {getStatusIcon(payment?.status || (done ? "PAID" : "PENDING"))}
                  <span>{payment?.status || (done ? "PAID" : "PENDING")}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment ID</label>
                    <div className="mt-1 p-3 bg-muted rounded-lg">
                      <code className="text-sm font-mono text-foreground break-all">{paymentId || "Not provided"}</code>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Booking Reference</label>
                    <div className="mt-1 text-base font-medium text-foreground">{payment?.bookingId || "—"}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <div className="mt-1">
                      <span className="text-3xl font-bold text-foreground">{payment?.amount ?? 0}</span>
                      <span className="text-lg text-muted-foreground ml-2">{payment?.currency || "USD"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provider Charge ID</label>
                    <div className="mt-1 text-sm font-mono text-foreground">
                      {payment?.providerChargeId || `mock_${paymentId}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Complete Payment</h3>

              {/* Status Messages */}
              <div className="mb-6 min-h-[2rem]">
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <svg
                      className="w-5 h-5 text-destructive flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-destructive text-sm">{error}</span>
                  </div>
                )}

                {done && (
                  <div className="flex items-center space-x-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                    <svg
                      className="w-5 h-5 text-success flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-success text-sm font-medium">
                      Payment completed successfully — redirecting...
                    </span>
                  </div>
                )}
              </div>

              {/* Test Card Form (mock) */}
              <div className="mb-6 grid md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Cardholder Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-transparent"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />

                  <label className="text-sm font-medium text-muted-foreground">Card Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-transparent font-mono"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />

                  <div className="flex items-center gap-3">
                    <div className="w-1/2">
                      <label className="text-sm font-medium text-muted-foreground">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/34"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-transparent font-mono"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>

                    <div className="w-1/2">
                      <label className="text-sm font-medium text-muted-foreground">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-transparent font-mono"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg bg-muted">
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground">Card Preview</div>
                  </div>
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm opacity-80">{cardName || 'Cardholder'}</div>
                      <div className="text-xs opacity-80">VISA</div>
                    </div>
                    <div className="font-mono text-lg tracking-widest mb-2">{cardNumber || '•••• •••• •••• ••••'}</div>
                    <div className="flex justify-between text-sm opacity-90">
                      <div>EXP {cardExpiry || 'MM/YY'}</div>
                      <div>CVC {cardCvc ? '•'.repeat(Math.min(3, cardCvc.length)) : '•••'}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-muted-foreground">
                    Use the test card <span className="font-mono">4242 4242 4242 4242</span> with any future expiry and CVC for mock payments.
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 inline-flex items-center justify-center bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={completeMockPayment}
                  disabled={loading || !paymentId || done || !isCardValid()}
                >
                  {loading && (
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                  {loading ? "Processing Payment..." : done ? "Payment Completed" : "Complete Mock Payment"}
                </button>

                <button
                  className="px-6 py-3 border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Development Notice */}
            <div className={`border rounded-xl p-4 ${stripeConfig.isStripeAvailable() ? 'bg-blue/10 border-blue/20' : 'bg-warning/10 border-warning/20'}`}>
              <div className="flex items-start space-x-3">
                <svg
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${stripeConfig.isStripeAvailable() ? 'text-blue-400' : 'text-warning'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={stripeConfig.isStripeAvailable() ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"}
                  />
                </svg>
                <div>
                  <h4 className={`font-medium mb-1 ${stripeConfig.isStripeAvailable() ? 'text-blue-400' : 'text-warning'}`}>
                    {stripeConfig.isStripeAvailable() ? 'Stripe Test Mode' : 'Mock Payment Mode'}
                  </h4>
                  <p className={`text-sm ${stripeConfig.isStripeAvailable() ? 'text-blue-300/80' : 'text-warning/80'}`}>
                    {stripeConfig.isStripeAvailable() 
                      ? 'Using Stripe test environment. Use test card numbers for payments.'
                      : 'This is a mock payment interface for testing purposes. No real transactions will be processed.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Flow */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-4">Payment Flow</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm text-muted-foreground">Payment initiated</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-sm text-muted-foreground">Process payment</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm text-muted-foreground">Redirect to success</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Secure Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    All test transactions are isolated and do not affect production systems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} aria-hidden="true"></div>
          <div className="bg-card border border-border rounded-lg p-6 z-10 w-11/12 max-w-md shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">{modalPayload.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{modalPayload.message}</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-border rounded hover:bg-muted"
                onClick={() => {
                  closeModal()
                }}
              >
                Close
              </button>
              {modalPayload.ok ? (
                <button
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                  onClick={() => {
                    closeModal()
                    navigate('/payments/success')
                  }}
                >
                  Go to Success
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
