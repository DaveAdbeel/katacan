import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { SettingsProvider } from './features/settings/SettingsContext'
import { StatsProvider } from './features/stats/StatsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <StatsProvider>
        <App />
      </StatsProvider>
    </SettingsProvider>
  </StrictMode>,
)
