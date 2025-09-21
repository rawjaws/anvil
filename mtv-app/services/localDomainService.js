const Bonjour = require('bonjour-service');

class LocalDomainService {
  constructor() {
    this.bonjour = null;
    this.service = null;
    this.enabled = process.env.ENABLE_LOCAL_DOMAIN !== 'false'; // Enabled by default
    this.serviceName = process.env.STV_SERVICE_NAME || 'STV - Steph TV Music Videos';
    this.domain = process.env.STV_LOCAL_DOMAIN || 'stv.local';
  }

  // Start broadcasting the service on the local network
  start(port) {
    if (!this.enabled) {
      console.log('🌐 Local domain service disabled');
      return;
    }

    try {
      this.bonjour = new Bonjour.Bonjour();

      // Advertise the HTTP service
      this.service = this.bonjour.publish({
        name: this.serviceName,
        type: 'http',
        port: port,
        txt: {
          path: '/',
          description: 'STV - Steph\'s Totally Rad 90s Music Station',
          version: '1.0',
          features: 'programming,apple-music,broadcast'
        }
      });

      this.service.on('up', () => {
        console.log(`🌐 STV - Steph\'s Rad Music Station is now available at:`);
        console.log(`   Local Domain: http://${this.serviceName.toLowerCase().replace(/\s+/g, '-')}.local:${port}`);
        console.log(`   Alternative:  http://stv.local:${port}`);
        console.log(`\n📱 Steph can now access her totally rad music station using these friendly URLs!`);
        console.log(`   💡 No need to remember IP addresses anymore!`);
      });

      this.service.on('error', (err) => {
        console.warn('🌐 mDNS service error:', err.message);
        console.log('📝 Local domain may not work, but IP access is still available');
      });

      // Also try to register a custom .local domain
      try {
        this.customService = this.bonjour.publish({
          name: 'stv',
          type: 'http',
          port: port,
          txt: {
            path: '/',
            description: 'STV - Steph\'s Rad Music Videos',
            programming: 'broadcast-style'
          }
        });

        this.customService.on('up', () => {
          console.log(`🎵 Also available at: http://stv.local:${port}`);
        });
      } catch (error) {
        console.warn('Could not register stv.local domain:', error.message);
      }

    } catch (error) {
      console.warn('🌐 Failed to start local domain service:', error.message);
      console.log('📝 App will still be accessible via IP address');
    }
  }

  // Stop the mDNS service
  stop() {
    if (this.service) {
      this.service.stop();
      this.service = null;
    }

    if (this.customService) {
      this.customService.stop();
      this.customService = null;
    }

    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }

    console.log('🌐 Local domain service stopped');
  }

  // Get service information
  getServiceInfo() {
    return {
      enabled: this.enabled,
      serviceName: this.serviceName,
      domain: this.domain,
      status: this.service ? 'running' : 'stopped'
    };
  }

  // Check if the service is running
  isRunning() {
    return this.service !== null;
  }

  // Create setup instructions for the user
  getSetupInstructions(localIP, port) {
    const instructions = {
      automatic: {
        title: "Automatic Local Domain (Recommended)",
        description: "If your devices support mDNS/Bonjour, these should work automatically:",
        urls: [
          `http://${this.serviceName.toLowerCase().replace(/\s+/g, '-')}.local:${port}`,
          `http://stv.local:${port}`
        ],
        compatibility: "Works on: iOS, macOS, Android (most), Windows 10+, Linux"
      },
      manual: {
        title: "Manual Setup (If automatic doesn't work)",
        description: "Add these entries to your router's DNS or device hosts file:",
        entries: [
          { domain: "stv.local", ip: localIP },
          { domain: "music.home", ip: localIP }
        ],
        instructions: [
          "1. Access your router's admin panel (usually 192.168.1.1 or 192.168.0.1)",
          "2. Look for 'DNS Settings' or 'Local DNS'",
          "3. Add a custom DNS entry pointing 'stv.local' to " + localIP,
          "4. Save settings and restart router if needed"
        ]
      },
      fallback: {
        title: "Direct IP Access (Always works)",
        description: "If domain names don't work, use the direct IP:",
        url: `http://${localIP}:${port}`,
        tip: "Bookmark this URL on Steph's phone for easy access"
      }
    };

    return instructions;
  }
}

module.exports = LocalDomainService;