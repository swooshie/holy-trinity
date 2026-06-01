export const TRUSTED_AGENT_IDS = ["25459", "trusted-demo", "trusted-agent"];

export const parsedFixture = {
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
      parameters: [
        {
          name: "city",
          type: "string",
          required: false,
          description: "City to search for rides in.",
          in: "query"
        }
      ],
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
        {
          name: "origin",
          type: "string",
          required: true,
          description: "Ride origin.",
          in: "body"
        },
        {
          name: "destination",
          type: "string",
          required: true,
          description: "Ride destination.",
          in: "body"
        },
        {
          name: "seats",
          type: "number",
          required: true,
          description: "Number of seats available.",
          in: "body"
        }
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
      parameters: [
        {
          name: "rideId",
          type: "string",
          required: true,
          description: "Ride identifier.",
          in: "path"
        }
      ],
      enabled: true,
      trustThreshold: 85
    }
  ]
};

export const generatedFixture = {
  server_dir: "backend/generated/gotogether",
  server_code: "// generated server omitted in fixture mode",
  tools: [
    {
      name: "list_rides",
      description: "List available rides.",
      endpoint: "/rides",
      method: "GET",
      trustThreshold: 45,
      input_schema: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City to search for rides in."
          }
        },
        required: []
      }
    },
    {
      name: "create_ride",
      description: "Create a new ride listing.",
      endpoint: "/rides",
      method: "POST",
      trustThreshold: 65,
      input_schema: {
        type: "object",
        properties: {
          origin: {
            type: "string",
            description: "Ride origin."
          },
          destination: {
            type: "string",
            description: "Ride destination."
          },
          seats: {
            type: "number",
            description: "Number of seats available."
          }
        },
        required: ["origin", "destination", "seats"]
      }
    },
    {
      name: "delete_ride",
      description: "Delete a ride listing.",
      endpoint: "/rides/{rideId}",
      method: "DELETE",
      trustThreshold: 85,
      input_schema: {
        type: "object",
        properties: {
          rideId: {
            type: "string",
            description: "Ride identifier."
          }
        },
        required: ["rideId"]
      }
    }
  ],
  config_snippet: {
    mcpServers: {
      gotogether: {
        url: "http://localhost:3001/mcp"
      }
    }
  },
  trust_config: [
    {
      tool: "list_rides",
      name: "List rides",
      minScore: 45
    },
    {
      tool: "create_ride",
      name: "Create ride",
      minScore: 65
    },
    {
      tool: "delete_ride",
      name: "Delete ride",
      minScore: 85
    }
  ]
};
