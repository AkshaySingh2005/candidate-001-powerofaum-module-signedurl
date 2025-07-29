const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
    
    // Create signed URL
    const signedUrl = `https://signed.powerofaum.com${filePath}?token=${token}&expires=${expires}&userId=${userId}`;
    
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/generate-signed-url?filePath=<path>&userId=<id>',
      'GET /api/validate-token?token=<token>',
      'GET /api/stats',
      'GET /health'
    ]
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
