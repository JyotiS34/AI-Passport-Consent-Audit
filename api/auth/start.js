// GET /api/auth/start
//
// Kicks off OAuth with the real AI Passport MCP server so THIS deployment
// (not Claude.ai) gets its own access token and can call recall() live.
//
// This follows the MCP Authorization spec: discover the resource's auth
// server via .well-known metadata, register a client dynamically (RFC 7591)
// if one isn't configured, then redirect with PKCE. That's the standard
// most remote MCP servers use — but passport.ego.ist is a very new API
// (Egoist Machines shipped this in July 2026) and its exact discovery URLs
// and scope names aren't publicly documented, so treat steps 1-2 as
// best-effort until you've run this against the real server once.
//
// If discovery or dynamic registration 404s, ask Egoist for a client_id
// manually (ego.ist/developer) and set EGOIST_CLIENT_ID / EGOIST_CLIENT_SECRET
// as env vars — this file will use those instead of registering one itself.

import crypto from "node:crypto";
import { base64url } from "../_lib/http.js";

const MCP_URL = "https://passport.ego.ist/mcp";

async function discover() {
  const origin = new URL(MCP_URL).origin;

  const prmRes = await fetch(`${origin}/.well-known/oauth-protected-resource`);
  if (!prmRes.ok) {
    throw new Error(
      `No OAuth protected-resource metadata at ${origin} (${prmRes.status}). ` +
        `Egoist's server may not support MCP-spec discovery yet — check ego.ist/developer.`
    );
  }
  const prm = await prmRes.json();
  const issuer = (prm.authorization_servers && prm.authorization_servers[0]) || origin;

  const asRes = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/oauth-authorization-server`);
  if (!asRes.ok) {
    throw new Error(`No authorization-server metadata at ${issuer} (${asRes.status}).`);
  }
  return asRes.json(); // { authorization_endpoint, token_endpoint, registration_endpoint, scopes_supported? }
}

async function getClient(asMeta, redirectUri) {
  if (process.env.EGOIST_CLIENT_ID) {
    return { client_id: process.env.EGOIST_CLIENT_ID, client_secret: process.env.EGOIST_CLIENT_SECRET || null };
  }
  if (!asMeta.registration_endpoint) {
    throw new Error("No dynamic registration endpoint advertised — set EGOIST_CLIENT_ID manually.");
  }
  const res = await fetch(asMeta.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "AI Passport Consent Audit",
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Dynamic client registration failed: ${res.status} ${detail}`);
  }
  return res.json(); // { client_id, client_secret? }
}

export default async function handler(req, res) {
  try {
    const baseUrl = `https://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/callback`;

    const asMeta = await discover();
    const client = await getClient(asMeta, redirectUri);

    const verifier = base64url(crypto.randomBytes(32));
    const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
    const state = base64url(crypto.randomBytes(16));

    const pending = base64url(
      Buffer.from(
        JSON.stringify({
          verifier,
          state,
          client_id: client.client_id,
          client_secret: client.client_secret || null,
          token_endpoint: asMeta.token_endpoint,
          redirect_uri: redirectUri,
        })
      )
    );

    res.setHeader(
      "Set-Cookie",
      `egoist_pending=${pending}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    );

    const authUrl = new URL(asMeta.authorization_endpoint);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", client.client_id);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    if (asMeta.scopes_supported && asMeta.scopes_supported.length) {
      authUrl.searchParams.set("scope", asMeta.scopes_supported.join(" "));
    }

    res.writeHead(302, { Location: authUrl.toString() });
    res.end();
  } catch (err) {
    res
      .status(500)
      .send(
        `Couldn't start the AI Passport connection: ${String(err.message || err)}\n\n` +
          `This step depends on passport.ego.ist supporting standard MCP OAuth discovery — ` +
          `see the comment at the top of api/auth/start.js for the manual-registration fallback.`
      );
  }
}
