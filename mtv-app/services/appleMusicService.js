const jwt = require('jsonwebtoken');
const fs = require('fs');

class AppleMusicService {
  constructor() {
    this.apiUrl = 'https://api.music.apple.com/v1';
    this.developerToken = null;
    this.userToken = null;
    this.teamId = process.env.APPLE_TEAM_ID;
    this.keyId = process.env.APPLE_KEY_ID;
    this.privateKeyPath = process.env.APPLE_PRIVATE_KEY_PATH || './apple-music-key.p8';
  }

  // Generate Apple Music Developer Token (JWT)
  generateDeveloperToken() {
    try {
      if (!this.teamId || !this.keyId) {
        console.warn('Apple Music API credentials not configured. Running without Apple Music integration.');
        return null;
      }

      // Check if private key file exists
      if (!fs.existsSync(this.privateKeyPath)) {
        console.warn('Apple Music private key file not found. Running without Apple Music integration.');
        return null;
      }

      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');

      const payload = {
        iss: this.teamId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (6 * 30 * 24 * 60 * 60) // 6 months
      };

      const header = {
        alg: 'ES256',
        kid: this.keyId
      };

      this.developerToken = jwt.sign(payload, privateKey, { header });
      return this.developerToken;
    } catch (error) {
      console.warn('Failed to generate Apple Music developer token:', error.message);
      return null;
    }
  }

  // Get Apple Music charts
  async getCharts(storefront = 'us', types = 'songs', limit = 50) {
    try {
      if (!this.developerToken) {
        this.generateDeveloperToken();
      }

      if (!this.developerToken) {
        return null;
      }

      const url = `${this.apiUrl}/catalog/${storefront}/charts?types=${types}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.developerToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Apple Music API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error fetching Apple Music charts:', error);
      return null;
    }
  }

  // Search Apple Music catalog
  async search(term, types = 'songs', storefront = 'us', limit = 25) {
    try {
      if (!this.developerToken) {
        this.generateDeveloperToken();
      }

      if (!this.developerToken) {
        return null;
      }

      const encodedTerm = encodeURIComponent(term);
      const url = `${this.apiUrl}/catalog/${storefront}/search?term=${encodedTerm}&types=${types}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.developerToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Apple Music API search error: ${response.status}`);
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error searching Apple Music:', error);
      return null;
    }
  }

  // Get trending songs for MTV programming
  async getTrendingSongsForMTV(programmingBlock) {
    try {
      const charts = await this.getCharts('us', 'songs', 100);

      if (!charts || !charts.songs || !charts.songs[0]) {
        return [];
      }

      const topSongs = charts.songs[0].data;

      // Filter songs based on MTV programming block
      const filteredSongs = this.filterSongsForProgrammingBlock(topSongs, programmingBlock);

      return filteredSongs.map(song => ({
        title: song.attributes.name,
        artist: song.attributes.artistName,
        album: song.attributes.albumName,
        duration: song.attributes.durationInMillis,
        isrc: song.attributes.isrc,
        releaseDate: song.attributes.releaseDate,
        genres: song.attributes.genreNames,
        appleId: song.id,
        artwork: song.attributes.artwork?.url
      }));
    } catch (error) {
      console.error('Error getting trending songs for MTV:', error);
      return [];
    }
  }

  // Filter songs based on MTV programming block
  filterSongsForProgrammingBlock(songs, programmingBlock) {
    const currentHour = new Date().getHours();

    switch (programmingBlock) {
      case 'morning_hits': // 6AM-10AM: Pop hits, upbeat songs, dance music
        return songs.filter(song => {
          const genres = song.attributes.genreNames || [];
          return genres.some(genre =>
            genre.toLowerCase().includes('pop') ||
            genre.toLowerCase().includes('dance') ||
            genre.toLowerCase().includes('electronic')
          );
        }).slice(0, 20);

      case 'midday_mainstream': // 10AM-2PM: Current top 40, mainstream pop/rock
        return songs.filter(song => {
          const genres = song.attributes.genreNames || [];
          return genres.some(genre =>
            genre.toLowerCase().includes('pop') ||
            genre.toLowerCase().includes('rock') ||
            genre.toLowerCase().includes('alternative')
          );
        }).slice(0, 20);

      case 'afternoon_youth': // 2PM-6PM: Youth-oriented, pop punk, alternative
        return songs.filter(song => {
          const genres = song.attributes.genreNames || [];
          return genres.some(genre =>
            genre.toLowerCase().includes('alternative') ||
            genre.toLowerCase().includes('punk') ||
            genre.toLowerCase().includes('indie') ||
            genre.toLowerCase().includes('hip hop')
          );
        }).slice(0, 20);

      case 'primetime_popular': // 6PM-9PM: Popular music across genres
        return songs.slice(0, 30); // Top songs regardless of genre

      case 'late_night_alternative': // 9PM-12AM: Alternative, indie, hip-hop
        return songs.filter(song => {
          const genres = song.attributes.genreNames || [];
          return genres.some(genre =>
            genre.toLowerCase().includes('alternative') ||
            genre.toLowerCase().includes('indie') ||
            genre.toLowerCase().includes('hip hop') ||
            genre.toLowerCase().includes('r&b')
          );
        }).slice(0, 20);

      case 'overnight_chill': // 12AM-6AM: Chill, ambient, slower tempo
        return songs.filter(song => {
          const genres = song.attributes.genreNames || [];
          const duration = song.attributes.durationInMillis || 0;
          return duration > 180000 && // Longer than 3 minutes
            genres.some(genre =>
              genre.toLowerCase().includes('chill') ||
              genre.toLowerCase().includes('ambient') ||
              genre.toLowerCase().includes('jazz') ||
              genre.toLowerCase().includes('soul')
            );
        }).slice(0, 15);

      default:
        return songs.slice(0, 25);
    }
  }

  // Get current MTV programming block
  getMTVProgrammingBlock() {
    const hour = new Date().getHours();
    const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend variations
    if (day === 0) { // Sunday - relaxed programming
      if (hour >= 6 && hour < 12) return 'sunday_morning';
      if (hour >= 12 && hour < 18) return 'sunday_afternoon';
      if (hour >= 18 && hour < 22) return 'sunday_evening';
      return 'overnight_chill';
    }

    if (day === 6) { // Saturday - mix of hits and throwbacks
      if (hour >= 10 && hour < 14) return 'saturday_hits';
      if (hour >= 14 && hour < 20) return 'saturday_party';
      if (hour >= 20 && hour < 24) return 'saturday_night';
      return 'overnight_chill';
    }

    if (day === 5 && hour >= 18) { // Friday evening - party hits
      return 'friday_party';
    }

    // Weekday programming
    if (hour >= 6 && hour < 10) return 'morning_hits';
    if (hour >= 10 && hour < 14) return 'midday_mainstream';
    if (hour >= 14 && hour < 18) return 'afternoon_youth';
    if (hour >= 18 && hour < 21) return 'primetime_popular';
    if (hour >= 21 && hour < 24) return 'late_night_alternative';
    return 'overnight_chill';
  }

  // Convert Apple Music song to YouTube search query
  songToYouTubeQuery(song) {
    return `${song.artist} ${song.title} music video`;
  }

  // Check if Apple Music integration is available
  isAvailable() {
    return this.teamId && this.keyId && fs.existsSync(this.privateKeyPath);
  }
}

module.exports = AppleMusicService;