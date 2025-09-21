const axios = require('axios');

class BillboardService {
  constructor() {
    this.baseUrl = 'https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
  }

  // Get current Billboard Hot 100 chart
  async getCurrentChart() {
    const cacheKey = 'current_chart';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📊 Using cached Billboard Hot 100 chart');
      return cached.data;
    }

    try {
      console.log('📊 Fetching current Billboard Hot 100 chart...');
      const response = await axios.get(`${this.baseUrl}/recent.json`, {
        timeout: 10000
      });

      if (response.data && response.data.data) {
        const chartData = {
          date: response.data.date,
          songs: response.data.data.map(song => ({
            position: song.this_week,
            title: song.song,
            artist: song.artist,
            previousPosition: song.last_week,
            peakPosition: song.peak_position,
            weeksOnChart: song.weeks_on_chart,
            isNew: song.last_week === 0 || song.last_week === null,
            isRising: song.last_week > song.this_week && song.last_week > 0,
            isFalling: song.last_week < song.this_week && song.last_week > 0
          }))
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: chartData,
          timestamp: Date.now()
        });

        console.log(`📊 Fetched Billboard Hot 100 for ${chartData.date} (${chartData.songs.length} songs)`);
        return chartData;
      }

      throw new Error('Invalid chart data received');
    } catch (error) {
      console.error('📊 Error fetching Billboard chart:', error.message);
      return null;
    }
  }

  // Get Billboard songs filtered by programming block
  async getSongsForProgrammingBlock(programmingBlockId, limit = 25) {
    const chart = await this.getCurrentChart();

    if (!chart || !chart.songs) {
      return [];
    }

    let filteredSongs = [];

    switch (programmingBlockId) {
      case 'morning_hits':
      case 'wake_up_stv':
        // Top 20 songs for morning energy
        filteredSongs = chart.songs.slice(0, 20);
        break;

      case 'midday_mainstream':
      case 'stv_hits':
        // Top 30 mainstream hits
        filteredSongs = chart.songs.slice(0, 30);
        break;

      case 'afternoon_youth':
      case 'after_school':
        // Mix of top songs and rising hits for younger audience
        filteredSongs = [
          ...chart.songs.slice(0, 15), // Top 15
          ...chart.songs.filter(song => song.isRising || song.isNew).slice(0, 10) // Rising/new songs
        ];
        break;

      case 'primetime_popular':
      case 'prime_time_hits':
        // Top 40 hits for family viewing
        filteredSongs = chart.songs.slice(0, 40);
        break;

      case 'late_night_alternative':
      case 'stv_alternative':
        // Mix of chart hits and deeper cuts (positions 20-60)
        filteredSongs = chart.songs.slice(20, 60);
        break;

      case 'friday_party':
      case 'friday_night_kickoff':
        // Top party anthems (top 25 + rising hits)
        filteredSongs = [
          ...chart.songs.slice(0, 25),
          ...chart.songs.filter(song => song.isRising).slice(0, 10)
        ];
        break;

      case 'saturday_hits':
      case 'saturday_throwbacks':
      case 'saturday_party':
      case 'saturday_night':
        // Weekend vibes - top hits for party atmosphere
        filteredSongs = chart.songs.slice(0, 35);
        break;

      case 'sunday_morning':
      case 'sunday_afternoon':
      case 'sunday_evening':
        // More mellow chart hits (avoid brand new aggressive tracks)
        filteredSongs = chart.songs.slice(5, 40); // Skip very top but include established hits
        break;

      case 'overnight_chill':
      case 'late_night_stv':
        // Deeper chart cuts for late night (positions 30-80)
        filteredSongs = chart.songs.slice(30, 80);
        break;

      default:
        // Default to top 25
        filteredSongs = chart.songs.slice(0, 25);
    }

    // Remove duplicates and limit results
    const uniqueSongs = filteredSongs.filter((song, index, self) =>
      index === self.findIndex(s => s.title === song.title && s.artist === song.artist)
    );

    return uniqueSongs.slice(0, limit);
  }

  // Convert Billboard song to YouTube search query
  songToYouTubeQuery(song) {
    // Clean up artist and title for better search results
    const cleanTitle = song.title
      .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical content
      .replace(/\s*\[.*?\]\s*/g, '') // Remove bracket content
      .replace(/\s+/g, ' ')
      .trim();

    const cleanArtist = song.artist
      .replace(/\s*[Ff]eaturing?\s+.*$/i, '') // Remove "featuring" parts
      .replace(/\s*[Ff]t\.?\s+.*$/i, '') // Remove "ft." parts
      .replace(/\s*[Ww]ith\s+.*$/i, '') // Remove "with" parts
      .replace(/\s*&\s+.*$/i, '') // Remove "&" parts for primary artist
      .replace(/\s+/g, ' ')
      .trim();

    return `${cleanArtist} ${cleanTitle} music video`;
  }

  // Get Billboard chart metadata
  async getChartInfo() {
    const chart = await this.getCurrentChart();

    if (!chart) {
      return null;
    }

    return {
      date: chart.date,
      totalSongs: chart.songs.length,
      newEntries: chart.songs.filter(song => song.isNew).length,
      risingHits: chart.songs.filter(song => song.isRising).length,
      topSong: chart.songs[0],
      lastUpdated: new Date().toISOString()
    };
  }

  // Check if service is working
  async isAvailable() {
    try {
      const chart = await this.getCurrentChart();
      return chart && chart.songs && chart.songs.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
    console.log('📊 Billboard cache cleared');
  }
}

module.exports = BillboardService;