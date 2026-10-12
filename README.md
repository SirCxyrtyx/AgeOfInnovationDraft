# Age of Innovation Draft

A small web app for running a setup draft for *Age of Innovation*, hosted on GitHub Pages with live state in Firebase Realtime Database.

## How the draft works

- The host creates a draft and shares the link. Players open it and enter a name. The host can also add players who don't have a device and pick for them.
- In the lobby the host can reorder seats (or leave **Randomize seat order** on) and exclude any components that shouldn't be drawn.
- On start, these are drawn at random for **N** players:
  - **N + 1** factions
  - **6** of the 7 terrains (Planning displays)
  - **N + 1** palace tiles (Palace #17, the one with the red back, is never used, as in the rulebook's draft variant)
  - **N + 3** round bonus tiles
- Picks follow a **reverse snake**: the last seat picks first. With 4 players the order is 4‑3‑2‑1, 1‑2‑3‑4, 4‑3‑2‑1, 1‑2‑3‑4. On each pick, a player takes one item from any category they haven't filled yet.
- Seat 1 is the start player. Once every player has one item from each category, the result shows each player's picks plus the 3 leftover round bonus tiles, which get a Coin each. **Copy summary** puts the result on the clipboard as text.
- The host can **undo the last pick**, **pick for whoever's turn it is**, or send everyone **back to the lobby**.

Component text is summarised from the rulebook appendices in `js/data.js`. The rulebook doesn't number the round bonus tiles, so they are numbered 1–10 in Appendix V order.

## One-time setup

### Firebase

In the [Firebase console](https://console.firebase.google.com/project/ageofinnovationdraft):

1. **Authentication → Sign-in method**: enable **Anonymous**.
2. **Realtime Database → Rules**: paste in the contents of `database.rules.json` and publish. These rules allow:
   - only the host to change settings, start the draft, undo or reset it;
   - players to add or remove only themselves, and only in the lobby;
   - a player to pick only on their own turn, and never to overwrite an existing pick.
3. **Authentication → Settings → Authorized domains**: add `sircxyrtyx.github.io` if it isn't listed.

If you use the Firebase CLI, `firebase deploy --only database` does step 2.

The web config in `js/firebase-config.js` is meant to be public. The database rules are what control access.

### GitHub Pages

1. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Merge to `main`. The `Deploy to GitHub Pages` workflow runs the tests, then publishes the site to `https://sircxyrtyx.github.io/AgeOfInnovationDraft/`.

## Development

There's no build step. The site is plain HTML, CSS and ES modules.

```sh
npm start          # serves the folder on http://localhost:8000
npm test           # unit tests for the draft logic (Node 20+)
```

Add `?local` to the URL (e.g. `http://localhost:8000/?local`) to use an in-browser fake database instead of Firebase. Each tab acts as a different player, which makes it easy to try a whole draft offline.

| File | Purpose |
| --- | --- |
| `js/data.js` | Factions, terrains, palace and bonus tiles; pool sizes |
| `js/draft.js` | Pure draft logic: pick order, pool drawing, legality checks |
| `js/backend.js` | Firebase backend and the `?local` fake backend |
| `js/app.js` | UI |
| `database.rules.json` | Realtime Database security rules |
