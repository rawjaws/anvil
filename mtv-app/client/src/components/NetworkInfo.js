import React, { useState } from 'react';
import './NetworkInfo.css';

const NetworkInfo = ({ networkInfo, connectedDevices }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!networkInfo) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(networkInfo.url);
    // Simple feedback - you could add a toast notification here
    alert('Network URL copied to clipboard!');
  };

  return (
    <div className="network-info">
      <button
        className="network-toggle"
        onClick={() => setShowDetails(!showDetails)}
      >
        📱 {connectedDevices} device{connectedDevices !== 1 ? 's' : ''}
      </button>

      {showDetails && (
        <div className="network-details">
          <div className="network-details-content">
            <h3>Network Access</h3>

            <div className="network-url">
              <label>Access URL:</label>
              <div className="url-display">
                <code>{networkInfo.url}</code>
                <button
                  className="copy-btn"
                  onClick={copyToClipboard}
                  title="Copy URL"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="network-stats">
              <div className="stat">
                <span className="stat-label">Local IP:</span>
                <span className="stat-value">{networkInfo.ip}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Port:</span>
                <span className="stat-value">{networkInfo.port}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Connected:</span>
                <span className="stat-value">{connectedDevices} device{connectedDevices !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="network-instructions">
              <h4>📱 Mobile Access Instructions:</h4>
              <ol>
                <li>Make sure your phone is on the same WiFi network</li>
                <li>Open a web browser on your phone</li>
                <li>Type the URL above into the address bar</li>
                <li>Enjoy synchronized music videos!</li>
              </ol>
            </div>

            <button
              className="close-details"
              onClick={() => setShowDetails(false)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkInfo;