import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Crown, Gem, Star, Zap, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'

const ICONS = { free: ShieldCheck, pro: Zap, premium: Star, ultra: Crown }
const GRADIENTS = { free: 'from-gray-400 to-gray-500', pro: 'from-amber-500 to-orange-600', premium: 'from-purple-500 to-pink-600', ultra: 'from-pink-500 to-rose-600' }
const NAMES = { free: 'Free', pro: 'Pro', premium: 'Premium', ultra: 'Ultra Premium' }

export default function UpgradeConfirmModal({ isOpen, onClose, onConfirm, currentPlan, newPlan, price, isLoading }) {
 const CurrentIcon = ICONS[currentPlan] || ShieldCheck
 const NewIcon = ICONS[newPlan] || Crown

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
 <div className="px-6 pt-6 pb-2 text-center">
 <Dialog.Title className="text-lg font-bold text-text-primary">
 {currentPlan === 'free' ? 'Upgrade Plan' : 'Switch Plan'}
 </Dialog.Title>
 <p className="text-sm text-text-muted mt-1">
 {currentPlan === 'free' ? 'Choose a plan that works for you' : 'Move to a plan with more power'}
 </p>
 </div>

 <div className="px-6 py-5">
 <div className="flex items-center justify-between gap-4">
 <div className="flex flex-col items-center gap-2 flex-1">
 <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADIENTS[currentPlan]} flex items-center justify-center shadow-md`}>
 <CurrentIcon className="w-6 h-6 text-white" />
 </div>
 <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{NAMES[currentPlan]}</span>
 {currentPlan !== 'free' && <span className="text-xs text-text-muted">Current</span>}
 </div>

 <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex-shrink-0">
 <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
 </div>

 <div className="flex flex-col items-center gap-2 flex-1">
 <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADIENTS[newPlan]} flex items-center justify-center shadow-md ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-indigo-500/40`}>
 <NewIcon className="w-6 h-6 text-white" />
 </div>
 <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{NAMES[newPlan]}</span>
 <span className="text-xs text-indigo-500 font-medium">Selected</span>
 </div>
 </div>

 <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-700/30">
 <div className="flex justify-between items-center">
 <span className="text-sm text-text-muted">Plan Price</span>
 <span className="text-2xl font-black text-text-primary">₹{price}</span>
 </div>
 <div className="flex justify-between items-center mt-1">
 <span className="text-xs text-text-muted">Billed monthly</span>
 <span className="text-xs text-green-600 dark:text-green-400 font-medium">No hidden fees</span>
 </div>
 </div>

 {currentPlan !== 'free' && (
 <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 flex items-start gap-2">
 <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
 <p className="text-xs text-amber-700 dark:text-amber-300">
 Switching now will replace your current plan immediately. Remaining value from your current plan will be applied as a credit.
 </p>
 </div>
 )}
 </div>

 <div className="px-6 py-4 border-t border-border-default flex gap-3">
 <button
 onClick={onClose}
 disabled={isLoading}
 className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-bg-elevated hover:bg-bg-overlay text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={onConfirm}
 disabled={isLoading}
 className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
 >
 {isLoading ? (
 <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
 ) : (
 <>{currentPlan === 'free' ? 'Continue to Payment' : 'Switch & Pay'} <ArrowRight className="w-4 h-4" /></>
 )}
 </button>
 </div>
 </Dialog.Panel>
 </Transition.Child>
 </div>
 </div>
 </Dialog>
 </Transition>
 )
}