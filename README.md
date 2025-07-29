# PowerOfAum - Signed Media URL Generator (Module G)

A Node.js/Express API that generates time-limited signed URLs for media files. Built for the PowerOfAum platform technical assessment.

## 🚀 Features

- **Signed URL Generation**: Creates secure, time-limited URLs for media files
- **2-minute Expiry**: URLs automatically expire after 2 minutes for security
- **Input Validation**: Validates file paths and user IDs
- **Multiple Media Types**: Supports video, audio, image, and PDF files
- **Mock Implementation**: No actual cloud storage required - fully simulated
- **Test Interface**: Beautiful HTML test page included
- **Postman Collection**: Ready-to-use API testing collection

## 📋 API Specification

### Main Endpoint

```
GET /api/generate-signed-url?filePath=/videos/intro.mp4&userId=USER_001
```

**Parameters:**
- `filePath` (required): Path to the media file (e.g., `/videos/intro.mp4`)
- `userId` (required): User identifier (3-50 alphanumeric characters)

**Response:**
```json
{
  "success": true,
  "signedUrl": "https://signed.powerofaum.com/videos/intro.mp4?token=abc123&expires=1620000000&userId=USER_001",
  "metadata": {
    "filePath": "/videos/intro.mp4",
    "userId": "USER_001",
    "expiresAt": 1620000000,
    "expiresIn": "2 minutes",
    "generatedAt": "2025-07-29T14:30:00.000Z"
  }
}
```

### Additional Endpoints

- `GET /health` - Health check
- `GET /api/validate-token?token=<token>` - Validate token
- `GET /api/stats` - API usage statistics

## 🛠️ Installation & Setup

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access Application**
   - API: http://localhost:3000/api/generate-signed-url
   - Test Interface: http://localhost:3000
   - Health Check: http://localhost:3000/health

### Production Deployment

1. **Start Production Server**
   ```bash
   npm start
   ```

## 🧪 Testing

### Using the Web Interface
1. Open http://localhost:3000 in your browser
2. Enter a file path (e.g., `/videos/intro.mp4`)
3. Enter a user ID (e.g., `USER_001`)
4. Click "Generate Signed URL"

### Using Postman
1. Import `PowerOfAum-Postman-Collection.json`
2. Set the `baseUrl` variable to your server URL
3. Run the test requests

### Using cURL
```bash
# Generate signed URL
curl "http://localhost:3000/api/generate-signed-url?filePath=/videos/intro.mp4&userId=USER_001"

# Health check
curl "http://localhost:3000/health"
```

## 📁 Supported File Types

- **Video**: mp4, avi, mov
- **Audio**: mp3, wav
- **Images**: jpg, jpeg, png
- **Documents**: pdf

## 🔒 Security Features

- **Token-based Authentication**: Each URL includes a unique token
- **Time-limited Access**: URLs expire after 2 minutes
- **Input Validation**: Prevents malicious file paths and user IDs
- **CORS Support**: Configurable cross-origin access
- **Error Handling**: Comprehensive error responses

## 🏗️ Technical Implementation

- **Framework**: Node.js with Express
- **Token Generation**: Crypto-secure random tokens
- **In-memory Storage**: Simple Map-based token tracking
- **Validation**: Regex-based input validation
- **Cleanup**: Automatic expired token removal

## 📦 Deployment

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

### Environment Variables
- `PORT`: Server port (default: 3000)

## 🎯 Module Requirements Compliance

✅ **GET endpoint**: `/api/generate-signed-url`  
✅ **Query parameters**: `filePath` and `userId`  
✅ **Mock signed URLs**: No real cloud storage needed  
✅ **2-minute expiry**: Configurable time-based expiration  
✅ **JSON response**: Structured success/error responses  
✅ **Error handling**: Comprehensive validation and error responses  
✅ **Test interface**: HTML page for easy testing  
✅ **Postman collection**: Ready-to-use API collection  

## 📝 Example Usage

```javascript
// Example API call
const response = await fetch('/api/generate-signed-url?filePath=/videos/intro.mp4&userId=USER_001');
const data = await response.json();

if (data.success) {
  console.log('Signed URL:', data.signedUrl);
  console.log('Expires at:', new Date(data.metadata.expiresAt * 1000));
}
```

## 🔧 Development

- **Start dev server**: `npm run dev`
- **Start production**: `npm start`
- **Run tests**: `npm test`

## 📄 License

MIT License - Built for PowerOfAum Technical Assessment

---

**Author**: Akshay Singh  
**Module**: G - Signed Media URL Generator  
**Platform**: PowerOfAum SaaS Engine
