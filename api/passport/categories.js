// GET /api/passport/categories
//
// Calls the real passport.ego.ist MCP server's `recall` tool for this
// deployment's own OAuth-authorized user (see api/auth/*), using the
// standard MCP-over-HTTP JSON-RPC shape: initialize, then tools/call.
//
// Returns { raw } — the joined text content from the tool result, unparsed.
// The frontend does its own best-effort parsing (see parseRecallResponse in
// src/App.jsx) because the exact wording of a recall() response isn't
// public; passing the raw text through means a mismatch fails visibly
// instead of silently showing wrong data.

import crypto from "node:crypto";
import { base64urlDecode, parseCookie } from "../_lib/http.js";

const MCP_URL = " https://ego.ist/api/cards/mcp";
const CATEGORIES = [
  "preference",
  "fact",
  "event",
  "project",
  "instruction",
  "other",
  "claim",
  "purchase",
  "relationship",
];

async function mcpCall(token, method, params, sessionId) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`,
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params }),
  });

  if (res.status === 401) {
    const err = new Error("token_rejected");
    err.code = 401;
    throw err;
  }

  const newSessionId = res.headers.get("Mcp-Session-Id") || sessionId;
  const data = await res.json();
  return { data, sessionId: newSessionId };
}

export default async function handler(req, res) {
  const sessionCookie = parseCookie(req.headers.cookie, "egoist_session");
  if (!sessionCookie) {
    return res.status(401).json({ error: "not_connected", connect_url: "/api/auth/start" });
  }

  let session;
  try {
    session = JSON.parse(base64urlDecode(sessionCookie));
  } catch {
    return res.status(401).json({ error: "bad_session", connect_url: "/api/auth/start" });
  }

  try {
    const init = await mcpCall(session.access_token, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "ai-passport-consent-audit", version: "1.0.0" },
    });

    const call = await mcpCall(
      session.access_token,
      "tools/call",
      { name: "recall", arguments: { categories: CATEGORIES, purpose: "recall" } },
      init.sessionId
    );

    if (call.data.error) {
      return res.status(502).json({ error: "mcp_error", detail: call.data.error });
    }

    const blocks = (call.data.result && call.data.result.content) || [];
    const raw = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.status(200).json({ raw });
  } catch (err) {
    if (err.code === 401) {
      // Token expired/revoked — send them through auth again rather than
      // failing silently. A production version should try refresh_token
      // here first; skipped for the demo since Egoist's refresh behavior
      // hasn't been verified against the live server yet.
      return res.status(401).json({ error: "token_expired", connect_url: "/api/auth/start" });
    }
    res.status(500).json({ error: "mcp_call_failed", detail: String(err.message || err) });
  }
}
