import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyFont } from './store/fontStore'
import { useFontStore } from './store/fontStore'

// Apply saved font on startup
applyFont(useFontStore.getState().activeFont)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
