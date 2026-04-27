// src/lib/config.ts — 환경변수 타입 안전 접근
// 모든 process.env 접근은 이 파일을 통해서만

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function resolveAuthSecret(): string {
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const legacyAuthSecret = process.env.AUTH_SECRET;

  if (!nextAuthSecret && !legacyAuthSecret) {
    throw new Error(
      "Missing required environment variable: NEXTAUTH_SECRET (AUTH_SECRET is optional fallback)"
    );
  }

  if (
    nextAuthSecret &&
    legacyAuthSecret &&
    nextAuthSecret !== legacyAuthSecret
  ) {
    throw new Error(
      "AUTH_SECRET and NEXTAUTH_SECRET must match to avoid JWT verification mismatch."
    );
  }

  return nextAuthSecret ?? legacyAuthSecret!;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const config = {
  auth: {
    secret: resolveAuthSecret(),
    url: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),
  },
  db: {
    url: requireEnv("DATABASE_URL"),
  },
  mcp: {
    useMock: optionalEnv("USE_MOCK_MCP", "true") === "true",
    url: optionalEnv("HANATOUR_MCP_URL", "http://10.225.18.50:8080/mcp"),
    token: optionalEnv("HANATOUR_MCP_TOKEN"),
    devToken: optionalEnv("HANATOUR_MCP_DEV_TOKEN"),
    allowDevToken: optionalEnv("HANATOUR_MCP_ALLOW_DEV_TOKEN", "false") === "true",
    debugRequests: optionalEnv("HANATOUR_MCP_DEBUG_REQUESTS", "false") === "true",
    requestTimeoutMs: Number(optionalEnv("HANATOUR_MCP_REQUEST_TIMEOUT_MS", "30000")),
    toolCallTimeoutMs: Number(optionalEnv("HANATOUR_MCP_TOOL_CALL_TIMEOUT_MS", "60000")),
  },
  mock: {
    flights: optionalEnv("USE_MOCK_FLIGHTS", "true") === "true",
    costRef: optionalEnv("USE_MOCK_COST_REF", "true") === "true",
  },
  ai: {
    apiKey: optionalEnv("OPENAI_API_KEY"),
    model: optionalEnv("OPENAI_MODEL", "gpt-4.1-mini"),
    baseUrl: optionalEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
    parseTimeoutMs: Number(optionalEnv("OPENAI_PARSE_TIMEOUT_MS", "30000")),
  },
  allowedOrigins: optionalEnv(
    "ALLOWED_PARENT_ORIGINS",
    "http://localhost:8080"
  ).split(","),
} as const;
