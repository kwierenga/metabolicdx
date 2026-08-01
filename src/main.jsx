import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Storage lives in ./lib/supabase.js and is imported directly by App.jsx.
// There used to be a window.storage shim here backed by a *second* Supabase
// client; it was unused by App.jsx and, once authentication was added, would
// have carried no session — every query it made would fail under RLS.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
