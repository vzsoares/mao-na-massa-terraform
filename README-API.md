# Message Mural Lambda API

This Lambda function provides a simple API for the Message Mural application, supporting both local development and AWS deployment.

## Features

- ✅ **DynamoDB Integration**: Uses AWS DynamoDB for message storage
- ✅ **Local Development**: Built-in HTTP server for local testing
- ✅ **CORS Support**: Configured for cross-origin requests
- ✅ **Input Validation**: Validates message content and author fields
- ✅ **Error Handling**: Comprehensive error handling with proper HTTP status codes
- ✅ **JSDoc Documentation**: Complete JavaScript documentation

## API Endpoints

### GET /api/messages
Retrieves all messages from the database.

**Response:**
```json
[
  {
    "id": "uuid-string",
    "content": "Message content",
    "author": "Author name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "timestamp": 1704067200000
  }
]
```

### POST /api/messages
Creates a new message.

**Request Body:**
```json
{
  "content": "Your message here",
  "author": "Your name (optional)"
}
```

**Response:**
```json
{
  "id": "uuid-string",
  "content": "Your message here",
  "author": "Your name",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "timestamp": 1704067200000
}
```

## Local Development

### Prerequisites

1. **Node.js** (v18 or later)
2. **npm** or **yarn**
3. **DynamoDB Local** (optional, for full local testing)

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local API server:**
   ```bash
   npm run api:local
   ```
   
   This will start the API server on `http://localhost:3001`

3. **Open the frontend:**
   ```bash
   npm run dev
   ```
   
   Then open `http://localhost:8080/front.html` in your browser

### Environment Variables

The following environment variables can be configured:

- `ISLOCAL`: Set to `"true"` for local development
- `TABLE_NAME`: DynamoDB table name (default: `MessageMural`)
- `AWS_REGION`: AWS region (default: `us-east-1`)
- `PORT`: Local server port (default: `3001`)

### Testing the API

**Get all messages:**
```bash
curl http://localhost:3001/api/messages
```

**Create a new message:**
```bash
curl -X POST http://localhost:3001/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, world!", "author": "Test User"}'
```

## AWS Deployment

### DynamoDB Table

Ensure your DynamoDB table has the following structure:

```
Table Name: MessageMural
Partition Key: id (String)
```

### Lambda Configuration

1. **Runtime**: Node.js 18.x or later
2. **Handler**: `lambda/message-handler.handler`
3. **Environment Variables**:
   - `TABLE_NAME`: Your DynamoDB table name
   - `AWS_REGION`: Your AWS region

### IAM Permissions

The Lambda function needs the following DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:region:account:table/MessageMural"
    }
  ]
}
```

### API Gateway Integration

Configure API Gateway with:

- **Method**: `GET`, `POST`, `OPTIONS`
- **Path**: `/api/messages`
- **Integration Type**: Lambda Function
- **CORS**: Enabled

## File Structure

```
├── lambda/
│   └── message-handler.js     # Main Lambda handler
├── local-dev.js              # Local development entry point
├── front.html                # Frontend application
└── package.json              # Dependencies and scripts
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success (GET)
- `201`: Created (POST)
- `400`: Bad Request (validation errors)
- `404`: Not Found (invalid path)
- `405`: Method Not Allowed
- `500`: Internal Server Error

## Security Features

- Input validation for message content and author
- Content length limits (1000 chars for content, 100 for author)
- CORS headers for web security
- Error message sanitization

## Development Notes

- The frontend automatically detects local vs. production environment
- Local development uses `http://localhost:3001` for API calls
- Production uses relative paths for API calls
- All functions are documented with JSDoc comments

