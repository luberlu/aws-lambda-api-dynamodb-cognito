import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as crypto from 'crypto';
import { CognitoIdentityProviderClient, InitiateAuthCommand, InitiateAuthCommandInput, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || 'eu-west-3'
});

export const generateToken = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Body is required',
            code: 'BODY_REQUIRED'
          }
        })
      };
    }

    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Username and password are required',
            code: 'USERNAME_PASSWORD_REQUIRED'
          }
        })
      };
    }

    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;

    const message = username + clientId;
    const secretHash = crypto.createHmac('SHA256', clientSecret!)
      .update(message)
      .digest('base64');

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    });

    const response = await cognitoClient.send(command);
    
    const getUserCommand = new GetUserCommand({
      AccessToken: response.AuthenticationResult!.AccessToken
    });
    
    const userInfo = await cognitoClient.send(getUserCommand);
    const sub = userInfo.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          token: response.AuthenticationResult?.IdToken,
          refreshToken: response.AuthenticationResult?.RefreshToken,
          expiresIn: response.AuthenticationResult?.ExpiresIn,
          sub
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: error.message || 'Internal server error',
          code: error.code || 'INTERNAL_SERVER_ERROR'
        }
      })
    };
  }
};

export const refreshToken = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Body is required',
            code: 'BODY_REQUIRED'
          }
        })
      };
    }

    const { refreshToken, sub } = JSON.parse(event.body);

    if (!refreshToken || !sub) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Refresh token and sub are required',
            code: 'REFRESH_TOKEN_SUB_REQUIRED'
          }
        })
      };
    }

    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing required environment variables');
    }

    const message = sub + clientId;
    const secretHash = crypto.createHmac('SHA256', clientSecret)
      .update(message)
      .digest('base64');

    const params: InitiateAuthCommandInput = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash
      }
    };

    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          token: response.AuthenticationResult?.IdToken,
          expiresIn: response.AuthenticationResult?.ExpiresIn
        }
      })
    };

  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: error.message || 'Error refreshing token',
          code: error.code || 'REFRESH_TOKEN_ERROR'
        }
      })
    };
  }
}; 