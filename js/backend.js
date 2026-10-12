// Storage backends. Both expose the same small API:
//   isLocal, subscribe(path, cb) -> unsubscribe, get(path), set(path, value),
//   update(path, values), create(path, value) -> true if it did not exist yet,
//   transaction(path, fn) -> true if fn's result was written (undefined aborts).
//
// The Firebase backend is the real one. There is no sign-in: drafts are open to
// anyone with the link. The local backend keeps everything in localStorage and
// syncs between tabs of the same browser; open the app with ?local in the URL to
// use it for offline testing.

import { firebaseConfig, FIREBASE_SDK_VERSION } from './firebase-config.js';

export async function createBackend() {
  const params = new URLSearchParams(location.search);
  return params.has('local') ? createLocalBackend() : createFirebaseBackend();
}

async function createFirebaseBackend() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
  const [{ initializeApp }, dbMod] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-database.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const db = dbMod.getDatabase(app);

  const r = (path) => dbMod.ref(db, path);
  return {
    isLocal: false,
    subscribe(path, cb, onError) {
      return dbMod.onValue(r(path), (snap) => cb(snap.val()), onError);
    },
    async get(path) {
      return (await dbMod.get(r(path))).val();
    },
    set: (path, value) => dbMod.set(r(path), value),
    update: (path, values) => dbMod.update(r(path), values),
    async create(path, value) {
      const result = await dbMod.runTransaction(r(path), (current) => (current === null ? value : undefined));
      return result.committed;
    },
    async transaction(path, fn) {
      const result = await dbMod.runTransaction(r(path), fn);
      return result.committed;
    },
  };
}

function createLocalBackend() {
  const KEY = 'aoi-local-db';
  const channel = new BroadcastChannel('aoi-local-db');
  const listeners = new Set();

  const parts = (path) => path.split('/').filter(Boolean);
  const load = () => JSON.parse(localStorage.getItem(KEY) || '{}');
  const read = (root, path) => parts(path).reduce((node, key) => (node == null ? null : node[key] ?? null), root);

  function write(root, path, value) {
    const keys = parts(path);
    const last = keys.pop();
    let node = root;
    for (const key of keys) {
      if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
      node = node[key];
    }
    if (value === null || value === undefined) delete node[last];
    else node[last] = JSON.parse(JSON.stringify(value));
  }

  function commit(root) {
    localStorage.setItem(KEY, JSON.stringify(root));
    channel.postMessage('changed');
    notify();
  }

  function notify() {
    const root = load();
    for (const l of listeners) l.cb(read(root, l.path));
  }
  channel.onmessage = notify;

  return {
    isLocal: true,
    subscribe(path, cb) {
      const l = { path, cb };
      listeners.add(l);
      queueMicrotask(() => cb(read(load(), path)));
      return () => listeners.delete(l);
    },
    async get(path) {
      return read(load(), path);
    },
    async set(path, value) {
      const root = load();
      write(root, path, value);
      commit(root);
    },
    async update(path, values) {
      const root = load();
      for (const [sub, value] of Object.entries(values)) write(root, `${path}/${sub}`, value);
      commit(root);
    },
    async create(path, value) {
      const root = load();
      if (read(root, path) !== null) return false;
      write(root, path, value);
      commit(root);
      return true;
    },
    async transaction(path, fn) {
      const root = load();
      const next = fn(read(root, path));
      if (next === undefined) return false;
      write(root, path, next);
      commit(root);
      return true;
    },
  };
}
