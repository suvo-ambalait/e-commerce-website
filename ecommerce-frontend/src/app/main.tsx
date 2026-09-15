import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import '@/index.css'
import { ensureSchema } from '@/shared/lib/storage'
import { store } from './store'
import { AppProviders } from './providers'
import { App } from './App'

ensureSchema()

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
