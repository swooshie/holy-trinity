export const sampleSpec = `{
  "openapi": "3.0.3",
  "info": {
    "title": "GoTogether",
    "description": "Example ride coordination API for the Agentify + Valiron demo.",
    "version": "1.0.0"
  },
  "servers": [{ "url": "https://api.gotogether.example.com" }],
  "paths": {
    "/rides": {
      "get": {
        "operationId": "listRides",
        "summary": "List rides",
        "description": "List available rides.",
        "parameters": [
          {
            "name": "city",
            "in": "query",
            "required": false,
            "description": "City to search for rides in.",
            "schema": { "type": "string" }
          }
        ],
        "responses": { "200": { "description": "Ride list." } }
      },
      "post": {
        "operationId": "createRide",
        "summary": "Create ride",
        "description": "Create a new ride listing.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["origin", "destination", "seats"],
                "properties": {
                  "origin": { "type": "string", "description": "Ride origin." },
                  "destination": { "type": "string", "description": "Ride destination." },
                  "seats": { "type": "number", "description": "Number of seats available." }
                }
              }
            }
          }
        },
        "responses": { "201": { "description": "Ride created." } }
      }
    },
    "/rides/{rideId}": {
      "delete": {
        "operationId": "deleteRide",
        "summary": "Delete ride",
        "description": "Delete a ride listing.",
        "parameters": [
          {
            "name": "rideId",
            "in": "path",
            "required": true,
            "description": "Ride identifier.",
            "schema": { "type": "string" }
          }
        ],
        "responses": { "204": { "description": "Ride deleted." } }
      }
    }
  }
}`;

export const mockParsedApi = {
  api_name: "GoTogether",
  api_description: "Example ride coordination API for the Agentify + Valiron demo.",
  base_url: "https://api.gotogether.example.com",
  actions: [
    {
      id: "list_rides",
      name: "List rides",
      description: "List available rides.",
      method: "GET",
      path: "/rides",
      parameters: [{ name: "city", type: "string", required: false, description: "City to search for rides in.", in: "query" }],
      enabled: true,
      trustThreshold: 45
    },
    {
      id: "create_ride",
      name: "Create ride",
      description: "Create a new ride listing.",
      method: "POST",
      path: "/rides",
      parameters: [
        { name: "origin", type: "string", required: true, description: "Ride origin.", in: "body" },
        { name: "destination", type: "string", required: true, description: "Ride destination.", in: "body" },
        { name: "seats", type: "number", required: true, description: "Number of seats available.", in: "body" }
      ],
      enabled: true,
      trustThreshold: 65
    },
    {
      id: "delete_ride",
      name: "Delete ride",
      description: "Delete a ride listing.",
      method: "DELETE",
      path: "/rides/{rideId}",
      parameters: [{ name: "rideId", type: "string", required: true, description: "Ride identifier.", in: "path" }],
      enabled: true,
      trustThreshold: 85
    }
  ]
};

export const mockGenerated = {
  server_dir: "backend/generated/gotogether",
  server_code: "// Generated trust-gated MCP server.",
  tools: mockParsedApi.actions.map((action) => ({
    name: action.id,
    description: action.description,
    endpoint: action.path,
    method: action.method,
    trustThreshold: action.trustThreshold,
    input_schema: {
      type: "object",
      properties: Object.fromEntries(action.parameters.map((parameter) => [parameter.name, { type: parameter.type, description: parameter.description }])),
      required: action.parameters.filter((parameter) => parameter.required).map((parameter) => parameter.name)
    }
  })),
  config_snippet: {
    mcpServers: {
      gotogether: {
        url: "http://localhost:3001/mcp"
      }
    }
  },
  trust_config: mockParsedApi.actions.map((action) => ({
    tool: action.id,
    name: action.name,
    minScore: action.trustThreshold
  }))
};
