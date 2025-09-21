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
import ErrorBoundary from './components/ErrorBoundary'
import AIWorkflowErrorBoundary from './components/AIWorkflowErrorBoundary'
import AccessibilityEnhancer from './components/AccessibilityEnhancer'

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
const IntelligenceDashboard = lazy(() => import('./components/IntelligenceDashboard'))

// Marketplace components
const TemplateBrowser = lazy(() => import('./components/Marketplace/TemplateBrowser'))
const TemplateGenerator = lazy(() => import('./components/Marketplace/TemplateGenerator'))
const CommunityHub = lazy(() => import('./components/Marketplace/CommunityHub'))
const MarketplaceTemplateEditor = lazy(() => import('./components/Marketplace/TemplateEditor'))

// THE HAMMER'S OPTIMIZATION: Enhanced Loading Component with Accessibility
const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeClasses = {
    small: { spinner: '16px', container: '100px', fontSize: '14px' },
    medium: { spinner: '24px', container: '200px', fontSize: '16px' },
    large: { spinner: '32px', container: '300px', fontSize: '18px' }
  };

  const config = sizeClasses[size];

  return (
    <div
      className="loading-container"
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: config.container,
        padding: '2rem',
        fontSize: config.fontSize,
        color: '#6b7280'
      }}
    >
      <div
        className="loading-spinner"
        aria-hidden="true"
        style={{
          width: config.spinner,
          height: config.spinner,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'hammer-spin 1s linear infinite',
          marginBottom: '1rem'
        }}
      ></div>

      <div className="loading-text" style={{
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: '0.025em'
      }}>
        {message}
      </div>

      <div className="loading-dots" style={{
        marginTop: '0.5rem',
        display: 'flex',
        gap: '4px'
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#9ca3af',
              animation: `hammer-pulse 1.5s infinite ${i * 0.2}s`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes hammer-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes hammer-pulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .loading-container {
            padding: 1rem !important;
            min-height: ${parseInt(config.container) * 0.7}px !important;
            font-size: ${parseInt(config.fontSize) - 2}px !important;
          }

          .loading-spinner {
            width: ${parseInt(config.spinner) * 0.8}px !important;
            height: ${parseInt(config.spinner) * 0.8}px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none !important;
          }

          .loading-dots div {
            animation: none !important;
            opacity: 0.7 !important;
          }
        }
      `}</style>
    </div>
  );
}

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
    <ErrorBoundary level="page">
      <Layout realtimeNotifications={realtimeNotifications}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={
              <ErrorBoundary level="component">
                <Dashboard />
              </ErrorBoundary>
            } />
            <Route path="/agents" element={
              <AIWorkflowErrorBoundary>
                <AgentDashboard />
              </AIWorkflowErrorBoundary>
            } />
            <Route path="/discovery" element={
              <ErrorBoundary level="component">
                <Discovery />
              </ErrorBoundary>
            } />
            <Route path="/intelligence" element={
              <AIWorkflowErrorBoundary>
                <IntelligenceDashboard />
              </AIWorkflowErrorBoundary>
            } />
            <Route path="/features" element={
              <ErrorBoundary level="component">
                <FeatureManagementDashboard />
              </ErrorBoundary>
            } />
            <Route path="/analytics" element={
              <ErrorBoundary level="component">
                <AdvancedAnalytics />
              </ErrorBoundary>
            } />
            <Route path="/validation" element={
              <AIWorkflowErrorBoundary>
                <RequirementsPrecision />
              </AIWorkflowErrorBoundary>
            } />
            <Route path="/settings" element={
              <ErrorBoundary level="component">
                <Settings />
              </ErrorBoundary>
            } />
            <Route path="/view/:type/*" element={
              <ErrorBoundary level="component">
                <DocumentView />
              </ErrorBoundary>
            } />
            <Route path="/edit/template/*" element={
              <ErrorBoundary level="component">
                <TemplateEditor />
              </ErrorBoundary>
            } />
            <Route path="/edit/:type/*" element={
              <ErrorBoundary level="component">
                <DocumentEditor />
              </ErrorBoundary>
            } />
            <Route path="/collaborate/:type/*" element={
              <ErrorBoundary level="component">
                <CollaborativeEditor />
              </ErrorBoundary>
            } />
            <Route path="/create/:type" element={
              <ErrorBoundary level="component">
                <DocumentEditor />
              </ErrorBoundary>
            } />
            <Route path="/create/:type/for/:capabilityId" element={
              <ErrorBoundary level="component">
                <DocumentEditor />
              </ErrorBoundary>
            } />
            <Route path="/create-collaborative/:type" element={
              <ErrorBoundary level="component">
                <CollaborativeEditor />
              </ErrorBoundary>
            } />
            <Route path="/create-collaborative/:type/for/:capabilityId" element={
              <ErrorBoundary level="component">
                <CollaborativeEditor />
              </ErrorBoundary>
            } />

            {/* Marketplace Routes */}
            <Route path="/marketplace" element={
              <ErrorBoundary level="component">
                <TemplateBrowser />
              </ErrorBoundary>
            } />
            <Route path="/marketplace/browse" element={
              <ErrorBoundary level="component">
                <TemplateBrowser />
              </ErrorBoundary>
            } />
            <Route path="/marketplace/generate" element={
              <AIWorkflowErrorBoundary>
                <TemplateGenerator />
              </AIWorkflowErrorBoundary>
            } />
            <Route path="/marketplace/community" element={
              <ErrorBoundary level="component">
                <CommunityHub />
              </ErrorBoundary>
            } />
            <Route path="/marketplace/editor" element={
              <ErrorBoundary level="component">
                <MarketplaceTemplateEditor />
              </ErrorBoundary>
            } />
            <Route path="/marketplace/editor/:templateId" element={
              <ErrorBoundary level="component">
                <MarketplaceTemplateEditor />
              </ErrorBoundary>
            } />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AppProvider>
      <FeatureProvider>
        <AccessibilityEnhancer>
          <Router>
            <AppWithRealtime />
          </Router>
        </AccessibilityEnhancer>
      </FeatureProvider>
    </AppProvider>
  )
}

export default App