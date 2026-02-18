# WhatsApp API 🚀

A REST API to check if phone numbers are registered on WhatsApp and send messages/images, powered by **whatsapp-web.js**.

## ✨ Features

- ✅ Check single or multiple numbers (up to 50 at once)
- � Send images via URL with optional caption
- �🔐 QR code authentication with persistent session
- 🚀 CORS enabled for cross-origin requests

## Installation

```bash
npm install
```

## Usage

### 1. Start the Server

```bash
node main.js
# or with PM2 (recommended for VPS):
pm2 start main.js --name "whatsapp-api"
```

### 2. Scan QR Code

A QR code will appear in the terminal (or PM2 logs). Scan it with WhatsApp:
**Settings → Linked Devices → Link a Device**

Once scanned, the session is saved and persists across restarts.

### 3. Use the API

API is available at `http://localhost:3000`

---

## API Endpoints

### `GET /health`
Health check — returns server and WhatsApp client status.

**Response:**
```json
{
  "status": "ok",
  "whatsappReady": true,
  "timestamp": "2026-02-18T15:00:00.000Z"
}
```

---

### `GET /status`
Returns whether the WhatsApp client is ready.

**Response:**
```json
{
  "success": true,
  "isReady": true,
  "timestamp": "2026-02-18T15:00:00.000Z"
}
```

---

### `POST /check-number`
Check if a single phone number is registered on WhatsApp.

**Request:**
```json
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
  "timestamp": "2026-02-18T15:00:00.000Z"
}
```

---

### `POST /check-numbers`
Check up to **50 numbers** in a single request.

**Request:**
```json
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
    { "number": "919876543210", "isRegistered": true },
    { "number": "918765432109", "isRegistered": false },
    { "number": "917654321098", "isRegistered": true }
  ],
  "timestamp": "2026-02-18T15:00:00.000Z"
}
```

---

### `POST /send-image`
Send an image (via URL) to a WhatsApp number with an optional caption.

**Request:**
```json
{
  "number": "919876543210",
  "imageUrl": "https://example.com/image.jpg",
  "message": "Hello! Here is your image."
}
```

> `message` is optional — the image will be sent without a caption if omitted.

**Response:**
```json
{
  "success": true,
  "number": "919876543210",
  "imageUrl": "https://example.com/image.jpg",
  "message": "Hello! Here is your image.",
  "timestamp": "2026-02-18T15:00:00.000Z"
}
```

---

## Phone Number Format

Accepts numbers in any format — all are automatically cleaned:
- `919876543210`
- `+919876543210`
- `+91 98765 43210`
- `+91-9876543210`

---

## Example Usage

### cURL

```bash
# Health check
curl http://localhost:3000/health

# Check single number
curl -X POST http://localhost:3000/check-number \
  -H "Content-Type: application/json" \
  -d '{"number": "919876543210"}'

# Check multiple numbers
curl -X POST http://localhost:3000/check-numbers \
  -H "Content-Type: application/json" \
  -d '{"numbers": ["919876543210", "918765432109"]}'

# Send image
curl -X POST http://localhost:3000/send-image \
  -H "Content-Type: application/json" \
  -d '{"number": "919876543210", "imageUrl": "https://example.com/photo.jpg", "message": "Hi!"}'
```

### JavaScript (fetch)

```javascript
// Check single number
const res = await fetch('http://localhost:3000/check-number', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ number: '919876543210' })
});
const data = await res.json();

// Send image
const res2 = await fetch('http://localhost:3000/send-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    number: '919876543210',
    imageUrl: 'https://example.com/photo.jpg',
    message: 'Hello!'
  })
});
```

### Python (requests)

```python
import requests

# Check single number
r = requests.post('http://localhost:3000/check-number', json={'number': '919876543210'})
print(r.json())

# Send image
r = requests.post('http://localhost:3000/send-image', json={
    'number': '919876543210',
    'imageUrl': 'https://example.com/photo.jpg',
    'message': 'Hello!'
})
print(r.json())
```

---

## Error Responses

| Scenario | HTTP | Response |
|---|---|---|
| WhatsApp not ready | 503 | `{ "success": false, "error": "WhatsApp client is not ready..." }` |
| Missing number | 400 | `{ "success": false, "error": "Phone number is required" }` |
| Invalid number | 400 | `{ "success": false, "error": "Invalid phone number format" }` |
| Number not on WhatsApp | 404 | `{ "success": false, "error": "Number is not registered on WhatsApp" }` |
| Server error | 500 | `{ "success": false, "error": "Internal server error" }` |

---

## Deployment (Oracle VPS / Ubuntu)

```bash
# Install dependencies
sudo apt update && sudo apt install -y chromium-browser
npm install -g pm2

# Start
pm2 start main.js --name "whatsapp-api"
pm2 save && pm2 startup

# View logs / QR code
pm2 logs whatsapp-api
```

Open port 3000 in your firewall:
```bash
sudo ufw allow 3000
```

---

## Troubleshooting

**QR code not appearing?**
- Run `pm2 logs whatsapp-api` and wait ~10 seconds for initialization

**Authentication failed?**
- Delete `.wwebjs_auth/` folder and restart to re-scan

**Browser not found error?**
- Ensure Chromium is installed: `sudo apt install -y chromium-browser`
- Verify path: `which chromium-browser`

**Client not ready (503)?**
- Wait for "WhatsApp client is ready!" in logs before making requests

---

## Session Management

- Session is stored in `.wwebjs_auth/` folder
- Scan QR code **once** — session persists across restarts
- If session expires, delete `.wwebjs_auth/` and re-scan

## Port Configuration

Default port is `3000`. Change it in `main.js`:
```javascript
const PORT = 3000;
```

---

## Built With

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API
- [Express](https://expressjs.com/) - Web framework
- [Puppeteer](https://pptr.dev/) - Headless browser automation
- [qrcode-terminal](https://github.com/gtanner/qrcode-terminal) - QR code display
