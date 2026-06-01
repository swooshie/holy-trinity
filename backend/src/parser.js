import SwaggerParser from "@apidevtools/swagger-parser";

export const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

export const DEFAULT_THRESHOLDS = {
  GET: 45,
  POST: 65,
  PUT: 65,
  PATCH: 65,
  DELETE: 85
};

export async function parseSpec(input) {
  const rawSpec = normalizeInput(input);
  const spec = await dereferenceSpec(rawSpec);

  const actions = [];
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem?.[method];
      if (!operation) {
        continue;
      }

      const upperMethod = method.toUpperCase();
      const operationParameters = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || [])
      ];

      actions.push({
        id: stableActionId(operation.operationId || `${upperMethod} ${path}`),
        name: operation.summary || humanize(operation.operationId || `${upperMethod} ${path}`),
        description: operation.description || operation.summary || `${upperMethod} ${path}`,
        method: upperMethod,
        path,
        parameters: [
          ...extractParameters(operationParameters),
          ...extractBodyParameters(operation.requestBody)
        ],
        enabled: true,
        trustThreshold: DEFAULT_THRESHOLDS[upperMethod]
      });
    }
  }

  return {
    api_name: spec.info?.title || "Untitled API",
    api_description: spec.info?.description || spec.info?.summary || "",
    base_url: spec.servers?.[0]?.url || "",
    actions
  };
}

function normalizeInput(input) {
  if (!input) {
    throw Object.assign(new Error("OpenAPI spec is required"), { statusCode: 400 });
  }

  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch (error) {
      throw Object.assign(new Error(`Spec must be valid JSON: ${error.message}`), { statusCode: 400 });
    }
  }

  return input;
}

async function dereferenceSpec(spec) {
  try {
    return await SwaggerParser.dereference(spec);
  } catch (error) {
    throw Object.assign(new Error(`OpenAPI dereference failed: ${error.message}`), { statusCode: 400 });
  }
}

function extractParameters(parameters) {
  return parameters.map((parameter) => ({
    name: parameter.name,
    type: schemaType(parameter.schema),
    required: Boolean(parameter.required),
    description: parameter.description || "",
    in: parameter.in || "query"
  }));
}

function extractBodyParameters(requestBody) {
  const schema = requestBody?.content?.["application/json"]?.schema;
  if (!schema) {
    return [];
  }

  if (schema.type === "object" && schema.properties) {
    const required = new Set(schema.required || []);
    return Object.entries(schema.properties).map(([name, propertySchema]) => ({
      name,
      type: schemaType(propertySchema),
      required: required.has(name) || Boolean(requestBody.required),
      description: propertySchema.description || "",
      in: "body"
    }));
  }

  return [
    {
      name: "body",
      type: schemaType(schema),
      required: Boolean(requestBody.required),
      description: requestBody.description || "Request body.",
      in: "body"
    }
  ];
}

function schemaType(schema = {}) {
  if (schema.type) {
    return schema.type === "integer" ? "number" : schema.type;
  }

  if (schema.properties) {
    return "object";
  }

  if (schema.items) {
    return "array";
  }

  return "string";
}

export function stableActionId(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function humanize(value) {
  return stableActionId(value)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
