import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx';
import './index.css'
import { registerPwa } from './lib/pwa'
import { startProductionDiagnostics } from './lib/productionDiagnostics'
import AppErrorBoundary from '@/components/AppErrorBoundary'

startProductionDiagnostics()
registerPwa()

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
)
