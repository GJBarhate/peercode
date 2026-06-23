import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle, ArrowLeft, CalendarDays, Crown, Gem, IndianRupee, Star, Zap, CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import { getCancelInfo, cancelSubscription } from '../../services/api'
import toast from 'react-hot-toast'

const PLAN_ICONS = { free: ShieldCheck, pro: Zap, premium: Star, ultra: Crown }
const PLAN_GRADIENTS = { pro: 'from-amber-500 to-orange-600', premium: 'from-purple-500 to-pink-600', ultra: 'from-pink-500 to-rose-600' }
const PLAN_NAMES = { free: 'Free', pro: 'Pro', premium: 'Premium', ultra: 'Ultra Premium' }

export default function CancelSubscriptionModal({ isOpen, onClose, onCancelled }) {
 const [step, setStep] = useState('loading')
 const [info, setInfo] = useState(null)
 const [errorMsg, setErrorMsg] = useState(null)
 const [cancelling, setCancelling] = useState(false)

 useEffect(() => {
 if (!isOpen) return

 async function load() {
 setStep('loading')
 setErrorMsg(null)
 try {
 const { data } = await getCancelInfo()
 setInfo(data.data)
 setStep('info')
 } catch (err) {
 setStep('error')
 setErrorMsg(err.response?.data?.message || 'Failed to load cancellation info')
 }
 }

 load()
 }, [isOpen])

 const handleCancel = async () => {
 setCancelling(true)
 try {
 await cancelSubscription(false)
 toast.success('Subscription cancelled')
 setStep('success')
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to cancel')
 setCancelling(false)
 }
 }

 const Icon = PLAN_ICONS[info?.plan] || Crown
 const gradient = PLAN_GRADIENTS[info?.plan] || 'from-indigo-500 to-purple-600'

 return (
 <Transition appear show={isOpen} as={Fragment}>
 <Dialog as="div" className="relative z-50" onClose={onClose}>
 <Transition.Child
 as={Fragment}
 enter="ease-out duration-200"
 enterFrom="opacity-0"
 enterTo="opacity-100"
 leave="ease-in duration-150"
 leaveFrom="opacity-100"
 leaveTo="opacity-0"
 >
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
 </Transition.Child>

 <div className="fixed inset-0 overflow-y-auto">
 <div className="flex min-h-full items-center justify-center p-4">
 <Transition.Child
 as={Fragment}
 enter="ease-out duration-300"
 enterFrom="opacity-0 scale-90"
 enterTo="opacity-100 scale-100"
 leave="ease-in duration-200"
 leaveFrom="opacity-100 scale-100"
 leaveTo="opacity-0 scale-90"
 >
 <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-bg-surface border border-border-default shadow-2xl transition-all">
 {step === 'loading' && (
 <div className="px-6 py-12 text-center space-y-4">
 <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
 <Loader2 className="w-7 h-7 text-white animate-spin" />
 </div>
 <Dialog.Title className="text-lg font-bold text-text-primary">
 Loading Details...
 </Dialog.Title>
 </div>
 )}

 {step === 'info' && info && (
 <>
 <div className="px-6 pt-6 pb-4 border-b border-border-default">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
 <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
 </div>
 <Dialog.Title className="text-lg font-bold text-text-primary">
 Cancel {PLAN_NAMES[info.plan]} Plan
 </Dialog.Title>
 </div>
 </div>

 <div className="px-6 py-4 space-y-4">
 <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-700/30">
 <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
 <Icon className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="font-semibold text-text-primary">{PLAN_NAMES[info.plan]}</p>
 <p className="text-xs text-text-muted">₹{info.planPrice}/month</p>
 </div>
 </div>

 <div className="space-y-3">
 <p className="text-sm font-medium text-text-secondary">Refund Summary</p>

 <div className="space-y-2.5">
 <div className="flex justify-between text-sm">
 <span className="text-text-muted">Plan Price</span>
 <span className="font-semibold text-text-primary">₹{info.planPrice}</span>
 </div>

 <div className="flex justify-between text-sm">
 <span className="text-text-muted">Days Used</span>
 <span className="font-semibold text-text-primary">
 {info.daysUsed} / {info.daysInPeriod} days
 </span>
 </div>

 <div className="flex justify-between text-sm">
 <span className="text-text-muted">Amount Consumed</span>
 <span className="font-semibold text-red-600 dark:text-red-400">-₹{info.usedAmount}</span>
 </div>

 <div className="pt-2 border-t border-border-default">
 <div className="flex justify-between text-sm">
 <span className="font-medium text-text-secondary">Refund Amount</span>
 <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{info.refundAmount}</span>
 </div>
 </div>
 </div>
 </div>

 {info.daysUsed >= info.daysInPeriod && (
 <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
 <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
 <p className="text-xs text-amber-700 dark:text-amber-300">
 Your billing period has ended. No refund will be issued.
 </p>
 </div>
 )}

 <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30">
 <IndianRupee className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
 <p className="text-xs text-blue-700 dark:text-blue-300">
 Refund of <strong>₹{info.refundAmount}</strong> will be processed within <strong>24 hours</strong> to your original payment method.
 </p>
 </div>
 </div>

 <div className="px-6 py-4 border-t border-border-default flex gap-3 justify-end">
 <button
 onClick={onClose}
 disabled={cancelling}
 className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-bg-elevated hover:bg-bg-overlay text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 Keep Plan
 </button>
 <button
 onClick={handleCancel}
 disabled={cancelling}
 className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
 >
 {cancelling ? (
 <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
 ) : (
 <><AlertTriangle className="w-4 h-4" /> Cancel Subscription</>
 )}
 </button>
 </div>
 </>
 )}

 {step === 'success' && (
 <div className="px-6 py-10 text-center space-y-4">
 <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center animate-bounce">
 <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
 </div>
 <Dialog.Title className="text-2xl font-bold text-text-primary">
 Cancelled Successfully
 </Dialog.Title>
 <p className="text-sm text-text-muted">
 Your {PLAN_NAMES[info?.plan]} plan has been cancelled. Refund of <strong className="text-text-primary">₹{info?.refundAmount}</strong> will be sent within 24 hours.
 </p>
 <div className="flex justify-center gap-1">
 {[0, 1, 2, 3, 4].map(i => (
 <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
 ))}
 </div>
 <button
 onClick={onCancelled}
 className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all shadow-lg shadow-indigo-500/20"
 >
 Go to Dashboard
 </button>
 </div>
 )}

 {step === 'error' && (
 <div className="px-6 py-10 text-center space-y-4">
 <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
 <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
 </div>
 <Dialog.Title className="text-xl font-bold text-text-primary">
 Something Went Wrong
 </Dialog.Title>
 <p className="text-sm text-text-muted">{errorMsg || 'Please try again later.'}</p>
 <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-bg-elevated hover:bg-bg-overlay text-text-secondary transition-colors">
 Close
 </button>
 </div>
 )}
 </Dialog.Panel>
 </Transition.Child>
 </div>
 </div>
 </Dialog>
 </Transition>
 )
}