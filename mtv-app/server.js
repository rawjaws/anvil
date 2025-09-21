const express = require('express');
const cors = require('cors');
const axios = require('axios');
const WebSocket = require('ws');
const NodeCache = require('node-cache');
const path = require('path');
const os = require('os');
const STVProgrammingService = require('./services/mtvProgrammingService');
const YouTubeService = require('./services/youtubeService');
const LocalDomainService = require('./services/localDomainService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cache for video data (1 hour TTL)
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));


// In-memory storage for connected devices and playlists
let connectedDevices = new Map();
let currentPlaylist = [];
let currentVideoIndex = 0;

// STV Programming Services
const youtubeService = new YouTubeService();
const stvProgramming = new STVProgrammingService(youtubeService);
const localDomainService = new LocalDomainService();

// Broadcast programming state
let currentProgrammingBlock = null;
let lastProgrammingUpdate = 0;
let programmingInterval = null;

// Helper function to get local network IP
function getLocalNetworkIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

// Initialize STV programming updates
function startSTVProgrammingUpdates() {
    // Check for programming block changes every 5 minutes
    programmingInterval = setInterval(async () => {
        if (stvProgramming.shouldUpdateProgramming()) {
            console.log('📺 STV Programming block changed - updating Steph\'s content...');

            // Clear cache to force refresh
            cache.del('stv_programming_content');

            // Fetch new programming content
            const newContent = await fetchSTVProgrammingContent();

            if (newContent && newContent.length > 0) {
                currentPlaylist = newContent;
                currentVideoIndex = 0;

                // Broadcast programming update to all devices
                broadcastToDevices({
                    type: 'programming_updated',
                    playlist: currentPlaylist,
                    currentIndex: currentVideoIndex,
                    currentVideo: currentPlaylist[currentVideoIndex],
                    programmingBlock: stvProgramming.getCurrentProgrammingBlock()
                });

                console.log(`📺 STV Updated to ${stvProgramming.getCurrentProgrammingBlock().name} for Steph`);
            }
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Stop STV programming updates
function stopSTVProgrammingUpdates() {
    if (programmingInterval) {
        clearInterval(programmingInterval);
        programmingInterval = null;
    }
}

// STV Programming-based video fetching
async function fetchSTVProgrammingContent() {
    const cacheKey = 'stv_programming_content';
    const cached = cache.get(cacheKey);

    // Check if we need to update programming based on time block
    if (cached && !stvProgramming.shouldUpdateProgramming()) {
        console.log('📺 Returning cached STV programming content for Steph');
        return cached;
    }

    try {
        console.log('📺 Fetching new STV programming content for Steph...');
        const content = await stvProgramming.getProgrammingContent(25);

        // Cache for 30 minutes
        cache.set(cacheKey, content, 1800);

        return content;
    } catch (error) {
        console.error('Error fetching STV programming content:', error);
        // Fallback to YouTube service if STV programming fails
        return await youtubeService.getPopularMusicVideos();
    }
}

// Legacy function for backward compatibility
async function fetchPopularMusicVideos() {
    return await fetchSTVProgrammingContent();
}


// API Routes
app.get('/api/playlist', async (req, res) => {
    try {
        if (currentPlaylist.length === 0) {
            currentPlaylist = await fetchPopularMusicVideos();
        }
        res.json({
            playlist: currentPlaylist,
            currentIndex: currentVideoIndex,
            currentVideo: currentPlaylist[currentVideoIndex] || null,
            programmingBlock: stvProgramming.getCurrentProgrammingBlock()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch playlist' });
    }
});

app.post('/api/playlist/refresh', async (req, res) => {
    try {
        cache.del('stv_programming_content');
        currentPlaylist = await fetchSTVProgrammingContent();
        currentVideoIndex = 0;

        // Broadcast to all connected devices
        broadcastToDevices({
            type: 'playlist_updated',
            playlist: currentPlaylist,
            currentIndex: currentVideoIndex,
            programmingBlock: stvProgramming.getCurrentProgrammingBlock()
        });

        res.json({
            message: 'STV Programming refreshed for Steph',
            playlist: currentPlaylist,
            programmingBlock: stvProgramming.getCurrentProgrammingBlock()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to refresh STV programming' });
    }
});

// New STV Programming API endpoints
app.get('/api/stv/programming', (req, res) => {
    const currentBlock = stvProgramming.getCurrentProgrammingBlock();
    const nextBlock = stvProgramming.getNextProgrammingBlock();
    const schedule = stvProgramming.getProgrammingSchedule();

    res.json({
        current: currentBlock,
        next: nextBlock,
        schedule: schedule
    });
});

app.get('/api/stv/programming/current', (req, res) => {
    const currentBlock = stvProgramming.getCurrentProgrammingBlock();
    res.json(currentBlock);
});

app.get('/api/stv/programming/schedule', (req, res) => {
    const schedule = stvProgramming.getProgrammingSchedule();
    res.json(schedule);
});

// Billboard Hot 100 API endpoints
app.get('/api/billboard/current-chart', async (req, res) => {
    try {
        const chart = await stvProgramming.billboardService.getCurrentChart();
        if (chart) {
            res.json(chart);
        } else {
            res.status(503).json({ error: 'Billboard chart data not available' });
        }
    } catch (error) {
        console.error('Error fetching Billboard chart:', error);
        res.status(500).json({ error: 'Failed to fetch Billboard chart' });
    }
});

app.get('/api/billboard/chart-info', async (req, res) => {
    try {
        const chartInfo = await stvProgramming.billboardService.getChartInfo();
        if (chartInfo) {
            res.json(chartInfo);
        } else {
            res.status(503).json({ error: 'Billboard chart info not available' });
        }
    } catch (error) {
        console.error('Error fetching Billboard chart info:', error);
        res.status(500).json({ error: 'Failed to fetch Billboard chart info' });
    }
});

app.get('/api/billboard/programming/:blockId', async (req, res) => {
    try {
        const { blockId } = req.params;
        const limit = parseInt(req.query.limit) || 25;

        const songs = await stvProgramming.billboardService.getSongsForProgrammingBlock(blockId, limit);
        res.json({
            programmingBlock: blockId,
            songs: songs,
            count: songs.length
        });
    } catch (error) {
        console.error('Error fetching Billboard songs for programming block:', error);
        res.status(500).json({ error: 'Failed to fetch Billboard programming content' });
    }
});

// Local domain service API endpoints
app.get('/api/local-domain/info', (req, res) => {
    const localIP = getLocalNetworkIP();
    const serviceInfo = localDomainService.getServiceInfo();
    const setupInstructions = localDomainService.getSetupInstructions(localIP, PORT);

    res.json({
        serviceInfo,
        setupInstructions,
        currentIP: localIP,
        port: PORT
    });
});

app.get('/api/local-domain/instructions', (req, res) => {
    const localIP = getLocalNetworkIP();
    const instructions = localDomainService.getSetupInstructions(localIP, PORT);
    res.json(instructions);
});

app.post('/api/player/skip', (req, res) => {
    try {
        if (currentPlaylist.length > 0) {
            currentVideoIndex = (currentVideoIndex + 1) % currentPlaylist.length;
            const currentVideo = currentPlaylist[currentVideoIndex];

            console.log(`⏭️ Skipping to video ${currentVideoIndex + 1}/${currentPlaylist.length}: ${currentVideo.title}`);

            // Broadcast to all connected devices
            broadcastToDevices({
                type: 'video_changed',
                currentVideo,
                currentIndex: currentVideoIndex
            });

            res.json({ currentVideo, currentIndex: currentVideoIndex });
        } else {
            console.warn('⚠️ Skip requested but no playlist available');
            res.status(400).json({ error: 'No playlist available' });
        }
    } catch (error) {
        console.error('❌ Error in skip function:', error);
        res.status(500).json({ error: 'Internal server error during skip' });
    }
});

app.get('/api/network/info', (req, res) => {
    const localIP = getLocalNetworkIP();
    res.json({
        ip: localIP,
        port: PORT,
        connectedDevices: connectedDevices.size,
        url: `http://${localIP}:${PORT}`
    });
});

app.get('/api/network/devices', (req, res) => {
    const devices = Array.from(connectedDevices.values());
    res.json(devices);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// WebSocket server for real-time communication
const server = app.listen(PORT, () => {
    const localIP = getLocalNetworkIP();
    console.log(`🎵 STV - Steph's Totally Rad Music Station running on:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://${localIP}:${PORT}`);
    console.log(`\n📱 Steph can access her rad music station from her phone at: http://${localIP}:${PORT}`);
    console.log(`\n💡 Make sure your computer and her phone are on the same WiFi network!`);

    // Start local domain service for easy access
    localDomainService.start(PORT);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const deviceId = Math.random().toString(36).substr(2, 9);
    const deviceInfo = {
        id: deviceId,
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        connectedAt: new Date(),
        ws: ws
    };

    connectedDevices.set(deviceId, deviceInfo);
    console.log(`📱 Device connected: ${deviceId} (${deviceInfo.ip})`);

    // Send current state to new device
    ws.send(JSON.stringify({
        type: 'initial_state',
        playlist: currentPlaylist,
        currentIndex: currentVideoIndex,
        currentVideo: currentPlaylist[currentVideoIndex] || null,
        programmingBlock: stvProgramming.getCurrentProgrammingBlock()
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleDeviceMessage(deviceId, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        connectedDevices.delete(deviceId);
        console.log(`📱 Device disconnected: ${deviceId}`);
    });
});

function handleDeviceMessage(deviceId, message) {
    try {
        switch (message.type) {
            case 'skip':
                // Handle skip request from any device
                if (currentPlaylist.length > 0) {
                    currentVideoIndex = (currentVideoIndex + 1) % currentPlaylist.length;
                    const currentVideo = currentPlaylist[currentVideoIndex];

                    console.log(`⏭️ STV WebSocket skip from device ${deviceId} to: ${currentVideo.title}`);

                    broadcastToDevices({
                        type: 'video_changed',
                        currentVideo: currentVideo,
                        currentIndex: currentVideoIndex
                    });
                } else {
                    console.warn(`⚠️ STV Skip requested from device ${deviceId} but no playlist available`);
                }
                break;
            case 'sync_state':
                // Broadcast current state to all devices
                broadcastToDevices({
                    type: 'state_sync',
                    ...message.state
                });
                break;
            default:
                console.log(`🔍 STV Unknown message type from device ${deviceId}:`, message.type);
        }
    } catch (error) {
        console.error(`❌ STV Error handling message from device ${deviceId}:`, error);
    }
}

function broadcastToDevices(message) {
    connectedDevices.forEach((device) => {
        if (device.ws.readyState === WebSocket.OPEN) {
            device.ws.send(JSON.stringify(message));
        }
    });
}

// Initialize STV programming on startup
fetchSTVProgrammingContent().then(videos => {
    currentPlaylist = videos;
    const programmingBlock = stvProgramming.getCurrentProgrammingBlock();
    console.log(`📺 STV Loaded ${videos.length} videos for ${programmingBlock.name} - Steph's gonna love this!`);
    console.log(`📺 ${programmingBlock.description}`);

    // Start programming updates
    startSTVProgrammingUpdates();
}).catch(error => {
    console.error('Failed to initialize STV programming:', error);
    // Fallback to basic YouTube videos
    youtubeService.getPopularMusicVideos().then(videos => {
        currentPlaylist = videos;
        console.log(`🎵 STV Loaded ${videos.length} fallback videos for Steph`);
    });
});

// Cleanup on server shutdown
process.on('SIGINT', () => {
    console.log('\n📺 Shutting down STV programming...');
    stopSTVProgrammingUpdates();
    localDomainService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n📺 Shutting down STV programming...');
    stopSTVProgrammingUpdates();
    localDomainService.stop();
    process.exit(0);
});