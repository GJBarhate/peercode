import { Loader } from 'lucide-react'

export default function LoadingButton({
 isLoading,
 disabled,
 onClick,
 children,
 className = '',
 type = 'button',
 ...props
}) {
 return (
 <button
 type={type}
 disabled={isLoading || disabled}
 onClick={onClick}
 className={`
 inline-flex items-center gap-2 
 disabled:opacity-50 disabled:cursor-not-allowed
 transition-colors
 ${className}
 `}
 {...props}
 >
 {isLoading && (
 <Loader className="w-4 h-4 animate-spin" />
 )}
 {children}
 </button>
 )
}
