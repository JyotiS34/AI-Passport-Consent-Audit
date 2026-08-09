# AI Passport Consent Audit

## Run locally
```
npm install
npm run dev
```

## Build for deployment
```
npm install
npm run build
```
This produces a static `dist/` folder — plain HTML/CSS/JS, no server required.

## Deploy `dist/`
Any static host works: drag the `dist/` folder into Netlify's deploy UI, run `vercel deploy` in this
directory, push to a repo and point Vercel/Netlify/Cloudflare Pages at it (they'll run `npm run build`
automatically), or copy `dist/`'s contents onto GitHub Pages, S3, or any web server.

## Notes
- Live evidence in `src/App.jsx` (the `LIVE_EVIDENCE` array) is a captured snapshot from an actual
  `recall()` call against the AI Passport MCP server, not live-fetched by this app. Refresh it by
  re-running the call and pasting in new values — the deployed page itself holds no credentials
  and makes no calls to ego.ist. We can live-fetch the evidence but for that our app should have get special access to the MCP server from the developer side.
