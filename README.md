# Samadhan

Societal Innovation Collaboration Portal. Working prototype: citizen reports a
problem, AI triages it, government validates, a university team forms, an
industry partner joins, the solution is piloted, and impact is measured.

## Run it

Requires Node 18 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

## Build and deploy

```bash
npm run build      # output lands in dist/
npm run preview    # serve the built output locally
```

`dist/` is a static folder. It deploys as-is to Vercel, Netlify, GitHub Pages,
or any static host. `vite.config.js` sets `base: "./"` so relative paths work
from a subdirectory, which is what GitHub Pages needs.

## The AI layer

Challenge triage tries a live Claude call first, then falls back to a built-in
offline analyzer that does keyword sector detection, Jaccard duplicate matching,
and expertise-overlap university ranking.

Inside the Claude artifact runtime the live call works with no key. Anywhere
else it will fail and the offline analyzer takes over automatically. The demo
still runs end to end, so you can present without a key.

To use the live model outside that runtime, do not call the Anthropic API from
the browser, since that would expose your key. Run a small server that holds the
key and forwards the request, then point the app at it. In `src/Samadhan.jsx`,
change:

```js
const res = await fetch("https://api.anthropic.com/v1/messages", {
```

to your own endpoint, for example `/api/assess`.

## Demo path

1. Sign in as Citizen, tap "Autofill demo code", verify.
2. Report a challenge, "Load demo case", Continue through the form.
3. "Run AI assessment", then "Submit for validation".
4. Role dropdown to Government Validator, open Validation queue, approve and assign.
5. Role dropdown to Faculty, accept the assignment, build the team.
6. Role dropdown to Industry Partner, open Partnerships, commit funding.
7. Back to Faculty: Solution tab, Testing and pilot, Impact and IP, mark implemented.
8. Open Analytics. The totals have moved.

"Reset demo" in the top bar returns everything to the seeded starting state.

## Known limits

Collaboration is single-browser, since there is no server. Two machines will not
see each other's comments. The map is 15 grouped regions with named districts,
not district shapefiles. Sign-in is a role switcher and the OTP step is
simulated, so do not present it as real authentication.
