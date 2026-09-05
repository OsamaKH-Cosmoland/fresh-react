# TODO

Deferred items found during the performance pass (2026-09-05). Both are real but were
left alone deliberately: neither is a performance problem, and the second one changes
how the page looks.

---

## 1. Service worker registers a file that does not exist

**Where:** `src/pwa/registerServiceWorker.ts:14`

The app registers `/service-worker.js` in production, but nothing generates that file.
`vite-plugin-pwa` is in `devDependencies` but is never added to `plugins` in
`vite.config.ts`, and there is no `public/service-worker.js`.

Because `vercel.json` rewrites `/(.*)` to `/`, the request does not 404 — it returns
`index.html` with `Content-Type: text/html`, and registration fails on MIME type:

```
The script has an unsupported MIME type ('text/html').
SecurityError: Failed to register a ServiceWorker for scope ('/')
```

Reproducible in `npm run preview`; see the browser console.

**Consequences:** the PWA never installs, `public/offline.html` is unreachable, and
every production page load spends a request on a failed registration.

**Options:**
- Wire up `vite-plugin-pwa` (already installed) and let it emit the service worker; or
- Delete `registerServiceWorker` and its `main.tsx` call if the PWA is not wanted.

Decide which — do not do both.

**Note:** this shares a root cause with the robots.txt problem (the `vercel.json`
catch-all rewrite serving `index.html` for any path that is not a real static file).
Fixing the rewrite may change this symptom from "wrong MIME type" to a plain 404.

---

## 2. The `[data-animate]` fade-in animations are inert

**Where:** `src/index.css:543` and `src/utils/scrollAnimations.ts:84`

The reveal-on-scroll system does not hide anything, so nothing ever fades in — elements
are simply visible from the start.

Two separate bugs that happen to cancel out:

**a) The guard selector is too broad.** `src/index.css:537` sets `[data-animate] { opacity: 0 }`,
and line 543 is meant to undo that when JS is unavailable:

```css
:not(.anim-js-enabled) [data-animate] { opacity: 1 !important; }
```

`initScrollAnimations()` puts `anim-js-enabled` on `<html>`, but `:not(.anim-js-enabled)`
matches *any* ancestor without the class — including `<body>`. So the `!important`
override always applies and `opacity: 0` never takes effect. It should be
`html:not(.anim-js-enabled) [data-animate]`.

**b) On mobile the observer never starts unless the user scrolls.**
`scrollAnimations.ts:84` gates `startObserver()` behind a first `scroll` event when
`(max-width: 768px)` matches. A mobile user who never scrolls gets no `is-visible`
classes at all. Lighthouse does not scroll, so it never sees them either.

Today (a) masks (b). Fixing (a) alone would make the above-the-fold hero invisible on
mobile until first scroll, which would also tank LCP — **fix both together or neither.**

**Verified not a performance issue:** measured in a real browser at 412x823; all
`[data-animate]` elements compute to `opacity: 1` and the hero is a valid LCP candidate.

**Also worth a look while in here:** `[data-animate]` sets `will-change: opacity, transform`
unconditionally on 34 elements on the home page. That is 34 hinted compositing layers on a
low-end device for animations that currently never run. Removing `will-change` would not
change appearance.
