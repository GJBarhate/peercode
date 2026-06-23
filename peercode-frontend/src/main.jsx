import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { GeminiProvider } from './context/GeminiContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
 <React.StrictMode>
 <ErrorBoundary>
 <HelmetProvider>
 <BrowserRouter>
 <AuthProvider>
 <SocketProvider>
 <GeminiProvider>
 <ThemeProvider>
 <App />
 <Toaster
 position="bottom-right"
 toastOptions={{
 duration: 4000,
 style: {
 background: 'var(--color-bg-elevated)',
 color: 'var(--color-text-primary)',
 border: '1px solid var(--color-border-default)',
 borderRadius: '12px',
 fontSize: '14px',
 fontFamily: "'Outfit', sans-serif"
 },
 success: {
 iconTheme: { primary: '#22c55e', secondary: 'var(--color-bg-elevated)' }
 },
 error: {
 iconTheme: { primary: '#ef4444', secondary: 'var(--color-bg-elevated)' }
 }
 }}
 />
 </ThemeProvider>
 </GeminiProvider>
 </SocketProvider>
 </AuthProvider>
 </BrowserRouter>
 </HelmetProvider>
 </ErrorBoundary>
 </React.StrictMode>
)
