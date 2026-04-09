import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

async function init() {
  // Dynamically import storage so any init errors are caught
  try {
    const { storage } = await import('./lib/storage')
    window.storage = storage
  } catch(e) {
    console.error('Storage init failed:', e)
    // Provide a no-op fallback so the app loads even without storage
    window.storage = {
      get: async () => null,
      set: async () => null,
      delete: async () => null,
      list: async () => ({ keys: [] }),
    }
  }

  const { default: App } = await import('./App')
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

init()
