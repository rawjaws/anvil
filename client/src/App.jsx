/*
 * Copyright 2025 Darcy Davidson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { FeatureProvider } from './contexts/FeatureContext'
import Layout from './components/Layout'
import RealtimeNotifications from './components/RealtimeNotifications.jsx'
import { useRealtime } from './hooks/useRealtime.js'
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications.js'

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'))
const DocumentView = lazy(() => import('./components/DocumentView'))
const DocumentEditor = lazy(() => import('./components/DocumentEditor'))
const CollaborativeEditor = lazy(() => import('./components/CollaborativeEditor'))
const TemplateEditor = lazy(() => import('./components/TemplateEditor'))
const Settings = lazy(() => import('./components/Settings'))
const AgentDashboard = lazy(() => import('./components/AgentDashboard'))
const Discovery = lazy(() => import('./components/Discovery'))
const FeatureManagementDashboard = lazy(() => import('./components/FeatureToggle').then(module => ({ default: module.FeatureManagementDashboard })))
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'))
const RequirementsPrecision = lazy(() => import('./components/RequirementsPrecision'))

// Marketplace components
const TemplateBrowser = lazy(() => import('./components/Marketplace/TemplateBrowser'))
const TemplateGenerator = lazy(() => import('./components/Marketplace/TemplateGenerator'))
const CommunityHub = lazy(() => import('./components/Marketplace/CommunityHub'))
const MarketplaceTemplateEditor = lazy(() => import('./components/Marketplace/TemplateEditor'))

// Loading fallback component
const LoadingSpinner = () => (
  <div className="loading-container" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px',
    color: '#6b7280'
  }}>
    <div className="loading-spinner" style={{
      width: '20px',
      height: '20px',
      border: '2px solid #e5e7eb',
      borderTop: '2px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '10px'
    }}></div>
    Loading...
  </div>
)

// Component to handle real-time features within the router context
function AppWithRealtime() {
  const location = useLocation();
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);
  const [documentId, setDocumentId] = useState(null);

  // Determine if we're on an editing page and extract document ID
  useEffect(() => {
    const isEditingPage = location.pathname.includes('/edit/') || location.pathname.includes('/create/') || location.pathname.includes('/collaborate/');

    if (isEditingPage) {
      // Extract document ID from path
      const pathParts = location.pathname.split('/');
      if (pathParts.includes('collaborate')) {
        const docIndex = pathParts.indexOf('collaborate') + 2;
        setDocumentId(pathParts[docIndex] || `new_${Date.now()}`);
      } else if (pathParts.includes('edit')) {
        const docIndex = pathParts.indexOf('edit') + 2;
        setDocumentId(pathParts[docIndex] || `new_${Date.now()}`);
      } else if (pathParts.includes('create')) {
        setDocumentId(`new_${pathParts[pathParts.length - 1]}_${Date.now()}`);
      }
    } else {
      setDocumentId(null);
    }
  }, [location.pathname]);

  // Initialize real-time only for collaborative editing
  const shouldEnableRealtime = documentId && location.pathname.includes('/collaborate/');
  const realtimeHook = useRealtime(shouldEnableRealtime ? documentId : null, userId);
  const notificationsHook = useRealtimeNotifications(realtimeHook);

  const realtimeNotifications = shouldEnableRealtime ? (
    <RealtimeNotifications
      notifications={notificationsHook.notifications}
      onDismiss={notificationsHook.dismissNotification}
      isConnected={realtimeHook.isConnected}
      connectionError={realtimeHook.connectionError}
    />
  ) : null;

  return (
    <Layout realtimeNotifications={realtimeNotifications}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<AgentDashboard />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/features" element={<FeatureManagementDashboard />} />
          <Route path="/analytics" element={<AdvancedAnalytics />} />
          <Route path="/validation" element={<RequirementsPrecision />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/view/:type/*" element={<DocumentView />} />
          <Route path="/edit/template/*" element={<TemplateEditor />} />
          <Route path="/edit/:type/*" element={<DocumentEditor />} />
          <Route path="/collaborate/:type/*" element={<CollaborativeEditor />} />
          <Route path="/create/:type" element={<DocumentEditor />} />
          <Route path="/create/:type/for/:capabilityId" element={<DocumentEditor />} />
          <Route path="/create-collaborative/:type" element={<CollaborativeEditor />} />
          <Route path="/create-collaborative/:type/for/:capabilityId" element={<CollaborativeEditor />} />

          {/* Marketplace Routes */}
          <Route path="/marketplace" element={<TemplateBrowser />} />
          <Route path="/marketplace/browse" element={<TemplateBrowser />} />
          <Route path="/marketplace/generate" element={<TemplateGenerator />} />
          <Route path="/marketplace/community" element={<CommunityHub />} />
          <Route path="/marketplace/editor" element={<MarketplaceTemplateEditor />} />
          <Route path="/marketplace/editor/:templateId" element={<MarketplaceTemplateEditor />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <FeatureProvider>
        <Router>
          <AppWithRealtime />
        </Router>
      </FeatureProvider>
    </AppProvider>
  )
}

export default App