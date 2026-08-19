import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Presentation from './Presentation.jsx'
import Story from './Story.jsx'
import './styles.css'

// 경로별 렌더링 대상
//   /presentation → 제품 소개 덱
//   /story        → 두아이 런치톤 회고 덱
//   그 외          → 앱
const path = window.location.pathname.replace(/\/+$/, '')

const ROUTES = {
  '/presentation': Presentation,
  '/story': Story,
}

const Root = ROUTES[path] ?? App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
