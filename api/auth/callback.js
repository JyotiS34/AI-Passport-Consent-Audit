// GET /api/auth/callback
//
// Finishes the OAuth handshake started in api/auth/start.js: exchanges the
// authorization code for an access token (PKCE, no client secret needed for
// public clients) and stores it in an httpOnly session cookie.
//
// NOTE: a signed cookie is a reasonable stand-in for a demo, but a real
// production app should keep tokens in a server-side session store (Redis,
// a database row, etc.) rather than round-tripping them through the
// browser at all, even httpOnly. Swap that in before this handles real
// user traffic beyond the hackathon demo.

import { base64url, base64urlDecode, parseCookie } from "../_lib/http.js";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      return res.status(400).send(`Egoist declined the connection: ${oauthError}`);
    }

    const pendingCookie = parseCookie(req.headers.cookie, "egoist_pending");
    if (!pendingCookie) {
      return res.status(400).send("No pending connection found — start over at /api/auth/start.");
    }
    const pending = JSON.parse(base64urlDecode(pendingCookie));
    if (state !== pending.state) {
      return res.status(400).send("State mismatch — possible CSRF, aborting.");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: pending.redirect_uri,
      client_id: pending.client_id,
      code_verifier: pending.verifier,
    });
    if (pending.client_secret) body.set("client_secret", pending.client_secret);

    const tokenRes = await fetch(pending.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      return res.status(502).send(`Token exchange failed: ${tokenRes.status} ${detail}`);
    }
    const tokens = await tokenRes.json(); // { access_token, refresh_token?, expires_in? }

    const session = base64url(
      Buffer.from(
        JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          obtained_at: Date.now(),
          expires_in: tokens.expires_in || 3600,
        })
      )
    );

    res.setHeader("Set-Cookie", [
      `egoist_session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`,
      `egoist_pending=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    ]);
    res.writeHead(302, { Location: "/?connected=1" });
    res.end();
  } catch (err) {
    res.status(500).send(`Callback failed: ${String(err.message || err)}`);
  }
}
