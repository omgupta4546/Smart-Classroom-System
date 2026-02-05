import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
            <HashRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </HashRouter>
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
