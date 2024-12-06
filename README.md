# TypeScript Lambda Functions with Serverless Framework, DynamoDB and AWS Cognito

This project demonstrates how to develop and deploy AWS Lambda functions using TypeScript with DynamoDB and AWS Cognito authentication, using the Serverless Framework.

## Features

- **AWS Lambda Functions** for HTTP request processing
- **API Gateway v2** for HTTP endpoints exposure
- **TypeScript** for static typing
- **DynamoDB** for data storage
- **AWS Cognito** for secure authentication
- **JWT Authentication** for endpoint security
- **Serverless Framework** for deployment

## Architecture

The project consists of several Lambda functions:
- `generateToken`: JWT token generation via Cognito
- `refreshToken`: Token refresh for expired tokens
- `getItems`: Item retrieval (public endpoint)
- `createItem`: Item creation (protected endpoint)

Each function is triggered by API Gateway v2 and uses `APIGatewayProxyEventV2` types to handle requests/responses.

## Prerequisites

- Node.js and npm installed
- An AWS account
- Serverless Framework CLI installed globally:
  ```bash
  npm install -g serverless
  ```
- AWS configured via:
  ```bash
  serverless login
  ```
- An AWS Cognito User Pool (see configuration below)

## Installation

Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd <repo-name>
npm install
```

## AWS Cognito Configuration

This step is **required** before using the API.

### User Pool Creation

1. Go to AWS Cognito console
2. Create a new User Pool with the following settings:
   - Select "Email" as sign-in option
   - In "Security requirements", choose "Password policy mode: Custom"
   - In "App integration", enable "ALLOW_USER_PASSWORD_AUTH"
   - Note down the User Pool ID and AWS region

3. Create an App Client:
   - Keep the generated Client Secret (it will be used for authentication)
   - In "Auth Flows Configuration", enable "ALLOW_USER_PASSWORD_AUTH"
   - Note down the Client ID and Client Secret

4. Configure environment variables in your `.env` file:

```bash
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
COGNITO_CLIENT_SECRET=your_client_secret
REGION=your_region
```

## API Flow

1. **Authentication** (Lambda: generateToken)
   
   Get a token:
   ```bash
   curl --request POST 'https://your-api.com/auth/token' \
   --header 'Content-Type: application/json' \
   --data-raw '{
     "username": "your_email",
     "password": "your_password"
   }'
   ```

2. **Public Endpoints** (Lambda: getItems)
   
   List all items:
   ```bash
   curl --request GET 'https://your-api.com/items'
   ```

3. **Protected Endpoints** (Lambda: createItem)

   Create an item (requires token):
   ```bash
   curl --request POST 'https://your-api.com/items' \
   --header 'Authorization: Bearer your_jwt_token' \
   --header 'Content-Type: application/json' \
   --data-raw '{
     "itemName": "My Item",
     "description": "Description of my item"
   }'
   ```

## Deployment

To deploy your service to AWS:

```bash
serverless deploy
```

After deployment, you'll see output similar to:

```
Service deployed to stack express-nosql-serverless-dev
endpoint: ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
functions:
  api: express-nosql-serverless-dev-api
```

## API Response Structure

All responses follow a standard format:

**Success**:
```json
{
  "success": true,
  "data": {
    // Returned data
  }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## Project Structure

```
.
├── src/
│   ├── functions/          # Lambda functions
│   │   ├── auth.ts        # Authentication functions
│   │   └── items.ts       # Item management functions
│   └── types/             # TypeScript types
├── serverless.yml         # Serverless configuration
└── package.json
```

## Notes

- Ensure your DynamoDB table is properly configured
- Verify that IAM permissions are in place for DynamoDB access

## License

This project is licensed under the MIT License.
# aws-lambda-api-dynamodb-cognito
