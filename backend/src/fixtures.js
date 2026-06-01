export const TRUSTED_AGENT_IDS = ["25459", "trusted-demo", "trusted-agent"];

export const parsedFixture = {
  api_name: "GoTogether",
  api_description: "Example API",
  base_url: "https://api.example.com",
  actions: [
    {
      id: "list_tasks",
      name: "List tasks",
      description: "List all tasks",
      method: "GET",
      path: "/tasks",
      parameters: [],
      enabled: true,
      trustThreshold: 45
    },
    {
      id: "create_task",
      name: "Create task",
      description: "Create a task",
      method: "POST",
      path: "/tasks",
      parameters: [
        {
          name: "title",
          type: "string",
          required: true,
          description: "Task title",
          in: "body"
        }
      ],
      enabled: true,
      trustThreshold: 65
    },
    {
      id: "delete_task",
      name: "Delete task",
      description: "Delete a task",
      method: "DELETE",
      path: "/tasks/{id}",
      parameters: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Task id",
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
      name: "list_tasks",
      description: "List all tasks",
      endpoint: "/tasks",
      method: "GET",
      trustThreshold: 45,
      input_schema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "create_task",
      description: "Create a task",
      endpoint: "/tasks",
      method: "POST",
      trustThreshold: 65,
      input_schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Task title"
          }
        },
        required: ["title"]
      }
    },
    {
      name: "delete_task",
      description: "Delete a task",
      endpoint: "/tasks/{id}",
      method: "DELETE",
      trustThreshold: 85,
      input_schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Task id"
          }
        },
        required: ["id"]
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
      tool: "list_tasks",
      name: "List tasks",
      minScore: 45
    },
    {
      tool: "create_task",
      name: "Create task",
      minScore: 65
    },
    {
      tool: "delete_task",
      name: "Delete task",
      minScore: 85
    }
  ]
};
