# WhatsApp Number Verification API ⚡

A **lightweight, fast** REST API to check if phone numbers are registered on WhatsApp.

## ✨ Features

- ⚡ **Instant startup** - Ready in ~5 seconds (vs 2+ minutes with Puppeteer)
- 🪶 **Lightweight** - Uses Baileys library instead of heavy Chrome browser
- ✅ Check single or multiple numbers (up to 50)
- 🔐 QR code authentication with session persistence
- 🚀 CORS enabled for cross-origin requests
- 📦 **103 fewer packages** than Puppeteer-based solution

## Installation

```bash
npm install
```

## Usage

### 1. Start the Server

```bash
node main.js
```

### 2. Scan QR Code

When you start the server, a QR code will appear in the terminal. Scan it with WhatsApp on your phone to authenticate.

**Note:** The QR code appears much faster than the old Puppeteer version!

### 3. Use the API

Once authenticated, the API will be ready at `http://localhost:3000`

## API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "whatsappReady": true,
  "timestamp": "2026-02-09T15:12:00.000Z"
}
```

### Check Client Status
```http
GET /status
```

**Response:**
```json
{
  "success": true,
  "isReady": true,
  "timestamp": "2026-02-09T15:12:00.000Z"
}
```

### Check Single Number
```http
POST /check-number
Content-Type: application/json

{
  "number": "919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "number": "919876543210",
  "isRegistered": true,
  "jid": "919876543210@s.whatsapp.net",
  "timestamp": "2026-02-09T15:12:00.000Z"
}
```

### Check Multiple Numbers
```http
POST /check-numbers
Content-Type: application/json

{
  "numbers": ["919876543210", "918765432109", "917654321098"]
}
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "results": [
    {
      "number": "919876543210",
      "isRegistered": true,
      "jid": "919876543210@s.whatsapp.net"
    },
    {
      "number": "918765432109",
      "isRegistered": false,
      "jid": null
    },
    {
      "number": "917654321098",
      "isRegistered": true,
      "jid": "917654321098@s.whatsapp.net"
    }
  ],
  "timestamp": "2026-02-09T15:12:00.000Z"
}
```

## Phone Number Format

The API accepts phone numbers in various formats:
- With country code: `919876543210`
- With + sign: `+919876543210`
- With spaces/dashes: `+91 98765 43210` or `+91-9876543210`

All formats are automatically cleaned and normalized.

## Example Usage

### Using cURL

**Check single number:**
```bash
curl -X POST http://localhost:3000/check-number \
  -H "Content-Type: application/json" \
  -d '{"number": "919876543210"}'
```

**Check multiple numbers:**
```bash
curl -X POST http://localhost:3000/check-numbers \
  -H "Content-Type: application/json" \
  -d '{"numbers": ["919876543210", "918765432109"]}'
```

### Using JavaScript (fetch)

```javascript
// Check single number
const checkNumber = async (phoneNumber) => {
  const response = await fetch('http://localhost:3000/check-number', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ number: phoneNumber })
  });
  
  const data = await response.json();
  console.log(data);
};

checkNumber('919876543210');

// Check multiple numbers
const checkMultiple = async (numbers) => {
  const response = await fetch('http://localhost:3000/check-numbers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ numbers })
  });
  
  const data = await response.json();
  console.log(data);
};

checkMultiple(['919876543210', '918765432109']);
```

### Using Python (requests)

```python
import requests

# Check single number
def check_number(phone_number):
    response = requests.post(
        'http://localhost:3000/check-number',
        json={'number': phone_number}
    )
    return response.json()

result = check_number('919876543210')
print(result)

# Check multiple numbers
def check_multiple(numbers):
    response = requests.post(
        'http://localhost:3000/check-numbers',
        json={'numbers': numbers}
    )
    return response.json()

results = check_multiple(['919876543210', '918765432109'])
print(results)
```

## Performance Comparison

| Metric | Old (Puppeteer) | New (Baileys) | Improvement |
|--------|----------------|---------------|-------------|
| **Startup Time** | ~2+ minutes | ~5 seconds | **24x faster** |
| **Dependencies** | 256 packages | 153 packages | **103 fewer** |
| **Memory Usage** | ~500MB+ | ~50MB | **10x lighter** |
| **QR Code Display** | Slow | Instant | ⚡ |

## Error Responses

### WhatsApp Not Ready
```json
{
  "success": false,
  "error": "WhatsApp client is not ready. Please scan QR code first.",
  "isRegistered": false
}
```

### Invalid Number
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "isRegistered": false
}
```

### Missing Number
```json
{
  "success": false,
  "error": "Phone number is required",
  "isRegistered": false
}
```

## Technical Details

### Why Baileys is Faster

**Old Implementation (whatsapp-web.js):**
- Launches full Chrome browser via Puppeteer
- Heavy memory and CPU usage
- Slow initialization
- 256 npm packages

**New Implementation (Baileys):**
- Direct WebSocket connection to WhatsApp servers
- No browser overhead
- Lightweight and fast
- Only 153 npm packages

### Session Management

- Sessions are saved in the `auth_info_baileys` folder
- You only need to scan the QR code once
- Automatic reconnection on disconnect
- Session persists across restarts

## Port Configuration

The default port is `3000`. To change it, modify the `PORT` constant in `main.js`:

```javascript
const PORT = 3000; // Change to your desired port
```

## Troubleshooting

**QR code not appearing?**
- Wait a few seconds for the connection to establish
- Check that port 3000 is not already in use

**Authentication failed?**
- Delete the `auth_info_baileys` folder and restart
- Make sure you're scanning with the correct WhatsApp account

**Client not ready?**
- Wait for the "WhatsApp client is ready!" message
- Check the `/status` endpoint to verify client status

**Connection keeps disconnecting?**
- Check your internet connection
- WhatsApp may have rate-limited your connection
- Wait a few minutes and try again

## Credits

Built with:
- [Baileys](https://github.com/WhiskeySockets/Baileys) - Lightweight WhatsApp Web API
- [Express](https://expressjs.com/) - Web framework
- [qrcode-terminal](https://github.com/gtanner/qrcode-terminal) - QR code display
