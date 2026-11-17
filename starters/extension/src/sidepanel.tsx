import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Surface } from './Surface.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Surface where="sidepanel" />
  </StrictMode>,
)
