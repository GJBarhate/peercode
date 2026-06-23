import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { LogOut, AlertCircle } from 'lucide-react'

export default function LogoutConfirmModal({ isOpen, onConfirm, onCancel, isLoading = false }) {
 return (
 <Transition appear show={isOpen} as={Fragment}>
 <Dialog as="div" className="relative z-50" onClose={onCancel}>
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
 enter="ease-out duration-200"
 enterFrom="opacity-0 scale-95"
 enterTo="opacity-100 scale-100"
 leave="ease-in duration-150"
 leaveFrom="opacity-100 scale-100"
 leaveTo="opacity-0 scale-95"
 >
 <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-bg-surface border border-border-default shadow-2xl transition-all">
 <div className="px-6 pt-6 pb-4 border-b border-border-default">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
 <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
 </div>
 <Dialog.Title className="text-lg font-bold text-text-primary">
 Sign Out?
 </Dialog.Title>
 </div>
 </div>

 <div className="px-6 py-4">
 <p className="text-sm text-text-muted">
 Are you sure you want to sign out? You'll need to log in again to access your account and continue practicing.
 </p>
 </div>

 <div className="px-6 py-4 border-t border-border-default flex gap-3 justify-end">
 <button
 onClick={onCancel}
 disabled={isLoading}
 className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-bg-elevated hover:bg-bg-overlay disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={onConfirm}
 disabled={isLoading}
 className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
 >
 {isLoading ? (
 <>
 <div className="w-4 h-4 border-2 border-red-200 border-t-white rounded-full animate-spin" />
 Signing Out...
 </>
 ) : (
 <>
 <LogOut className="w-4 h-4" />
 Sign Out
 </>
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
