import { Fragment, useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, ArrowRight, Crown, Gem, Star, AlertCircle } from 'lucide-react'
import { verifyPayment } from '../../services/api'

const PLAN_GRADIENTS = {
  pro: 'from-amber-500 to-orange-600',
  premium: 'from-purple-500 to-pink-600',
  ultra: 'from-pink-500 to-rose-600'
}

const PLAN_ICONS = { pro: Zap, premium: Star, ultra: Crown }

function Zap({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function SubscriptionModal({ isOpen, onClose, plan, orderData, onSuccess }) {
  const [step, setStep] = useState('loading')
  const [errorMsg, setErrorMsg] = useState(null)
  const razorpayRef = useRef(null)

  const gradient = PLAN_GRADIENTS[plan?.id] || 'from-indigo-500 to-purple-600'
  const Icon = PLAN_ICONS[plan?.id] || Gem

  useEffect(() => {
    if (!isOpen || !orderData || !plan) return

    async function initCheckout() {
      setStep('loading')
      setErrorMsg(null)

      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setStep('error')
        setErrorMsg('Failed to load Razorpay SDK. Please check your internet connection.')
        return
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: 'PeerCode',
        description: `${plan.name} Plan Subscription`,
        image: undefined,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.userName || '',
          email: orderData.userEmail || '',
        },
        theme: { color: '#6d4df2' },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            onClose()
          }
        },
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id
            })
            setStep('success')
          } catch (err) {
            setStep('error')
            setErrorMsg(err.response?.data?.message || 'Payment verification failed')
          }
        }
      }

      try {
        const rzp = new window.Razorpay(options)
        razorpayRef.current = rzp
        rzp.on('payment.failed', function () {
          setStep('error')
          setErrorMsg('Payment failed. Please try again.')
        })
        rzp.open()
      } catch (err) {
        console.error('Razorpay checkout error:', err)
        setStep('error')
        setErrorMsg(err.message || 'Failed to open payment window')
      }
    }

    initCheckout()

    return () => {
      if (razorpayRef.current) {
        try { razorpayRef.current.close() } catch (_) {}
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl transition-all">
        {step === 'loading' && (
          <div className="px-6 py-12 text-center space-y-4">
            <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Preparing {plan?.name} Plan
              </p>
              <p className="text-sm text-gray-500 mt-1">Opening Razorpay checkout...</p>
            </div>
            <Loader2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400 animate-spin mx-auto" />
          </div>
        )}

        {step === 'success' && (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Payment Successful!
              </p>
              <p className="text-gray-500 mt-1">
                Welcome to the <span className="font-semibold text-gray-900 dark:text-gray-100">{plan?.name}</span> plan
              </p>
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <button
              onClick={onSuccess}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all shadow-lg shadow-indigo-500/20"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Payment Failed
              </p>
              <p className="text-sm text-gray-500 mt-1">{errorMsg || 'Something went wrong.'}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}