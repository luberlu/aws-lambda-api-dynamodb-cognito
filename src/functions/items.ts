import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyHandlerV2WithJWTAuthorizer,
} from "aws-lambda";
import { Item } from "../types/item";

const ITEMS_TABLE = process.env.ITEMS_TABLE as string;

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.REGION || 'eu-west-3'
}));

export async function getItems(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const command = new ScanCommand({
      TableName: ITEMS_TABLE,
      ProjectionExpression: "itemId, itemName, description, createdAt"
    });

    const { Items } = await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: Items,
        count: Items?.length || 0
      })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: "Could not retrieve items",
          code: "ITEMS_RETRIEVAL_ERROR"
        }
      })
    };
  }
}

export const createItem: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event
) => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    if (!body || !body.itemName) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: {
            message: "Missing required fields",
            code: "INVALID_REQUEST"
          }
        })
      };
    }

    const item: Item = {
      itemId: Date.now().toString(),
      itemName: body.itemName,
      description: body.description,
      createdAt: new Date().toISOString(),
      userId: userId as string,
    };

    const command = new PutCommand({
      TableName: ITEMS_TABLE,
      Item: item,
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: item
      })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: "Could not create item",
          code: "ITEM_CREATION_ERROR"
        }
      })
    };
  }
};
