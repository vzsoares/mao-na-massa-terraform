/**
 * @fileoverview Local development entry point for Message Mural API
 * Sets environment variables and starts the local server
 */

// Set environment variables for local development
process.env.ISLOCAL = 'true';
process.env.TABLE_NAME = 'MessageMural';
process.env.PORT = '3001';
process.env.AWS_REGION = 'us-east-1';

// Start the Lambda handler in local mode
require('./lambda/message-handler.js');

console.log('🌟 Local development setup complete!');
console.log('💡 To test the API:');
console.log('   GET  http://localhost:3001/api/messages');
console.log('   POST http://localhost:3001/api/messages');
console.log('📱 Open front.html in your browser to test the frontend');

