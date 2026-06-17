import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Presentation from './Presentation.jsx'
import './styles.css'

// /presentation 경로면 발표 덱, 그 외에는 앱을 렌더링
const isPresentation = window.location.pathname.replace(/\/+$/, '') === '/presentation'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPresentation ? <Presentation /> : <App />}
  </StrictMode>,
)
