# YouTube API Integration Setup Guide

## Overview

The MTV Music Video App fetches real popular music videos from YouTube using advanced search algorithms and filtering. This guide provides step-by-step instructions for setting up YouTube API integration to access current trending music content.

## Features

✅ **Real Popular Music Videos** - Fetches current trending music videos from YouTube
✅ **Multiple Search Strategies** - Uses 5 different search queries for diverse content
✅ **Smart Filtering** - Filters by view count, duration, language, and music category
✅ **Automatic Fallback** - Falls back to demo videos if API setup fails
✅ **High-Quality Content** - Prioritizes videos with 100K+ views from the last 90 days
✅ **English Language Priority** - Focuses on English-language music videos

## YouTube API Setup (Required for Real Music Videos)

To access real popular music videos instead of demo content, you need a YouTube API key:

### 1. Get a YouTube API Key

1. Go to [Google Developers Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable the **YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### 2. Configure the Application

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** and add your YouTube API key:
   ```env
   # YouTube API Key (required for real music videos)
   YOUTUBE_API_KEY=your_actual_api_key_here

   # Server Configuration
   PORT=3000

   # Demo Mode (set to false to use real YouTube videos)
   DEMO_MODE=false
   ```

3. **Restart the server**:
   ```bash
   npm start
   ```

4. **Verify the setup** - Look for this message in the console:
   ```
   🎵 Using real YouTube API to fetch popular music videos
   Fetched X popular YouTube music videos
   Top 3 videos: [video titles with view counts]
   ```

### 3. API Key Restrictions (Recommended)

For security, restrict your API key:

1. In Google Console > Credentials > Edit your API key
2. Set "Application restrictions":
   - **HTTP referrers**: Add your domain(s)
   - Example: `http://localhost:3000/*`, `https://yourdomain.com/*`
3. Set "API restrictions":
   - **Restrict key**: Select "YouTube Data API v3"

## How the Hybrid Player Works

### Player Types

1. **YouTube Player**: For videos marked with `isYouTube: true` or having `youtubeId`
2. **HTML5 Player**: For videos with direct `url` properties

### Fallback Mechanism

```
YouTube Video Request
        ↓
Try YouTube Player
        ↓
YouTube Fails? → Try HTML5 with fallbackUrl
        ↓
HTML5 Fails? → Skip to next video
```

### Video Data Structure

```javascript
// YouTube Video
{
  id: "dQw4w9WgXcQ",
  youtubeId: "dQw4w9WgXcQ",
  title: "Rick Astley - Never Gonna Give You Up",
  artist: "Rick Astley",
  thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  url: "fallback_video_url.mp4",        // Fallback for HTML5
  fallbackUrl: "backup_video_url.mp4",  // Secondary fallback
  duration: 213,
  isYouTube: true
}

// HTML5 Video
{
  id: "sample-video",
  title: "Sample Music Video",
  artist: "Artist Name",
  url: "https://example.com/video.mp4",
  fallbackUrl: "https://backup.com/video.mp4",
  thumbnail: "https://example.com/thumbnail.jpg",
  duration: 180,
  type: "html5"
}
```

## Error Handling

### YouTube Errors

- **Error 2**: Invalid video ID → Skip to next
- **Error 5**: HTML5 player error → Try fallback
- **Error 100**: Video not found → Skip to next
- **Error 101/150**: Embedding disabled → Try HTML5 fallback

### HTML5 Errors

- **Network Error**: Try fallback URL
- **CORS Error**: Try fallback URL
- **Format Error**: Skip to next video

### Mobile Autoplay

- Tries unmuted autoplay first
- Falls back to muted autoplay
- Shows manual play button if both fail

## How the YouTube Integration Works

### Search Strategy

The app uses 5 different search queries to find diverse popular music content:
1. **"popular music video 2024"** - Current year trending content
2. **"top hits 2024"** - Popular chart-toppers
3. **"music video trending"** - Trending music videos
4. **"latest music videos"** - Recent releases
5. **"pop music 2024"** - Popular genre content

### Filtering Criteria

Videos are filtered to ensure high-quality, relevant content:
- **Category**: Music videos only (categoryId: 10)
- **Language**: English language preference
- **Recency**: Published within last 90 days
- **Popularity**: Minimum 100,000 views
- **Duration**: Between 1-10 minutes (typical music video length)
- **Type**: Excludes live streams

### Content Prioritization

Videos are sorted by view count (highest first) to prioritize the most popular content.

## Demo Mode vs Real YouTube Mode

### Demo Mode

- **When**: No API key provided OR `DEMO_MODE=true`
- **Content**: Sample videos and fallback content
- **Pros**: Works immediately, no setup required
- **Use case**: Testing and development

### Real YouTube Mode

- **When**: Valid API key provided AND `DEMO_MODE=false`
- **Content**: Real trending music videos from YouTube
- **Pros**: Current popular music, fresh content
- **Use case**: Production deployment

## Quick Start Guide

### For Immediate Testing (Demo Mode)
```bash
git clone [repository]
cd mtv-app
npm install
npm run install:all
npm start
```
Access at http://localhost:3000 - works immediately with demo videos.

### For Real Music Videos
1. Get YouTube API key (see steps above)
2. Copy `.env.example` to `.env`
3. Add your API key to `.env`
4. Set `DEMO_MODE=false`
5. Restart the app

You should see console messages like:
```
🎵 Using real YouTube API to fetch popular music videos
Fetched 20 popular YouTube music videos
Top 3 videos: [video titles with view counts]
```

## Troubleshooting

### Common Issues

1. **"No real videos loading"**:
   - Check that `YOUTUBE_API_KEY` is set correctly in `.env`
   - Verify `DEMO_MODE=false` in `.env`
   - Ensure YouTube Data API v3 is enabled in Google Console
   - Check console for error messages

2. **"API quota exceeded"**:
   - YouTube API has daily quotas (10,000 units/day free)
   - Each search uses ~100 units, each video detail uses 1 unit
   - App caches results for 1 hour to minimize API calls
   - Consider upgrading API plan for high-traffic usage

3. **"Video unavailable" errors**:
   - Some YouTube videos restrict embedding
   - The app automatically falls back to HTML5 videos
   - This is normal behavior for copyright-protected content

4. **"Only getting old videos"**:
   - Check that search queries include current year (2024)
   - Videos are filtered to last 90 days by default
   - API might return cached results - try refreshing playlist

### Debug Information

The video player shows which player type is being used:
- 🎬 YouTube: Using YouTube Player API
- 🎥 HTML5: Using HTML5 video element

## Testing the Integration

1. **Start the app**: `npm start`
2. **Access locally**: http://localhost:3000
3. **Network access**: http://YOUR_IP:3000 (shown in console)
4. **Watch the console**: Shows player switches and fallbacks

## File Structure

```
mtv-app/
├── .env                          # Environment configuration
├── server.js                     # Backend with YouTube API integration
├── client/
│   └── src/
│       └── components/
│           └── VideoPlayer.js    # Hybrid video player component
└── YOUTUBE_SETUP.md             # This guide
```

## API Endpoints

- `GET /api/playlist` - Get current playlist (auto-detects video types)
- `POST /api/playlist/refresh` - Refresh playlist from YouTube API
- `POST /api/player/skip` - Skip to next video

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Restrict API keys to specific domains in production
- Consider rate limiting for public deployments

## Cost Considerations

YouTube API costs:
- **Free tier**: 10,000 units/day
- **Search request**: ~100 units
- **Video details**: ~1 unit per video
- **Typical usage**: ~150 units per playlist refresh

For high-traffic applications, consider:
- Longer cache times
- User-generated playlists
- Alternative video sources