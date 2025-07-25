/**
 * 应用主入口文件
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './shadcn.css'
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>
)
