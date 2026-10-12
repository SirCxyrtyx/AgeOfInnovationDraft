// Storage backends. Both expose the same small API:
//   uid, subscribe(path, cb) -> unsubscribe, get(path), set(path, value),
//   update(path, values), create(path, value) -> true if it did not exist yet.
//
// The Firebase backend is the real one. The local backend keeps everything in
// localStorage and syncs between tabs of the same browser; open the app with
// ?local in the URL to use it for offline testing.

import { firebaseConfig, FIREBASE_SDK_VERSION } from './firebase-config.js';

export async function createBackend() {
  const params = new URLSearchParams(location.search);
  return params.has('local') ? createLocalBackend() : createFirebaseBackend();
}

async function createFirebaseBackend() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
  const [{ initializeApp }, authMod, dbMod] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-database.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  const db = dbMod.getDatabase(app);

  const user = await new Promise((resolve, reject) => {
    const stop = authMod.onAuthStateChanged(auth, (u) => {
      if (u) {
        stop();
        resolve(u);
      }
    });
    authMod.signInAnonymously(auth).catch(reject);
  });

  const r = (path) => dbMod.ref(db, path);
  return {
    uid: user.uid,
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
  };
}

function createLocalBackend() {
  const KEY = 'aoi-local-db';
  const channel = new BroadcastChannel('aoi-local-db');
  const listeners = new Set();

  let uid = sessionStorage.getItem('aoi-local-uid');
  if (!uid) {
    uid = `local-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('aoi-local-uid', uid);
  }

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
    uid,
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
  };
}
