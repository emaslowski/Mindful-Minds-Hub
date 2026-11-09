/**
 * Executes assistant tool requests against this server's own API, as the
 * requesting teacher. The teacher's session cookie / studio bearer header is
 * forwarded unchanged, so authorization is exactly the teacher's own.
 */
import type { Request } from 'express';
import type { SiteRequest } from './tools';

export interface SiteCaller {
  cookie?: string;
  authorization?: string;
}

export interface SiteResult {
  ok: boolean;
  status: number;
  body: unknown;
}

const MAX_RESULT_CHARS = 60_000;

export function siteCallerFromRequest(req: Request): SiteCaller {
  return {
    cookie: req.headers.cookie,
    authorization: typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
  };
}

function baseUrl(): string {
  const port = process.env.PORT || '8080';
  return process.env.SITE_API_INTERNAL_URL || `http://127.0.0.1:${port}/api`;
}

export async function callSiteApi(caller: SiteCaller, request: SiteRequest): Promise<SiteResult> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (caller.cookie) headers.cookie = caller.cookie;
  if (caller.authorization) headers.authorization = caller.authorization;
  if (request.body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(`${baseUrl()}${request.path}`, {
    method: request.method,
    headers,
    body: request.body !== undefined ? JSON.stringify(request.body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  const text = await res.text();
  let body: unknown = text;
  try { body = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, body };
}

/** Compact a tool result for the model's context; large pages are trimmed. */
export function formatToolResult(result: SiteResult): string {
  const payload = result.ok
    ? result.body
    : { error: errorMessage(result), status: result.status };
  let text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (text.length > MAX_RESULT_CHARS) {
    text = text.slice(0, MAX_RESULT_CHARS) + `\n…[truncated ${text.length - MAX_RESULT_CHARS} characters]`;
  }
  return text;
}

export function errorMessage(result: SiteResult): string {
  const body = result.body as { error?: unknown } | string | null;
  if (body && typeof body === 'object' && typeof body.error === 'string') return body.error;
  if (typeof body === 'string' && body.trim()) return body.slice(0, 300);
  return `Request failed with status ${result.status}`;
}
