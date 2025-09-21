# MTV Music Video Streaming App 🎵

A modern web application that recreates the classic MTV experience by continuously streaming popular music videos. Built with Node.js and React.

## Features

- 🎵 **Continuous Music Video Streaming** - Auto-playing playlist that actually works
- 📱 **Mobile Responsive** - Works perfectly on phones, tablets, and desktop
- 🌐 **Local Network Access** - Your family can access from any device on your WiFi
- 🔄 **Real-time Sync** - Multiple devices stay synchronized
- 🎮 **Simple Controls** - Play/pause, skip, and progress tracking
- 📺 **MTV-Style Interface** - Clean, modern design inspired by classic MTV
- 🛡️ **Bulletproof Video Playback** - HTML5 video with YouTube fallback and multiple backup sources
- 🔧 **Smart Error Handling** - Automatic fallback when videos fail to load
- 📲 **Mobile Auto-play Support** - Handles browser restrictions intelligently
- 🎬 **Hybrid YouTube Integration** - Supports both YouTube Player API and HTML5 video seamlessly
- 🔄 **Intelligent Fallbacks** - Automatically switches between YouTube and HTML5 based on availability

## Quick Start

### Option 1: Run with Demo Videos (No API Key Required)
```bash
# Install dependencies
npm run install:all

# Start the application
npm start
```

### Option 2: Use YouTube API (Optional - for live trending videos)
1. Get a YouTube API key from [Google Cloud Console](https://console.developers.google.com/)
2. Create a `.env` file:
```bash
cp .env.example .env
# Edit .env and add your YOUTUBE_API_KEY
# Set DEMO_MODE=false to use real YouTube videos
```
3. Run the application:
```bash
npm run install:all
npm start
```

**📚 For detailed YouTube setup instructions, see [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md)**

## Network Access Setup

### For Your Wife's Phone Access:

1. **Start the app** on your computer
2. **Find your network URL** - The app will display it when it starts, like:
   ```
   Network: http://192.168.1.100:3000
   ```
3. **On her phone**:
   - Make sure it's on the same WiFi network
   - Open any web browser (Chrome, Safari, etc.)
   - Type the network URL shown in step 2
   - Enjoy synchronized music videos!

### Network Requirements:
- Both devices must be on the same WiFi network
- No special router configuration needed
- Works with any home WiFi setup

## Development

### Install Dependencies
```bash
# Install both server and client dependencies
npm run install:all

# Or install separately:
npm install                    # Server dependencies
cd client && npm install      # Client dependencies
```

### Development Mode
```bash
# Run server and client separately for development
npm run dev                    # Server with auto-restart
cd client && npm start         # Client dev server
```

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
mtv-app/
├── server.js              # Express server with WebSocket support
├── package.json           # Server dependencies and scripts
├── .env.example           # Environment variables template
├── client/                # React application
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   ├── components/    # React components
│   │   │   ├── VideoPlayer.js    # YouTube video player
│   │   │   ├── VideoInfo.js      # Current video display
│   │   │   └── NetworkInfo.js    # Network connection info
│   │   └── ...
│   └── package.json       # Client dependencies
└── README.md              # This file
```

## Technical Details

### Backend (Node.js/Express)
- **Express server** with CORS and static file serving
- **WebSocket support** for real-time device synchronization
- **Multi-source video management** with reliable sample videos
- **YouTube API integration** (optional - for real YouTube videos)
- **Local network hosting** with automatic IP detection
- **In-memory caching** to reduce API calls

### Frontend (React)
- **React 18** with hooks and modern patterns
- **Hybrid video player** - HTML5 primary with YouTube fallback
- **Smart player selection** - Automatically chooses best player type
- **Multiple fallback URLs** per video for maximum reliability
- **WebSocket client** for real-time updates
- **Mobile autoplay handling** with user interaction detection
- **Responsive CSS** with mobile-first design
- **Touch gesture support** for mobile devices

### Network Features
- **Automatic local IP detection**
- **Cross-device synchronization**
- **Real-time device counting**
- **Easy mobile access setup**

## Troubleshooting

### Can't Access from Phone?
1. Check that both devices are on the same WiFi network
2. Try disabling your computer's firewall temporarily
3. Make sure the app is running on your computer
4. Use the exact URL shown when the app starts

### Videos Not Playing?
1. **NEW: This should rarely happen!** - The app now uses reliable HTML5 videos with multiple fallbacks
2. If videos still don't play, check your internet connection
3. Try refreshing the playlist
4. The app automatically tries backup video sources when primary sources fail

### Performance Issues?
1. Close other applications using network bandwidth
2. Try using a wired connection for your computer
3. Reduce video quality in browser settings

## API Usage

The app includes several REST endpoints and WebSocket events:

### REST API
- `GET /api/playlist` - Get current video playlist
- `POST /api/playlist/refresh` - Refresh video playlist
- `POST /api/player/skip` - Skip to next video
- `GET /api/network/info` - Get network configuration

### WebSocket Events
- `initial_state` - Sent to new connections
- `video_changed` - Broadcast when video changes
- `playlist_updated` - Broadcast when playlist refreshes

## Customization

### Adding More Videos
Edit the `demoVideos` array in `server.js` to include your favorite music videos.

### Changing the Port
Set the `PORT` environment variable or edit the default in `server.js`.

### Styling
Modify the CSS files in `client/src/components/` to customize the appearance.

## License

MIT License - Feel free to modify and share!

## Support

Created with ❤️ using Anvil AI Development Framework.

---

**Enjoy your MTV experience! 🎵📺**