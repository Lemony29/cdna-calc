import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css' // Esta é a única importação de CSS que precisamos
import App from './App.jsx'
import './i18n'; // Importa e executa nosso arquivo de configuração

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)