# Age of Innovation Draft

A small web app for running a setup draft for *Age of Innovation*, hosted on GitHub Pages with live state in Firebase Realtime Database.

## How the draft works

- The host creates a draft and shares the link. Players open it and enter a name. The host can also add players by name.
- There are no accounts. Each device remembers which player it is in each draft. On any other device, open the link and pick your name under **Who are you?** to carry on, for example starting on a computer and finishing on a phone. **Switch player** in the header forgets the choice on that device.
- In the lobby the host can reorder seats (or leave **Randomize seat order** on) and exclude any components that shouldn't be drawn.
- On start, these are drawn at random for **N** players:
  - **N + 1** factions
  - **6** of the 7 terrains (Planning displays)
  - **N + 1** palace tiles (Palace #17, the one with the red back, is never used, as in the rulebook's draft variant)
  - **N + 3** round bonus tiles
- Picks follow a **reverse snake**: the last seat picks first. With 4 players the order is 4‑3‑2‑1, 1‑2‑3‑4, 4‑3‑2‑1, 1‑2‑3‑4. On each pick, a player takes one item from any category they haven't filled yet.
- Seat 1 is the start player. Once every player has one item from each category, the result shows each player's picks plus the 3 leftover round bonus tiles, which get a Coin each. **Copy summary** puts the result on the clipboard as text.
- The host can **undo the last pick**, **pick for whoever's turn it is**, or send everyone **back to the lobby**.

Component text is summarised from the rulebook appendices in `js/data.js`. The rulebook doesn't number the round bonus tiles, so they are numbered 1–10 in the order of Board Game Arena's tile image.

Tile artwork is hotlinked from Board Game Arena's sprite sheets; nothing is copied into this repo. The release folder in the URL is set by `IMAGE_BASE` in `js/data.js`. If BGA publishes a new release and the images stop loading, update that folder name. Until then, the app shows text-only cards.

## One-time setup

### Firebase

In the [Firebase console](https://console.firebase.google.com/project/ageofinnovationdraft):

- **Realtime Database → Rules**: paste in the contents of `database.rules.json` and publish. If you use the Firebase CLI, `firebase deploy --only database` does the same.

The app is built for friends who trust each other, so there is no sign-in. Anyone with a draft's link can read it and change it, but drafts can't be listed, so a draft can only be found by its code. The web config in `js/firebase-config.js` is meant to be public.

### GitHub Pages

1. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Merge to `main`. The `Deploy to GitHub Pages` workflow runs the tests, then publishes the site to `https://sircxyrtyx.github.io/AgeOfInnovationDraft/`.

## Development

There's no build step. The site is plain HTML, CSS and ES modules.

```sh
npm start          # serves the folder on http://localhost:8000
npm test           # unit tests for the draft logic (Node 20+)
```

Add `?local` to the URL (e.g. `http://localhost:8000/?local`) to use an in-browser fake database instead of Firebase. Each tab acts as a different device, which makes it easy to try a whole draft offline.

| File | Purpose |
| --- | --- |
| `js/data.js` | Factions, terrains, palace and bonus tiles; pool sizes |
| `js/draft.js` | Pure draft logic: pick order, pool drawing, legality checks |
| `js/backend.js` | Firebase backend and the `?local` fake backend |
| `js/app.js` | UI |
| `database.rules.json` | Realtime Database security rules |
