import { randomUUID } from "node:crypto";
import { config } from "@/lib/config";

type UnknownRecord = Record<string, unknown>;
type HeadersInitLike = Record<string, string>;

type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id?: string | number | null;
  result: unknown;
};

type JsonRpcFailure = {
  jsonrpc: "2.0";
  id?: string | number | null;
  error: {
    code?: number;
    message?: string;
    data?: unknown;
  };
};

type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;

type McpTool = {
  name: string;
  description?: string;
  inputSchema?: unknown;
};

type ToolsListResult = {
  tools: McpTool[];
  nextCursor?: string;
};

type ToolContent = {
  type: string;
  text?: string;
};

type ToolCallResult = {
  content?: ToolContent[];
  isError?: boolean;
};

export class McpNotFoundError extends Error {
  public readonly status = 404;

  constructor(message = "상품을 찾지 못했습니다.") {
    super(message);
  }
}

export class McpResponseError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const MCP_TOOL_NAME = "getSaleProductDetails";
const MCP_PROTOCOL_VERSION = "2025-03-26";
const MCP_DEBUG_PREVIEW_LENGTH = 240;
const DEFAULT_MCP_URL = "http://10.225.18.50:8080/mcp";
const EMPTY_RESPONSE_RETRY_COUNT = 2;
const EMPTY_RESPONSE_RETRY_DELAY_MS = 350;
const POST_INITIALIZED_DELAY_MS = 150;

function getRequestTimeoutMs(): number {
  return Number.isFinite(config.mcp.requestTimeoutMs) && config.mcp.requestTimeoutMs > 0
    ? config.mcp.requestTimeoutMs
    : 30000;
}

function getToolCallTimeoutMs(): number {
  return Number.isFinite(config.mcp.toolCallTimeoutMs) && config.mcp.toolCallTimeoutMs > 0
    ? config.mcp.toolCallTimeoutMs
    : 60000;
}

function logMcpDebug(message: string, detail?: UnknownRecord): void {
  if (!config.mcp.debugRequests) return;

  const suffix = detail === undefined ? "" : ` ${JSON.stringify(detail)}`;
  globalThis.console.debug(`[MCP] ${message}${suffix}`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createGuid(): string {
  try {
    return randomUUID();
  } catch {
    return `tour-editor-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
}

function createJsonRpcId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function previewText(value: string): string {
  return value.length <= MCP_DEBUG_PREVIEW_LENGTH
    ? value
    : `${value.slice(0, MCP_DEBUG_PREVIEW_LENGTH)}...`;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatErrorDetail(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";

  const parts = [error.message];
  const cause = isRecord(error) ? error.cause : undefined;

  if (cause instanceof Error && cause.message.trim().length > 0) {
    parts.push(`cause=${cause.message}`);
  } else if (isRecord(cause)) {
    const code = typeof cause.code === "string" ? cause.code : undefined;
    const syscall = typeof cause.syscall === "string" ? cause.syscall : undefined;
    const address = typeof cause.address === "string" ? cause.address : undefined;
    const port = typeof cause.port === "number" ? String(cause.port) : undefined;
    const causeParts = [code, syscall, address, port].filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );

    if (causeParts.length > 0) parts.push(`cause=${causeParts.join(" ")}`);
  }

  return parts.join(" | ");
}

function makeAuthHeaders(): HeadersInitLike {
  return {
    ...(config.mcp.token ? { authorization: `Bearer ${config.mcp.token}` } : {}),
    ...(config.mcp.allowDevToken && config.mcp.devToken.length > 0
      ? { "x-dev-token": config.mcp.devToken }
      : {}),
  };
}

function makeJsonRpcHeaders(sessionId?: string): HeadersInitLike {
  return {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    ...makeAuthHeaders(),
    ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
  };
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = getRequestTimeoutMs(),
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readStreamChunkWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
): Promise<ReadableStreamReadResult<Uint8Array> | null> {
  return await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    reader
      .read()
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
}

async function readSsePayload(response: Response, timeoutMs = getRequestTimeoutMs()): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const chunks: string[] = [];
  const startedAt = Date.now();

  try {
    while (Date.now() - startedAt < timeoutMs) {
      const result = await readStreamChunkWithTimeout(reader, 150);
      if (!result) break;
      if (result.done) break;

      const chunk = decoder.decode(result.value, { stream: true });
      if (chunk.length === 0) continue;

      chunks.push(chunk);
      const raw = chunks.join("");
      if (parseJsonRpcResponses(raw).length > 0) break;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // ignore stream cancellation failures
    }
  }

  return chunks.join("");
}

async function readResponseText(response: Response, timeoutMs = getRequestTimeoutMs()): Promise<string> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/event-stream")) {
    return await readSsePayload(response, timeoutMs);
  }

  return await response.text();
}

async function readResponseTextWithTimeout(
  response: Response,
  timeoutMs: number,
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new DOMException("Response body read timed out", "AbortError"));
    }, timeoutMs);

    readResponseText(response, timeoutMs)
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function endpointFromConfiguredUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const path = url.pathname.replace(/\/+$/u, "");

    if (path === "" || path === "/") {
      url.pathname = "/mcp";
    } else if (path.endsWith("/sse")) {
      url.pathname = `${path.slice(0, -"/sse".length)}/mcp`;
    } else if (path.endsWith("/message")) {
      url.pathname = path.slice(0, -"/message".length) || "/mcp";
    } else if (!path.endsWith("/mcp")) {
      url.pathname = `${path}/mcp`;
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getMcpEndpoints(): string[] {
  const configured = (config.mcp.url?.trim() || DEFAULT_MCP_URL)
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const endpoints = configured
    .map(endpointFromConfiguredUrl)
    .filter((value): value is string => value !== null);

  return Array.from(new Set(endpoints));
}

function splitSseEvents(raw: string): string[] {
  const lines = raw.split(/\r?\n/u);
  const events: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith("data:")) {
      current.push(line.slice("data:".length).trimStart());
      continue;
    }

    if (line.trim() === "" && current.length > 0) {
      events.push(current.join("\n"));
      current = [];
    }
  }

  if (current.length > 0) events.push(current.join("\n"));
  return events;
}

function parseJsonRpcResponses(raw: string): JsonRpcResponse[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const sseEvents = splitSseEvents(trimmed);
  const candidates = sseEvents.length > 0 ? sseEvents : [trimmed];
  const responses: JsonRpcResponse[] = [];

  for (const candidate of candidates) {
    const parsed = safeJsonParse(candidate);
    const values = Array.isArray(parsed) ? parsed : [parsed];

    for (const value of values) {
      if (!isRecord(value) || value.jsonrpc !== "2.0") continue;

      if (isRecord(value.error)) {
        responses.push({
          jsonrpc: "2.0",
          id: typeof value.id === "string" || typeof value.id === "number" || value.id === null
            ? value.id
            : undefined,
          error: {
            code: typeof value.error.code === "number" ? value.error.code : undefined,
            message: typeof value.error.message === "string" ? value.error.message : undefined,
            data: value.error.data,
          },
        });
        continue;
      }

      if ("result" in value) {
        responses.push({
          jsonrpc: "2.0",
          id: typeof value.id === "string" || typeof value.id === "number" || value.id === null
            ? value.id
            : undefined,
          result: value.result,
        });
      }
    }
  }

  return responses;
}

function getSessionId(response: Response): string | undefined {
  return response.headers.get("Mcp-Session-Id")
    ?? response.headers.get("mcp-session-id")
    ?? undefined;
}

function getJsonRpcErrorMessage(response: JsonRpcResponse): string | null {
  if ("error" in response) {
    return response.error.message ?? `JSON-RPC error ${response.error.code ?? "unknown"}`;
  }
  return null;
}

async function postJsonRpc(
  endpoint: string,
  payload: UnknownRecord,
  sessionId?: string,
  timeoutMs = getRequestTimeoutMs(),
): Promise<{ response: Response; responses: JsonRpcResponse[]; raw: string }> {
  const method = String(payload.method ?? "unknown");
  logMcpDebug("POST /mcp", {
    endpoint,
    method,
    session: sessionId ? "present" : "none",
    timeoutMs,
  });

  let response: Response;
  let raw: string;

  try {
    response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: makeJsonRpcHeaders(sessionId),
      body: JSON.stringify(payload),
    }, timeoutMs);
    raw = await readResponseTextWithTimeout(response, timeoutMs);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new McpResponseError(
        `MCP ${method} 요청이 ${timeoutMs}ms 안에 완료되지 않았습니다.`,
        504,
      );
    }

    throw error;
  }

  if (!response.ok) {
    const message = raw.trim().length > 0
      ? previewText(raw.trim())
      : `HTTP ${response.status}`;
    throw new McpResponseError(`MCP ${method} 호출 실패: ${message}`, response.status);
  }

  return {
    response,
    responses: parseJsonRpcResponses(raw),
    raw,
  };
}

async function postJsonRpcWithEmptyRetry(
  endpoint: string,
  payload: UnknownRecord,
  sessionId?: string,
  timeoutMs = getRequestTimeoutMs(),
): Promise<{ response: Response; responses: JsonRpcResponse[]; raw: string }> {
  const method = String(payload.method ?? "unknown");
  let latest = await postJsonRpc(endpoint, payload, sessionId, timeoutMs);

  for (let attempt = 1; attempt <= EMPTY_RESPONSE_RETRY_COUNT && latest.responses.length === 0; attempt += 1) {
    logMcpDebug("retry empty MCP response", {
      endpoint,
      method,
      attempt,
    });
    await sleep(EMPTY_RESPONSE_RETRY_DELAY_MS * attempt);
    latest = await postJsonRpc(endpoint, payload, sessionId, timeoutMs);
  }

  return latest;
}

function buildInitializePayload(): UnknownRecord {
  return {
    jsonrpc: "2.0",
    id: createJsonRpcId("init"),
    method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "tour-editor",
        version: "1.0.0",
      },
    },
  };
}

function buildInitializedPayload(): UnknownRecord {
  return {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  };
}

function buildToolsListPayload(cursor?: string): UnknownRecord {
  return {
    jsonrpc: "2.0",
    id: createJsonRpcId("tools-list"),
    method: "tools/list",
    ...(cursor ? { params: { cursor } } : {}),
  };
}

function buildToolCallPayload(code: string, guid: string): UnknownRecord {
  return {
    jsonrpc: "2.0",
    id: createJsonRpcId("call"),
    method: "tools/call",
    params: {
      name: MCP_TOOL_NAME,
      arguments: {
        request: {
          saleProdCd: code,
          guid,
        },
      },
    },
  };
}

function requireSingleResult(responses: JsonRpcResponse[], context: string): unknown {
  if (responses.length === 0) {
    throw new McpResponseError(`${context}: MCP 응답 본문이 비어 있습니다.`, 502);
  }

  const errorMessage = responses.map(getJsonRpcErrorMessage).find((message) => message !== null);
  if (errorMessage) {
    throw new McpResponseError(`${context}: ${errorMessage}`, 502);
  }

  const success = responses.find((response): response is JsonRpcSuccess => "result" in response);
  if (!success) {
    throw new McpResponseError(`${context}: MCP result가 없습니다.`, 502);
  }

  return success.result;
}

function parseToolsListResult(value: unknown): ToolsListResult {
  if (!isRecord(value) || !Array.isArray(value.tools)) {
    throw new McpResponseError("tools/list 응답 형식이 올바르지 않습니다.", 502);
  }

  const tools = value.tools
    .filter(isRecord)
    .filter((tool): tool is UnknownRecord & { name: string } => typeof tool.name === "string")
    .map((tool) => ({
      name: tool.name,
      description: typeof tool.description === "string" ? tool.description : undefined,
      inputSchema: tool.inputSchema,
    }));

  return {
    tools,
    nextCursor: typeof value.nextCursor === "string" ? value.nextCursor : undefined,
  };
}

function parseToolCallResult(value: unknown): ToolCallResult {
  if (!isRecord(value)) {
    throw new McpResponseError("tools/call 응답 형식이 올바르지 않습니다.", 502);
  }

  const content = Array.isArray(value.content)
    ? value.content
      .filter(isRecord)
      .filter((entry): entry is UnknownRecord & { type: string } => typeof entry.type === "string")
      .map((entry) => ({
        type: entry.type,
        text: typeof entry.text === "string" ? entry.text : undefined,
      }))
    : undefined;

  return {
    content,
    isError: typeof value.isError === "boolean" ? value.isError : undefined,
  };
}

function normalizeToolPayload(result: ToolCallResult): unknown {
  if (result.isError) {
    const message = result.content
      ?.map((entry) => entry.text)
      .filter((text): text is string => typeof text === "string" && text.trim().length > 0)
      .join("\n");
    const normalizedMessage = message ?? "MCP 도구 실행에 실패했습니다.";
    if (/not\s*found|찾지|없습니다|unknown\s*tool/iu.test(normalizedMessage)) {
      throw new McpNotFoundError(normalizedMessage);
    }
    throw new McpResponseError(normalizedMessage, 502);
  }

  const text = result.content?.find((entry) => entry.type === "text" && entry.text)?.text;
  if (!text) {
    throw new McpResponseError("MCP 응답에서 text content를 찾지 못했습니다.", 502);
  }

  const parsed = safeJsonParse(text);
  if (parsed !== null) return parsed;

  throw new McpResponseError(`MCP text content가 JSON 형식이 아닙니다: ${previewText(text)}`, 502);
}

async function initializeSession(endpoint: string): Promise<string | undefined> {
  const { response, responses } = await postJsonRpc(endpoint, buildInitializePayload());
  const result = requireSingleResult(responses, "initialize");

  if (!isRecord(result) || typeof result.protocolVersion !== "string") {
    throw new McpResponseError("initialize 응답에 protocolVersion이 없습니다.", 502);
  }

  return getSessionId(response);
}

async function sendInitializedNotification(endpoint: string, sessionId?: string): Promise<void> {
  try {
    await postJsonRpc(endpoint, buildInitializedPayload(), sessionId);
  } catch (error) {
    if (error instanceof McpResponseError && error.status === 202) return;
    throw error;
  }
}

async function listTools(endpoint: string, sessionId?: string): Promise<McpTool[]> {
  const tools: McpTool[] = [];
  let cursor: string | undefined;

  do {
    const { responses } = await postJsonRpcWithEmptyRetry(endpoint, buildToolsListPayload(cursor), sessionId);
    const result = parseToolsListResult(requireSingleResult(responses, "tools/list"));
    tools.push(...result.tools);
    cursor = result.nextCursor;
  } while (cursor);

  return tools;
}

async function callSaleProductTool(
  endpoint: string,
  code: string,
  requestGuid: string,
  sessionId?: string,
): Promise<unknown> {
  const { responses } = await postJsonRpcWithEmptyRetry(
    endpoint,
    buildToolCallPayload(code, requestGuid),
    sessionId,
    getToolCallTimeoutMs(),
  );
  const result = parseToolCallResult(requireSingleResult(responses, "tools/call"));
  return normalizeToolPayload(result);
}

async function requestMcp(endpoint: string, code: string, requestGuid: string): Promise<unknown> {
  const sessionId = await initializeSession(endpoint);
  await sendInitializedNotification(endpoint, sessionId);
  await sleep(POST_INITIALIZED_DELAY_MS);

  const tools = await listTools(endpoint, sessionId);
  const tool = tools.find((entry) => entry.name === MCP_TOOL_NAME);
  if (!tool) {
    throw new McpNotFoundError(`MCP 도구를 찾지 못했습니다: ${MCP_TOOL_NAME}`);
  }

  return await callSaleProductTool(endpoint, code, requestGuid, sessionId);
}

export async function fetchSaleProductFromMcp(
  code: string,
  requestGuid?: string,
): Promise<unknown> {
  const normalizedCode = code.trim().toUpperCase();
  const requestTraceId = requestGuid?.trim().length ? requestGuid : createGuid();
  const endpoints = getMcpEndpoints();

  if (endpoints.length === 0) {
    throw new McpResponseError(
      `MCP URL이 유효하지 않습니다. HANATOUR_MCP_URL를 확인하세요. 현재 값: ${config.mcp.url}`,
      500,
    );
  }

  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      return await requestMcp(endpoint, normalizedCode, requestTraceId);
    } catch (error) {
      if (error instanceof McpNotFoundError) throw error;
      lastError = error;
      logMcpDebug("MCP endpoint failed", {
        endpoint,
        reason: formatErrorDetail(error),
      });
    }
  }

  if (lastError instanceof DOMException && lastError.name === "AbortError") {
    throw new McpResponseError("MCP 요청이 시간 초과되었습니다.", 504);
  }

  if (lastError instanceof McpResponseError || lastError instanceof McpNotFoundError) {
    throw lastError;
  }

  if (lastError instanceof Error) {
    throw new McpResponseError(
      `MCP 요청 실패: ${formatErrorDetail(lastError)}. endpoints=${endpoints.join(",")}`,
      502,
    );
  }

  throw new McpResponseError("MCP 요청 실패: 서버 응답이 없습니다.", 502);
}
