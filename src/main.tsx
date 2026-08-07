import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'
import { MasteryProvider } from './features/mastery/MasteryContext'
import { SettingsProvider } from './features/settings/SettingsContext'
import { StatsProvider } from './features/stats/StatsContext'

// BASE_URL trae la barra final ("/katacan/"); react-router espera el
// basename sin ella.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <SettingsProvider>
        <StatsProvider>
          <MasteryProvider>
            <App />
          </MasteryProvider>
        </StatsProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
