import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css' // Esta é a única importação de CSS que precisamos
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)