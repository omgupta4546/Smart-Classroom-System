import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import { GoogleOAuthProvider } from '@react-oauth/google';

import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <GoogleOAuthProvider clientId="803640115408-8c0rqakqtsr90c2bcqc37n0mp6qm2pbk.apps.googleusercontent.com">
                <HashRouter>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </HashRouter>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
