# AI Passport Consent Audit

A prototype for Egoist Machines' Identity track: today's `recall()` flow
against the real AI Passport MCP server returns nine separate approval
requests for a single nine-category ask. This app shows that, live, and
prototypes a batched single-screen fix.

## Run locally
```
npm install
npm run dev
```
The dev server serves the static frontend. The `/api` functions need
Vercel's dev runtime to run locally too — see "Local API testing" below.

## Architecture
- `src/` — the React frontend (static, built by Vite).
- `api/` — three serverless functions that give **this deployment** its own
  OAuth-authorized connection to `passport.ego.ist`, separate from any
  Claude.ai session:
  - `api/auth/start.js` — begins the OAuth + PKCE handshake.
  - `api/auth/callback.js` — exchanges the code for tokens, stores them in
    an httpOnly session cookie.
  - `api/passport/categories.js` — calls the real `recall` tool over MCP
    using that session's token and returns the raw result.

This split exists because a purely static site has nowhere safe to hold an
OAuth token or API key — anything shipped to the browser is public. The
frontend's "Fetch live" button calls `/api/passport/categories`, never
`passport.ego.ist` or `api.anthropic.com` directly.

## Known uncertainty — read before demoing live
`api/auth/start.js` discovers Egoist's OAuth endpoints via the MCP
Authorization spec's standard `.well-known` metadata and registers a client
dynamically (RFC 7591). That's the common pattern for remote MCP servers,
but Egoist Machines shipped AI Passport in July 2026 and hasn't published
OAuth docs, so the exact discovery URLs, scope names, and whether dynamic
registration is even enabled are **unverified against the live server**.

If `/api/auth/start` errors:
1. Check the error message — it's surfaced directly, not swallowed.
2. If discovery 404s or registration is rejected, reach out via
   `ego.ist/developer`, get a manual `client_id` (and `client_secret` if
   they issue one), and set `EGOIST_CLIENT_ID` / `EGOIST_CLIENT_SECRET` as
   env vars — `start.js` will use those instead of registering one itself.

If `/api/passport/categories` returns data but the frontend shows the raw
response instead of the styled category list, the parser in `src/App.jsx`
(`parseRecallResponse`) didn't recognize the shape — the raw text is shown
rather than guessed at wrong, and the parser's regex should be adjusted to
match what actually comes back.

## Build for deployment
```
npm install
npm run build
```
`dist/` is the static frontend. The `api/` functions deploy alongside it.

## Deploy
Written for **Vercel's** zero-config Node serverless functions (`api/*.js`
using `res.status()/.json()/.send()`, which Vercel's runtime provides).
Push to a repo and import it in Vercel, or run `vercel deploy` — it
auto-detects the Vite build and the `api/` functions, no `vercel.json`
needed. Set `EGOIST_CLIENT_ID` / `EGOIST_CLIENT_SECRET` in the Vercel
project's environment variables if you're using manual registration.

Deploying to Netlify or Cloudflare Pages instead works for the static
frontend, but the three files in `api/` use Vercel's request/response
conventions and would need adapting to those platforms' function
signatures.

## Local API testing
```
npm install -g vercel
vercel dev
```
This runs both the static frontend and the `api/` functions together, and
is the only way to test the OAuth flow locally (`npm run dev` alone only
serves the frontend).

## Notes
- The category list, sensitivity tiers, and copy in the "Proposed fix" view
  are this project's own suggestion, not something Egoist has confirmed —
  worth validating with them directly before treating it as their roadmap.
- `LIVE_EVIDENCE_SNAPSHOT` in `src/App.jsx` is a captured fallback shown
  until a live connection is made; it's what renders before you click
  "Fetch live" or if that call fails.
