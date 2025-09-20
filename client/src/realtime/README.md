# Real-time Collaboration System

This directory contains the real-time collaboration implementation for the Anvil platform.

## Architecture

### WebSocket Client (`WebSocketClient.js`)
- Singleton WebSocket client that manages connections to the real-time server
- Handles automatic reconnection with exponential backoff
- Provides event-driven API for document collaboration
- Supports presence tracking and cursor updates

### React Integration

#### Hooks
- `useRealtime.js` - Main hook for real-time collaboration features
- `useRealtimeNotifications.js` - Manages real-time notifications and activity feed

#### Components
- `CollaborativeEditor.jsx` - Real-time collaborative text editor
- `UserPresence.jsx` - Shows online users and their status
- `RealtimeNotifications.jsx` - Notification center for collaboration events

## Features Implemented

### ✅ WebSocket Connection Management
- Automatic connection to `ws://localhost:3000`
- Reconnection handling with exponential backoff
- Connection status indicators

### ✅ Collaborative Text Editing
- Real-time text synchronization
- Basic operational transformation for conflict resolution
- Cursor position tracking
- Selection state management

### ✅ User Presence System
- Online/offline status tracking
- User avatars with color coding
- Editing status indicators
- Presence dropdown with detailed user list

### ✅ Real-time Notifications
- Document update notifications
- User join/leave events
- Connection status alerts
- Auto-dismissing notifications

### ✅ Integration with Existing UI
- Added "Collaborate" button to document views
- New routing paths: `/collaborate/:type/*`
- Header integration for notification bell
- Layout system integration

## API Integration Points

The system expects the backend to provide:

### WebSocket Server
- URL: `ws://localhost:3000`
- Message format: `{ type: string, payload: object }`

### Expected Message Types
- `JOIN_DOCUMENT` - User joins document editing session
- `TEXT_DELTA` - Text changes with operational transform data
- `CURSOR_UPDATE` - Cursor position updates
- `PRESENCE_UPDATE` - User status changes
- `DOCUMENT_DELTA` - Incoming document changes
- `USER_JOINED`/`USER_LEFT` - Presence events
- `CONFLICT_RESOLUTION` - Merge conflict resolution

## Usage

### Basic Real-time Editing
```javascript
import { useRealtime } from '../hooks/useRealtime.js';

const MyComponent = ({ documentId, userId }) => {
  const {
    isConnected,
    users,
    cursors,
    sendTextDelta,
    sendCursorUpdate
  } = useRealtime(documentId, userId);

  // Component implementation
};
```

### Notifications
```javascript
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications.js';

const MyApp = () => {
  const realtimeHook = useRealtime(docId, userId);
  const notifications = useRealtimeNotifications(realtimeHook);

  return (
    <RealtimeNotifications
      notifications={notifications.notifications}
      onDismiss={notifications.dismissNotification}
      isConnected={realtimeHook.isConnected}
    />
  );
};
```

## File Structure

```
client/src/
├── realtime/
│   ├── WebSocketClient.js      # Core WebSocket management
│   └── README.md              # This file
├── hooks/
│   ├── useRealtime.js         # Main collaboration hook
│   └── useRealtimeNotifications.js  # Notifications hook
└── components/
    ├── CollaborativeEditor.jsx    # Real-time editor
    ├── UserPresence.jsx          # User presence UI
    ├── UserPresence.css          # Presence styles
    ├── RealtimeNotifications.jsx # Notification center
    └── RealtimeNotifications.css # Notification styles
```

## Next Steps

To make this fully functional, you would need:

1. **Backend WebSocket Server** - Implement the real-time server at `ws://localhost:3000`
2. **Operational Transformation** - Improve conflict resolution algorithms
3. **Authentication** - Integrate with proper user authentication
4. **Persistence** - Save collaborative changes to the document store
5. **Performance** - Optimize for larger documents and more users
6. **Testing** - Add comprehensive tests for real-time scenarios

## Demo Mode

The current implementation includes mock functionality for demonstration:
- Generates random user IDs
- Shows simulated collaboration events
- Works without a real WebSocket server (graceful degradation)