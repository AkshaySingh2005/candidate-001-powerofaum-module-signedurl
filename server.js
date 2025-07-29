const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory store for tracking generated URLs (for demonstration)
const urlStore = new Map();

// Helper function to generate a secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to calculate expiry timestamp (2 minutes from now)
function getExpiryTimestamp() {
  return Math.floor(Date.now() / 1000) + (2 * 60); // 2 minutes
}

// Helper function to validate file path
function isValidFilePath(filePath) {
  // Basic validation: should start with / and contain valid characters
  const pathRegex = /^\/[a-zA-Z0-9\/\-_.]+\.(mp4|mp3|wav|avi|mov|pdf|jpg|jpeg|png)$/i;
  return pathRegex.test(filePath);
}

// Helper function to validate user ID
function isValidUserId(userId) {
  // Basic validation: alphanumeric with underscores, 3-50 characters
  const userIdRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return userIdRegex.test(userId);
}

// Main API endpoint: Generate Signed URL
app.get('/api/generate-signed-url', (req, res) => {
  try {
    const { filePath, userId } = req.query;

    // Validate required parameters
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: filePath'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId'
      });
    }

    // Validate file path format
    if (!isValidFilePath(filePath)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filePath format. Must be a valid path to a media file.'
      });
    }

    // Validate user ID format
    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid userId format. Must be alphanumeric with underscores, 3-50 characters.'
      });
    }

    // Generate token and expiry
    const token = generateToken();
    const expires = getExpiryTimestamp();
    
    // Extract filename from path
    const filename = filePath.split('/').pop();
    
    // Create signed URL (using our own domain for demonstration)
    const signedUrl = `https://candidate-001-powerofaum-module-sig-five.vercel.app/media${filePath}?token=${token}&expires=${expires}&userId=${userId}`;
    
    // Store in memory for potential validation (optional)
    urlStore.set(token, {
      filePath,
      userId,
      expires,
      createdAt: Date.now()
    });

    // Clean up expired tokens (basic cleanup)
    const currentTime = Math.floor(Date.now() / 1000);
    for (const [key, value] of urlStore.entries()) {
      if (value.expires < currentTime) {
        urlStore.delete(key);
      }
    }

    // Return successful response
    res.json({
      success: true,
      signedUrl: signedUrl,
      metadata: {
        filePath: filePath,
        userId: userId,
        expiresAt: expires,
        expiresIn: '2 minutes',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating signed URL'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'PowerOfAum Signed URL Generator',
    module: 'Module G',
    timestamp: new Date().toISOString()
  });
});

// Validate token endpoint (optional utility)
app.get('/api/validate-token', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Missing token parameter'
    });
  }

  const tokenData = urlStore.get(token);
  const currentTime = Math.floor(Date.now() / 1000);

  if (!tokenData) {
    return res.json({
      valid: false,
      reason: 'Token not found'
    });
  }

  if (tokenData.expires < currentTime) {
    urlStore.delete(token);
    return res.json({
      valid: false,
      reason: 'Token expired'
    });
  }

  res.json({
    valid: true,
    tokenData: {
      filePath: tokenData.filePath,
      userId: tokenData.userId,
      expiresAt: tokenData.expires,
      remainingTime: tokenData.expires - currentTime
    }
  });
});

// Stats endpoint (optional)
app.get('/api/stats', (req, res) => {
  const currentTime = Math.floor(Date.now() / 1000);
  let activeTokens = 0;
  
  for (const [key, value] of urlStore.entries()) {
    if (value.expires >= currentTime) {
      activeTokens++;
    }
  }

  res.json({
    totalTokensGenerated: urlStore.size,
    activeTokens: activeTokens,
    serverUptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root route - Serve HTML interface
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PowerOfAum - Signed URL Generator Test</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #ff6b6b, #feca57);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        
        input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-right: 10px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }
        
        .result {
            margin-top: 30px;
            padding: 20px;
            border-radius: 8px;
            display: none;
        }
        
        .result.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .result.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .url-display {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            word-break: break-all;
            font-family: monospace;
            margin: 10px 0;
        }
        
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .examples {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .loading {
            display: none;
            text-align: center;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧘‍♀️ PowerOfAum</h1>
            <p>Signed Media URL Generator - Module G Test Interface</p>
        </div>
        
        <div class="content">
            <div class="examples">
                <h3>📝 Example Usage</h3>
                <div><strong>File Path:</strong> /videos/intro.mp4</div>
                <div><strong>User ID:</strong> USER_001</div>
                <div><strong>Supported formats:</strong> mp4, mp3, wav, avi, mov, pdf, jpg, jpeg, png</div>
            </div>
            
            <form id="urlForm">
                <div class="form-group">
                    <label for="filePath">File Path *</label>
                    <input type="text" id="filePath" name="filePath" placeholder="/videos/intro.mp4" value="/videos/intro.mp4" required>
                </div>
                
                <div class="form-group">
                    <label for="userId">User ID *</label>
                    <input type="text" id="userId" name="userId" placeholder="USER_001" value="USER_001" required>
                </div>
                
                <button type="submit" class="btn">🔗 Generate Signed URL</button>
                <button type="button" class="btn" onclick="clearResults()">🗑️ Clear</button>
            </form>
            
            <div class="loading" id="loading">⏳ Generating signed URL...</div>
            <div id="result" class="result"></div>
        </div>
    </div>

    <script>
        const form = document.getElementById('urlForm');
        const resultDiv = document.getElementById('result');
        const loadingDiv = document.getElementById('loading');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const filePath = document.getElementById('filePath').value.trim();
            const userId = document.getElementById('userId').value.trim();
            
            if (!filePath || !userId) {
                showError('Please fill in all required fields');
                return;
            }
            
            showLoading(true);
            hideResult();
            
            try {
                const response = await fetch(\`/api/generate-signed-url?filePath=\${encodeURIComponent(filePath)}&userId=\${encodeURIComponent(userId)}\`);
                const data = await response.json();
                
                showLoading(false);
                
                if (data.success) {
                    showSuccess(data);
                } else {
                    showError(data.error || 'Unknown error occurred');
                }
            } catch (error) {
                showLoading(false);
                showError('Network error: ' + error.message);
            }
        });

        function showLoading(show) {
            loadingDiv.style.display = show ? 'block' : 'none';
        }

        function hideResult() {
            resultDiv.style.display = 'none';
        }

        function showSuccess(data) {
            resultDiv.className = 'result success';
            resultDiv.style.display = 'block';
            
            const metadata = data.metadata || {};
            
            resultDiv.innerHTML = \`
                <h3>✅ Signed URL Generated Successfully!</h3>
                
                <div class="url-display">
                    <strong>Signed URL:</strong><br>
                    <a href="\${data.signedUrl}" target="_blank">\${data.signedUrl}</a>
                </div>
                
                <div class="metadata">
                    <strong>📊 Metadata:</strong><br>
                    <strong>File Path:</strong> \${metadata.filePath || 'N/A'}<br>
                    <strong>User ID:</strong> \${metadata.userId || 'N/A'}<br>
                    <strong>Expires At:</strong> \${new Date(metadata.expiresAt * 1000).toLocaleString() || 'N/A'}<br>
                    <strong>Valid For:</strong> \${metadata.expiresIn || 'N/A'}<br>
                    <strong>Generated At:</strong> \${metadata.generatedAt ? new Date(metadata.generatedAt).toLocaleString() : 'N/A'}
                </div>
                
                <p><strong>⏰ Note:</strong> This URL will expire in 2 minutes for security purposes.</p>
            \`;
        }

        function showError(errorMessage) {
            resultDiv.className = 'result error';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = \`
                <h3>❌ Error</h3>
                <p>\${errorMessage}</p>
            \`;
        }

        function clearResults() {
            hideResult();
            document.getElementById('filePath').value = '/videos/intro.mp4';
            document.getElementById('userId').value = 'USER_001';
        }
    </script>
</body>
</html>`;
  
  res.send(html);
});

// Root route - API information
app.get('/info', (req, res) => {
  res.json({
    success: true,
    service: 'PowerOfAum Signed URL Generator',
    module: 'Module G',
    version: '1.0.0',
    author: 'Akshay Singh',
    description: 'A secure API for generating time-limited signed URLs for media files',
    endpoints: {
      'Generate Signed URL': 'GET /api/generate-signed-url?filePath=<path>&userId=<id>',
      'Validate Token': 'GET /api/validate-token?token=<token>',
      'API Stats': 'GET /api/stats',
      'Health Check': 'GET /health',
      'API Info': 'GET /info',
      'Test Interface': 'GET / (Web Interface)'
    },
    example: {
      url: '/api/generate-signed-url?filePath=/videos/intro.mp4&userId=USER_001',
      description: 'Generate a signed URL for a video file'
    },
    documentation: {
      'Test Interface': '/',
      'Postman Collection': 'Available in repository',
      'GitHub': 'https://github.com/AkshaySingh2005/candidate-001-powerofaum-module-signedurl'
    },
    timestamp: new Date().toISOString()
  });
});

// Media endpoint - Simulates serving the actual media file
app.get('/media/*', (req, res) => {
  const { token, expires, userId } = req.query;
  const filePath = req.path.replace('/media', '');
  
  try {
    // Validate required parameters
    if (!token || !expires || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signed URL: Missing required parameters',
        required: ['token', 'expires', 'userId']
      });
    }

    // Check if token exists in our store
    const tokenData = urlStore.get(token);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'This signed URL is no longer valid'
      });
    }

    // Check expiry
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = parseInt(expires);
    
    if (currentTime > expiryTime) {
      urlStore.delete(token); // Clean up expired token
      return res.status(410).json({
        success: false,
        error: 'Signed URL has expired',
        message: 'This URL was only valid for 2 minutes and has now expired',
        expiredAt: new Date(expiryTime * 1000).toISOString(),
        currentTime: new Date().toISOString()
      });
    }

    // Validate file path and user match
    if (tokenData.filePath !== filePath || tokenData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Token does not match the requested resource'
      });
    }

    // Success! In a real system, this would serve the actual file
    // For demo purposes, we return a success message with file info
    const fileExtension = filePath.split('.').pop().toLowerCase();
    const mediaType = getMediaType(fileExtension);
    const remainingTime = expiryTime - currentTime;

    res.json({
      success: true,
      message: '🎉 Signed URL Access Granted!',
      access: {
        filePath: filePath,
        userId: userId,
        mediaType: mediaType,
        fileSize: getRandomFileSize(),
        accessedAt: new Date().toISOString(),
        remainingTime: `${remainingTime} seconds`,
        expiresAt: new Date(expiryTime * 1000).toISOString()
      },
      simulation: {
        note: 'In a real system, this would stream/download the actual media file',
        wouldServe: `${mediaType} file: ${filePath}`,
        example: mediaType === 'video' ? 'Video would start playing' : 
                mediaType === 'audio' ? 'Audio would start streaming' :
                mediaType === 'image' ? 'Image would be displayed' :
                'File would be downloaded'
      }
    });

  } catch (error) {
    console.error('Error accessing media:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while accessing media'
    });
  }
});

// Helper function to determine media type
function getMediaType(extension) {
  const videoTypes = ['mp4', 'avi', 'mov', 'webm'];
  const audioTypes = ['mp3', 'wav', 'ogg', 'aac'];
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const docTypes = ['pdf', 'doc', 'docx'];

  if (videoTypes.includes(extension)) return 'video';
  if (audioTypes.includes(extension)) return 'audio'; 
  if (imageTypes.includes(extension)) return 'image';
  if (docTypes.includes(extension)) return 'document';
  return 'file';
}

// Helper function to simulate file size
function getRandomFileSize() {
  const sizes = ['2.3 MB', '15.7 MB', '45.2 MB', '128.9 MB', '1.2 GB'];
  return sizes[Math.floor(Math.random() * sizes.length)];
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/generate-signed-url?filePath=<path>&userId=<id>',
      'GET /api/validate-token?token=<token>',
      'GET /api/stats',
      'GET /health',
      'GET /info',
      'GET /media/* (Signed URLs only)',
      'GET / (Web Interface)'
    ],
    message: 'Visit / for the web interface or /info for API documentation'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PowerOfAum Signed URL Generator running on port ${PORT}`);
  console.log(`📝 Module G: Signed Media URL Generator`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/generate-signed-url`);
});

module.exports = app;
