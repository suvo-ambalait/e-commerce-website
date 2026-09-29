import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import '@/index.css'
import { store } from './store'
import { AppProviders } from './providers'
import { App } from './App'
import { loadDemoAccountData } from '@/features/account/data/demoAccountData'

// Sample data for the customer account pages. Remove once they use the API.
loadDemoAccountData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
