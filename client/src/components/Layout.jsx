import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './Layout.css'

export default function Layout({ children, realtimeNotifications = null }) {
  console.log('[Layout] Rendering with children:', children)
  console.log('[Layout] Children type:', typeof children)
  console.log('[Layout] Children props:', children?.props)

  return (
    <div className="layout">
      <Header realtimeNotifications={realtimeNotifications} />
      <div className="layout-main">
        <Sidebar />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  )
}