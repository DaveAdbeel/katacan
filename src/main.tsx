import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { MasteryProvider } from './features/mastery/MasteryContext'
import { SettingsProvider } from './features/settings/SettingsContext'
import { StatsProvider } from './features/stats/StatsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <StatsProvider>
        <MasteryProvider>
          <App />
        </MasteryProvider>
      </StatsProvider>
    </SettingsProvider>
  </StrictMode>,
)
