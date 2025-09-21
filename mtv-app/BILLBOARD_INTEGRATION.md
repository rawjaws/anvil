# Billboard Hot 100 Integration - STV Music Video App

## Overview

The STV music video application now features **full Billboard Hot 100 chart integration**, making it play actual popular songs from the current Billboard charts instead of generic YouTube searches. This transforms STV from a demo app into a real music video channel that follows actual music trends.

## Implementation Summary

### 1. Billboard Service (`services/billboardService.js`)
- **Data Source**: GitHub API `mhollingshead/billboard-hot-100` (updated daily)
- **Endpoint**: `https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/recent.json`
- **Features**:
  - Fetches current Billboard Hot 100 chart (100 songs)
  - Caches data for 1 hour to avoid excessive API calls
  - Filters songs by programming block (morning hits, late night, etc.)
  - Tracks song positions, trends (rising/falling/new)
  - Provides clean artist/title data for YouTube searches

### 2. Enhanced YouTube Service (`services/youtubeService.js`)
- **New Methods**:
  - `searchBillboardSong()` - Optimized search for specific Billboard tracks
  - `getBillboardEnhancedVideos()` - Prioritizes Billboard songs over generic searches
  - `getDemoBillboardVideos()` - Demo videos with Billboard metadata (no API mode)
- **Search Optimization**:
  - Cleans artist names (removes "featuring", "ft.", "&" collaborators)
  - Strips extra content from song titles (parentheses, brackets)
  - Uses "music video" suffix for better YouTube results
  - More lenient filtering for Billboard tracks (5K views vs 10K)

### 3. Updated MTV Programming Service (`services/mtvProgrammingService.js`)
- **Content Priority**:
  1. **Billboard Hot 100** (highest priority)
  2. Apple Music charts (if available)
  3. YouTube searches/demo videos (fallback)
- **Programming Block Filtering**:
  - Morning hits: Top 20 chart songs
  - Prime time: Top 40 songs
  - Late night: Chart positions 20-60 (deeper cuts)
  - Weekend blocks: Top 35 with rising hits
  - Sunday programming: Positions 5-40 (established hits, less aggressive)

### 4. Server API Endpoints (`server.js`)
- **New Billboard Endpoints**:
  - `GET /api/billboard/current-chart` - Full current Billboard Hot 100
  - `GET /api/billboard/chart-info` - Chart metadata and statistics
  - `GET /api/billboard/programming/:blockId` - Billboard songs for programming block
- **Enhanced Programming**: All existing endpoints now include Billboard data in video metadata

## Current Performance

### Test Results (September 21, 2025)
- **Chart Date**: 2025-09-20 (most recent Billboard Hot 100)
- **Total Songs**: 100 songs successfully fetched
- **Chart Stats**: 6 new entries, 42 rising hits
- **#1 Song**: "Golden" by HUNTR/X: EJAE, Audrey Nuna & REI AMI
- **Integration Success**: 100% of programming content from Billboard Hot 100

### Sample Programming Output
```
📺 Sunday Afternoon Mix - Generated 8 videos:
   📊 8 from Billboard Hot 100
   🎵 0 from Apple Music
   🔍 0 from YouTube search/demo

🔥 Billboard Hot 100 Songs in Current Playlist:
   #6 Sabrina Carpenter - Tears 📉
   #7 Morgan Wallen Featuring Tate McRae - What I Want
   #8 HUNTR/X: EJAE, Audrey Nuna & REI AMI - How It's Done 📈
   #9 Ravyn Lenae - Love Me Not 📉
   #10 Justin Bieber - Daisies 📈
   #11 Teddy Swims - Lose Control 📉
   #12 Lady Gaga & Bruno Mars - Die With A Smile 📈
   #13 Morgan Wallen - I Got Better
```

## Key Features

### Real Music Trends
- STV now plays actual popular songs from Billboard Hot 100
- Chart positions and trending data (🆕 new, 📈 rising, 📉 falling)
- Different programming blocks get different chart segments
- Updates automatically as Billboard publishes new charts

### Backward Compatibility
- Works with existing YouTube API key: `AIzaSyCYh_EHMscLOOXtk6bsLSvot6YTH_8DB7s`
- Demo video system still works when APIs are unavailable
- All existing MTV programming blocks maintained
- No breaking changes to client application

### Smart Fallbacks
1. **Billboard + YouTube API**: Best experience with real songs and metadata
2. **Billboard + Demo Videos**: Real song titles with demo video playback
3. **Demo Videos Only**: Original functionality maintained

## Usage

### For Users
- STV now automatically plays current Billboard Hot 100 hits
- Programming changes throughout the day based on time blocks
- Current popular songs are prioritized in all time slots
- Real artist names and song titles displayed

### For Developers
```javascript
// Get current Billboard chart
const chart = await billboardService.getCurrentChart();

// Get songs for specific programming block
const songs = await billboardService.getSongsForProgrammingBlock('morning_hits', 15);

// Generate Billboard-enhanced playlist
const videos = await youtubeService.getBillboardEnhancedVideos(songs, 20);
```

## Technical Notes

- **No API Key Required**: Billboard data comes from free GitHub repository
- **Rate Limiting**: 150ms delays between YouTube searches to avoid limits
- **Caching**: 1-hour cache for Billboard data, 30-minute cache for programming content
- **Error Handling**: Graceful fallbacks if Billboard service is unavailable
- **Data Quality**: Billboard API provides accurate, up-to-date chart information

## Future Enhancements

- Add Billboard 200 (albums) integration
- Include genre-specific Billboard charts (Country, R&B, Rock)
- Display chart movement trends in video player UI
- Add weekly chart comparison features
- Historical Billboard chart browsing

---

**Result**: STV is now a fully functional music video app that plays actual popular songs from the Billboard Hot 100, making it feel like a real music television network rather than a demo application.