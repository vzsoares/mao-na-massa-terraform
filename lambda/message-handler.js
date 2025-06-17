/**
 * @fileoverview Lambda handler for Message Mural API
 * Handles GET and POST operations for messages stored in DynamoDB
 * Supports local development with http-server when ISLOCAL=true
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const url = require('url');

/**
 * DynamoDB configuration
 * Uses local DynamoDB when ISLOCAL is true, otherwise uses AWS DynamoDB
 */
const dynamoConfig = process.env.ISLOCAL === 'true' 
  ? {
      endpoint: 'http://localhost:8000', // Local DynamoDB endpoint
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
      }
    }
  : {
      region: process.env.AWS_REGION || 'us-east-1'
    };

const dynamoClient = new DynamoDBClient(dynamoConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Table name for messages
 * @type {string}
 */
const TABLE_NAME = process.env.TABLE_NAME || 'MessageMural';

/**
 * CORS headers for API responses
 * @type {Object}
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

/**
 * Creates a standardized API response
 * @param {number} statusCode - HTTP status code
 * @param {*} body - Response body
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Lambda response object
 */
function createResponse(statusCode, body, additionalHeaders = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
    body: JSON.stringify(body)
  };
}

/**
 * Retrieves all messages from DynamoDB
 * @returns {Promise<Array>} Array of message objects
 */
async function getMessages() {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });
    
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
}

/**
 * Creates a new message in DynamoDB
 * @param {Object} messageData - Message data
 * @param {string} messageData.content - Message content
 * @param {string} messageData.author - Message author
 * @returns {Promise<Object>} Created message object
 */
async function createMessage(messageData) {
  const message = {
    id: uuidv4(),
    content: messageData.content,
    author: messageData.author || 'Anonymous',
    createdAt: new Date().toISOString(),
    timestamp: Date.now()
  };

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: message
    });
    
    await docClient.send(command);
    return message;
  } catch (error) {
    console.error('Error creating message:', error);
    throw new Error('Failed to create message');
  }
}

/**
 * Validates message data for creation
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
function validateMessage(data) {
  const errors = [];

  if (!data.content || typeof data.content !== 'string') {
    errors.push('Content is required and must be a string');
  } else if (data.content.trim().length === 0) {
    errors.push('Content cannot be empty');
  } else if (data.content.length > 1000) {
    errors.push('Content must be less than 1000 characters');
  }

  if (data.author && typeof data.author !== 'string') {
    errors.push('Author must be a string');
  } else if (data.author && data.author.length > 100) {
    errors.push('Author name must be less than 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Main Lambda handler function
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Promise<Object>} Lambda response object
 */
async function handler(event, context) {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const path = event.path;

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return createResponse(200, {});
    }

    // Route handling
    if (path === '/api/messages') {
      switch (method) {
        case 'GET':
          const messages = await getMessages();
          return createResponse(200, messages);
          
        case 'POST':
          const body = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event.body;
          
          const validation = validateMessage(body);
          if (!validation.isValid) {
            return createResponse(400, {
              error: 'Invalid message data',
              details: validation.errors
            });
          }
          
          const newMessage = await createMessage(body);
          return createResponse(201, newMessage);
          
        default:
          return createResponse(405, { error: 'Method not allowed' });
      }
    }

    return createResponse(404, { error: 'Not found' });
    
  } catch (error) {
    console.error('Handler error:', error);
    return createResponse(500, { 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Local development server
 * Runs when ISLOCAL=true to serve the API locally
 */
function startLocalServer() {
  const PORT = process.env.PORT || 3001;
  
  const server = http.createServer(async (req, res) => {
    // Parse the URL and method
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    
    // Set CORS headers
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Collect request body for POST requests
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Create a mock Lambda event
        const event = {
          httpMethod: method,
          path: parsedUrl.pathname,
          body: body || null,
          queryStringParameters: parsedUrl.query || {},
          headers: req.headers
        };
        
        // Call the Lambda handler
        const response = await handler(event, {});
        
        // Send the response
        res.writeHead(response.statusCode, response.headers);
        res.end(response.body);
        
      } catch (error) {
        console.error('Local server error:', error);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });
  
  server.listen(PORT, () => {
    console.log(`🚀 Local API server running on http://localhost:${PORT}`);
    console.log(`📝 Messages API available at http://localhost:${PORT}/api/messages`);
    console.log(`🔧 Using ${process.env.ISLOCAL === 'true' ? 'local' : 'AWS'} DynamoDB`);
  });
}

// Export handler for Lambda
module.exports = { handler };

// Start local server if running locally
if (process.env.ISLOCAL === 'true') {
  startLocalServer();
}

