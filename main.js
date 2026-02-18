const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// WhatsApp Client Setup
let client;
let isClientReady = false;

function initializeWhatsAppClient() {
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: "whatsapp-checker"
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // QR Code Event
    client.on('qr', (qr) => {
        console.log('\n📱 Scan this QR code with WhatsApp:');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Waiting for QR code scan...');
    });

    // Ready Event
    client.on('ready', () => {
        isClientReady = true;
        console.log('\n✅ WhatsApp client is ready!');
        console.log(`🚀 API Server running on http://localhost:${PORT}\n`);
    });

    // Authenticated Event
    client.on('authenticated', () => {
        console.log('🔐 WhatsApp authenticated successfully!');
    });

    // Authentication Failure Event
    client.on('auth_failure', (msg) => {
        console.error('❌ Authentication failed:', msg);
        isClientReady = false;
    });

    // Disconnected Event
    client.on('disconnected', (reason) => {
        console.log('⚠️ WhatsApp client disconnected:', reason);
        isClientReady = false;
    });

    // Initialize the client
    client.initialize();
}

// Helper function to format phone number
function formatPhoneNumber(number) {
    // Remove all non-numeric characters
    let cleaned = number.replace(/\D/g, '');
    return cleaned;
}

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        whatsappReady: isClientReady,
        timestamp: new Date().toISOString()
    });
});

// Check if number is registered on WhatsApp
app.post('/check-number', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp client is not ready. Please scan QR code first.',
                isRegistered: false
            });
        }

        const { number } = req.body;

        if (!number) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required',
                isRegistered: false
            });
        }

        // Format the phone number
        const formattedNumber = formatPhoneNumber(number);

        if (formattedNumber.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format',
                isRegistered: false
            });
        }

        // Check if number is registered on WhatsApp
        const numberId = `${formattedNumber}@c.us`;
        const isRegistered = await client.isRegisteredUser(numberId);

        res.json({
            success: true,
            number: formattedNumber,
            isRegistered: isRegistered,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error checking number:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            isRegistered: false
        });
    }
});

// Batch check multiple numbers
app.post('/check-numbers', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp client is not ready. Please scan QR code first.',
                results: []
            });
        }

        const { numbers } = req.body;

        if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'An array of phone numbers is required',
                results: []
            });
        }

        if (numbers.length > 50) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 50 numbers allowed per request',
                results: []
            });
        }

        const results = [];

        for (const number of numbers) {
            try {
                const formattedNumber = formatPhoneNumber(number);

                if (formattedNumber.length < 10) {
                    results.push({
                        number: number,
                        isRegistered: false,
                        error: 'Invalid phone number format'
                    });
                    continue;
                }

                const numberId = `${formattedNumber}@c.us`;
                const isRegistered = await client.isRegisteredUser(numberId);

                results.push({
                    number: formattedNumber,
                    isRegistered: isRegistered
                });

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                results.push({
                    number: number,
                    isRegistered: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            total: numbers.length,
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error checking numbers:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            results: []
        });
    }
});

// Send image via URL with optional message/caption
app.post('/send-image', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp client is not ready. Please scan QR code first.'
            });
        }

        const { number, imageUrl, message } = req.body;

        if (!number) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                error: 'imageUrl is required'
            });
        }

        const formattedNumber = formatPhoneNumber(number);

        if (formattedNumber.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format'
            });
        }

        const numberId = `${formattedNumber}@c.us`;

        // Verify the number is registered on WhatsApp
        const isRegistered = await client.isRegisteredUser(numberId);
        if (!isRegistered) {
            return res.status(404).json({
                success: false,
                error: 'Number is not registered on WhatsApp'
            });
        }

        // Fetch the image from the URL
        const { MessageMedia } = require('whatsapp-web.js');
        const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });

        // Send the image with optional caption
        await client.sendMessage(numberId, media, {
            caption: message || ''
        });

        res.json({
            success: true,
            number: formattedNumber,
            imageUrl: imageUrl,
            message: message || '',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error sending image:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Get client status
app.get('/status', (req, res) => {
    res.json({
        success: true,
        isReady: isClientReady,
        timestamp: new Date().toISOString()
    });
});

// Start the server and initialize WhatsApp client
app.listen(PORT, () => {
    console.log(`\n🌐 API Server started on http://localhost:${PORT}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /health - Health check`);
    console.log(`   GET  /status - WhatsApp client status`);
    console.log(`   POST /check-number - Check single number`);
    console.log(`   POST /check-numbers - Check multiple numbers (max 50)`);
    console.log(`   POST /send-image - Send image (URL) with optional message`);
    console.log(`\n🔄 Initializing WhatsApp client...\n`);

    initializeWhatsAppClient();
});

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGINT', async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('\n\n🛑 Shutting down gracefully...');

    // Suppress stderr to hide Windows process cleanup errors
    const originalStderrWrite = process.stderr.write;
    process.stderr.write = () => true;

    try {
        if (client) {
            await Promise.race([
                client.destroy(),
                new Promise(resolve => setTimeout(resolve, 3000))
            ]);
        }
        console.log('✅ Shutdown complete');
    } catch (error) {
        // Suppress errors from Puppeteer child process cleanup
    } finally {
        // Restore stderr
        process.stderr.write = originalStderrWrite;
    }

    process.exit(0);
});
