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

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

// THE HAMMER'S FINAL OPTIMIZATION: Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[ServiceWorker] Registration successful:', registration.scope);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Show update available notification
              if (window.toast) {
                window.toast.success('App update available! Refresh to update.', {
                  duration: 10000,
                  id: 'sw-update'
                });
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('[ServiceWorker] Registration failed:', error);
      });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, isOnline, action } = event.data;

      if (type === 'CONNECTION_STATUS') {
        // Update global connection status
        window.isOnline = isOnline;

        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('connectionchange', {
          detail: { isOnline }
        }));

        if (window.toast) {
          if (isOnline) {
            window.toast.success('Connection restored!', { id: 'connection' });
          } else {
            window.toast.error('You are offline. Some features may be limited.', {
              id: 'connection',
              duration: 10000
            });
          }
        }
      }

      if (type === 'BACKGROUND_SYNC' && action === 'sync_pending_data') {
        // Trigger data sync in the application
        window.dispatchEvent(new CustomEvent('backgroundsync'));
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      ref={(toaster) => {
        window.toast = toaster;
      }}
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    />
  </React.StrictMode>,
)