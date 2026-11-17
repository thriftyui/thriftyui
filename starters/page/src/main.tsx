import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The address the app is served under: / on its own, or a path
        when it is built with Vite's `base` (the site shows the starters
        under /starters/<name>/). Vite gives it as BASE_URL; React Router
        takes it as basename. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
