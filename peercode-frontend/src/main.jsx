import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { GeminiProvider } from './context/GeminiContext'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <GeminiProvider>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: "'Outfit', sans-serif"
                },
                success: {
                  iconTheme: { primary: '#22c55e', secondary: '#1f2937' }
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#1f2937' }
                }
              }}
            />
          </GeminiProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
