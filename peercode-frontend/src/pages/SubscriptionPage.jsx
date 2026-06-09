import { useEffect, useState, useCallback } from 'react'
import { Check, Crown, Gem, Shield, ArrowLeft, Sparkles, Star, TrendingUp, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Skeleton from '../components/common/Skeleton'
import SubscriptionModal from '../components/subscription/SubscriptionModal'
import CancelSubscriptionModal from '../components/subscription/CancelSubscriptionModal'
import UpgradeConfirmModal from '../components/subscription/UpgradeConfirmModal'
import { getPlans, createSubscription, getSubscriptionStatus, getProfile } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, popular: false, gradient: 'from-gray-600 to-gray-500',
    color: 'gray', icon: Shield,
    features: ['30 AI hints/month', '30 AI analyzes/month', 'Shared API pool', 'Basic analytics', 'Streak tracking'],
    limit: '30'
  },
  {
    id: 'pro', name: 'Pro', price: 99, originalPrice: 199, popular: true, gradient: 'from-amber-500 to-orange-600',
    color: 'amber', icon: Zap,
    features: ['70 AI hints/month (30+40 bonus)', '70 AI analyzes/month', 'Priority email support', 'No ads', 'Advanced analytics', 'Custom tags', 'Faster AI responses'],
    badge: 'Most Popular', limit: '70'
  },
  {
    id: 'premium', name: 'Premium', price: 299, originalPrice: 499, popular: false, gradient: 'from-purple-500 to-pink-600',
    color: 'purple', icon: Star,
    features: ['180 AI hints/month (30+150 bonus)', '180 AI analyzes/month', 'Priority support', 'No ads', 'Advanced analytics', 'Session replay & export', 'Custom problem tags', 'Dedicated AI models'],
    badge: 'Best Value', limit: '180'
  },
  {
    id: 'ultra', name: 'Ultra Premium', price: 999, popular: false, gradient: 'from-pink-500 to-rose-600',
    color: 'pink', icon: Crown,
    features: ['Unlimited AI hints', 'Unlimited AI analyzes', '24/7 Priority support', 'No ads', 'Everything in Premium', 'Custom AI models', 'API access', 'Dedicated support channel', 'Early feature access'],
    badge: 'Unlimited', limit: '∞'
  }
]

function UsageDisplay({ used, limit }) {
  const pct = limit === Infinity ? 100 : Math.min(100, (used / limit) * 100)
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1">
      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function SubscriptionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState(PLANS)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(null)
  const [upgradePlan, setUpgradePlan] = useState(null)
  const [billing, setBilling] = useState('monthly')
  const [paymentModalPlan, setPaymentModalPlan] = useState(null)
  const [paymentOrderData, setPaymentOrderData] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const load = useCallback(async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([getPlans(), getSubscriptionStatus()])
      if (plansRes.data?.data?.plans) {
        setPlans(plansRes.data.data.plans.map((p, i) => ({ ...PLANS[i], ...p })))
      }
      setStatus(statusRes.data?.data || { plan: 'free', status: 'active' })
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const currentPlan = status?.plan || 'free'

  const handleSubscribe = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return
    setSubscribing(planId)
    try {
      const res = await createSubscription(planId)
      const orderData = res.data.data
      const plan = PLANS.find(p => p.id === planId)
      setPaymentOrderData({ ...orderData, userName: user?.username, userEmail: user?.email })
      setPaymentModalPlan(plan)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally {
      setSubscribing(null)
      setUpgradePlan(null)
    }
  }

  const handlePaymentSuccess = async () => {
    setPaymentModalPlan(null)
    setPaymentOrderData(null)
    await load()
    navigate('/dashboard')
  }

  const handleCancelSuccess = async () => {
    setShowCancelModal(false)
    await load()
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <Skeleton className="h-12 w-72 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-[500px]" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-100/50 dark:from-indigo-950/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-powered interview prep
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-gray-100 mb-4">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Power Plan
              </span>
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Start free, upgrade anytime. Add your own Gemini API key for unlimited usage on any plan.
            </p>
          </div>

          {/* Current Plan Banner */}
          {currentPlan !== 'free' && (
            <div className="max-w-3xl mx-auto mb-10">
              <div className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-300/30 dark:border-indigo-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {(PLANS.find(p => p.id === currentPlan)?.name || currentPlan)} Plan Active
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {status.cancelAtPeriodEnd 
                        ? 'Cancels at period end' 
                        : status.currentPeriodEnd 
                          ? `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : 'Active'}
                    </p>
                  </div>
                  <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 rounded-lg border border-red-300/50 dark:border-red-800/50 text-red-500 dark:text-red-400 hover:bg-red-100/30 dark:hover:bg-red-900/30 text-sm font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'yearly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              >
                Yearly
                <span className="ml-1.5 text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id
              const isPopular = plan.popular
              const Icon = plan.icon
              const yearlyPrice = Math.round(plan.price * 12 * 0.8)

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                    isCurrent 
                      ? 'border-indigo-500 bg-gradient-to-b from-indigo-900/30 to-white dark:to-gray-900 shadow-xl shadow-indigo-500/10'
                      : isPopular
                        ? 'border-amber-500/50 bg-gradient-to-b from-amber-900/10 to-white dark:to-gray-900 shadow-lg'
                        : 'border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  {/* Badges */}
                  {isPopular && !isCurrent && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                        <Sparkles className="w-3 h-3" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg">
                      Current Plan
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                        {plan.limit && <p className="text-xs text-gray-500">Up to {plan.limit} hints</p>}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-gray-900 dark:text-gray-100">
                          ₹{billing === 'yearly' ? yearlyPrice : plan.price}
                        </span>
                        <span className="text-gray-500">/{billing === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                      {billing === 'yearly' && plan.price > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">₹{plan.price}/mo billed annually (save 20%)</p>
                      )}
                      {plan.originalPrice && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600 line-through">₹{billing === 'yearly' ? Math.round(plan.originalPrice * 12 * 0.8) : plan.originalPrice}</span>
                          <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Save {Math.round((1 - plan.price / plan.originalPrice) * 100)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            plan.id === 'pro' ? 'text-amber-400' : 
                            plan.id === 'premium' ? 'text-purple-400' :
                            plan.id === 'ultra' ? 'text-pink-400' : 'text-gray-500'
                          }`} />
                          <span className="text-gray-700 dark:text-gray-300">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Usage Bar for current plan */}
                    {isCurrent && status?.usage && (
                      <div className="mb-4 p-3 bg-gray-900/5 dark:bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Your Usage</p>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Hints</span>
                              <span className="text-gray-700 dark:text-gray-300">{status.usage.hints.used}/{status.usage.hints.limit === Infinity ? '∞' : status.usage.hints.limit}</span>
                            </div>
                            <UsageDisplay used={status.usage.hints.used} limit={status.usage.hints.limit} />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Analyzes</span>
                              <span className="text-gray-700 dark:text-gray-300">{status.usage.analyzes.used}/{status.usage.analyzes.limit === Infinity ? '∞' : status.usage.analyzes.limit}</span>
                            </div>
                            <UsageDisplay used={status.usage.analyzes.used} limit={status.usage.analyzes.limit} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    {plan.id === 'free' ? (
                      <Link to="/profile" className="block w-full py-3.5 rounded-xl text-center text-sm font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 transition-colors">
                        Free - Always
                      </Link>
                    ) : isCurrent ? (
                      <div className="w-full py-3.5 rounded-xl text-center text-sm font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Active Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => setUpgradePlan(plan.id)}
                        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 group ${
                          isPopular
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        {currentPlan === 'free' ? (
                          <>Get {plan.name} <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-0.5 transition-transform" /></>
                        ) : (
                          <>Switch to {plan.name.split(' ')[0]}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* API Key Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-100/30 to-purple-100/30 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-300/30 dark:border-indigo-800/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <Gem className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Use Your Own API Key — Unlimited for Free
              </h2>
              <p className="text-gray-500 mb-6 max-w-xl mx-auto">
                Add your personal Google Gemini API key and get unlimited hints & analyzes on ANY plan. 
                Your key is stored locally and used only for your requests.
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40"
              >
                <Zap className="w-5 h-5" />
                Add API Key in Settings
              </Link>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-4 px-4 text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                    {plans.map(p => (
                      <th key={p.id} className="text-center py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Hints per month', 'Analyzes per month', 'API pool', 'Support', 'Advanced analytics', 'Session export', 'Custom AI', 'API access'].map((feat, i) => {
                    const values = {
                      'Hints per month': ['30', '70', '180', '∞'],
                      'Analyzes per month': ['30', '70', '180', '∞'],
                      'API pool': ['Shared', 'Priority', 'Priority', 'Dedicated'],
                      'Support': ['Community', 'Email', 'Priority', '24/7'],
                      'Advanced analytics': ['—', '✓', '✓', '✓'],
                      'Session export': ['—', '—', '✓', '✓'],
                      'Custom AI': ['—', '—', '—', '✓'],
                      'API access': ['—', '—', '—', '✓'],
                    }
                    return (
                      <tr key={feat} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-medium">{feat}</td>
                        {values[feat].map((v, j) => (
                          <td key={j} className={`text-center py-3.5 px-4 ${
                            v === '✓' ? 'text-green-600 dark:text-green-400' : v === '∞' ? 'text-pink-400 font-bold' : 'text-gray-500'
                          }`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription anytime. It remains active until the end of the billing period.' },
                { q: 'What if I use my own API key?', a: 'If you add your personal Gemini API key, you get unlimited hints and analyzes on any plan — including Free. Your own API key is used instead of our shared pool.' },
                { q: 'How do payments work?', a: 'We use Razorpay for secure payment processing. All major UPI, cards, and net banking are supported.' },
                { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade anytime. Changes apply immediately for upgrades, and at period end for downgrades.' },
              ].map((faq, i) => (
                <details key={i} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer text-gray-800 dark:text-gray-200 font-medium hover:bg-white/[0.02] transition-colors">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="px-4 pb-4 text-sm text-gray-500">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </main>
      </div>

      <UpgradeConfirmModal
        isOpen={!!upgradePlan}
        onClose={() => setUpgradePlan(null)}
        onConfirm={() => handleSubscribe(upgradePlan)}
        currentPlan={currentPlan}
        newPlan={upgradePlan}
        price={billing === 'yearly' ? Math.round((PLANS.find(p => p.id === upgradePlan)?.price || 0) * 12 * 0.8) : (PLANS.find(p => p.id === upgradePlan)?.price || 0)}
        isLoading={subscribing === upgradePlan}
      />

      <SubscriptionModal
        isOpen={!!paymentModalPlan && !!paymentOrderData}
        onClose={() => { setPaymentModalPlan(null); setPaymentOrderData(null) }}
        plan={paymentModalPlan}
        orderData={paymentOrderData}
        onSuccess={handlePaymentSuccess}
      />

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancelled={handleCancelSuccess}
      />
    </div>
  )
}

function ChevronDown({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}