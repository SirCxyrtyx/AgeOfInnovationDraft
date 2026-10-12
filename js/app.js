import { CATEGORIES, ITEMS, findItem, poolSize, MAX_PLAYERS } from './data.js';
import {
  shuffle, buildTurnOrder, effectiveSeatOrder, availableItems, startProblems,
  buildPool, draftState, pickProblem, remainingItems, newDraftId,
} from './draft.js';
import { createBackend } from './backend.js';

const app = document.getElementById('app');
const NAME_KEY = 'aoi-name';
const RECENT_KEY = 'aoi-recent';

let backend = null;
let route = { page: 'home' };
let draft = null; // latest snapshot of the current draft (null = not loaded / missing)
let draftLoaded = false;
let unsubscribe = null;
let ui = { selected: null, joinName: null, manualName: '', homeName: null, joinCode: '' };

// ---------- small helpers ----------

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    }
    else if (key === 'value') el.value = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode); remembering is best-effort.
  }
}

function rememberDraft(id, name) {
  const recent = storageGet(RECENT_KEY, []).filter((r) => r.id !== id);
  recent.unshift({ id, name, at: Date.now() });
  storageSet(RECENT_KEY, recent.slice(0, 10));
}

function forgetDraft(id) {
  storageSet(RECENT_KEY, storageGet(RECENT_KEY, []).filter((r) => r.id !== id));
}

function toast(message, kind = 'info') {
  const el = h('div', { class: `toast toast-${kind}`, role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

async function guarded(action) {
  try {
    await action();
  } catch (err) {
    console.error(err);
    toast(err && err.message ? err.message : 'Something went wrong.', 'error');
  }
}

function draftLink(id) {
  return `${location.origin}${location.pathname}${location.search}#/d/${id}`;
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    window.prompt('Copy this:', text);
  }
}

function playerName(id) {
  const p = draft && draft.players && draft.players[id];
  return p ? p.name : 'Unknown player';
}

function itemLabel(category, id) {
  const item = findItem(category, id);
  return item ? item.name : id;
}

// Preserve focus and caret across full re-renders.
function render() {
  const active = document.activeElement;
  const focusId = active && active.id;
  const caret = focusId && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;

  app.replaceChildren(route.page === 'draft' ? renderDraftPage() : renderHome());
  updateTitle();

  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus();
      if (caret) {
        try { el.setSelectionRange(caret[0], caret[1]); } catch { /* not a text input */ }
      }
    }
  }
}

function updateTitle() {
  let title = 'Age of Innovation Draft';
  if (route.page === 'draft' && draft && draft.status === 'drafting') {
    const state = draftState(draft);
    if (state.done) title = `Draft complete · ${title}`;
    else if (state.currentUid === backend.uid) title = `▶ Your pick! · ${title}`;
  }
  document.title = title;
}

// ---------- routing ----------

function parseRoute() {
  const match = location.hash.match(/^#\/d\/([A-Za-z0-9]+)/);
  return match ? { page: 'draft', id: match[1].toUpperCase() } : { page: 'home' };
}

function onRouteChange() {
  const next = parseRoute();
  if (next.page === route.page && next.id === route.id) return;
  route = next;
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  draft = null;
  draftLoaded = false;
  ui = { ...ui, selected: null, joinName: null, manualName: '' };
  if (route.page === 'draft') {
    unsubscribe = backend.subscribe(`drafts/${route.id}`, (value) => {
      draft = value;
      draftLoaded = true;
      if (draft && draft.players && draft.players[backend.uid]) {
        rememberDraft(route.id, draft.players[backend.uid].name);
      }
      if (ui.selected && draft && draft.status === 'drafting') {
        const state = draftState(draft);
        const pick = pickProblem(state, state.currentUid, ui.selected.category, ui.selected.item);
        if (pick) ui.selected = null;
      }
      render();
    }, (err) => {
      console.error(err);
      draft = null;
      draftLoaded = true;
      render();
      toast('Could not load the draft (permission denied?).', 'error');
    });
  }
  render();
}

// ---------- home page ----------

function renderHome() {
  const savedName = storageGet(NAME_KEY, '');
  if (ui.homeName === null) ui.homeName = savedName;
  const recent = storageGet(RECENT_KEY, []);

  const create = (e) => {
    e.preventDefault();
    const name = ui.homeName.trim();
    if (!name) return toast('Enter your name first.', 'error');
    guarded(() => createDraft(name));
  };

  const join = (e) => {
    e.preventDefault();
    const code = ui.joinCode.trim().toUpperCase();
    if (!code) return;
    location.hash = `#/d/${code}`;
  };

  return h('main', { class: 'home' },
    h('header', { class: 'hero' },
      h('h1', {}, 'Age of Innovation Draft'),
      h('p', { class: 'muted' }, 'Reverse snake draft of factions, terrains, palace tiles and round bonus tiles.'),
    ),
    h('section', { class: 'card' },
      h('h2', {}, 'Start a new draft'),
      h('form', { class: 'row', onsubmit: create },
        h('input', {
          id: 'home-name', type: 'text', placeholder: 'Your name', maxlength: 40, value: ui.homeName,
          autocomplete: 'nickname', oninput: (e) => { ui.homeName = e.target.value; },
        }),
        h('button', { class: 'primary', type: 'submit' }, 'Create draft'),
      ),
    ),
    h('section', { class: 'card' },
      h('h2', {}, 'Join a draft'),
      h('form', { class: 'row', onsubmit: join },
        h('input', {
          id: 'join-code', type: 'text', placeholder: 'Draft code', maxlength: 12, value: ui.joinCode,
          autocapitalize: 'characters', oninput: (e) => { ui.joinCode = e.target.value; },
        }),
        h('button', { type: 'submit' }, 'Open'),
      ),
      h('p', { class: 'muted small' }, 'Or just open the link the host shared with you.'),
    ),
    recent.length > 0 && h('section', { class: 'card' },
      h('h2', {}, 'Your recent drafts'),
      h('ul', { class: 'recent' },
        recent.map((r) => h('li', {},
          h('a', { href: `#/d/${r.id}` }, r.id),
          h('span', { class: 'muted' }, ` as ${r.name} · ${new Date(r.at).toLocaleDateString()}`),
          h('button', {
            class: 'link small', title: 'Remove from this list',
            onclick: () => { forgetDraft(r.id); render(); },
          }, '✕'),
        )),
      ),
    ),
  );
}

async function createDraft(name) {
  storageSet(NAME_KEY, name);
  const now = Date.now();
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newDraftId();
    const created = await backend.create(`drafts/${id}`, {
      createdAt: now,
      hostUid: backend.uid,
      status: 'lobby',
      randomSeats: true,
      players: { [backend.uid]: { name, joinedAt: now } },
    });
    if (created) {
      rememberDraft(id, name);
      location.hash = `#/d/${id}`;
      return;
    }
  }
  throw new Error('Could not create a draft, please try again.');
}

// ---------- draft page ----------

function renderDraftPage() {
  if (!draftLoaded) return h('main', {}, h('p', { class: 'muted center' }, 'Loading draft…'));
  if (!draft) {
    return h('main', {},
      h('section', { class: 'card' },
        h('h2', {}, `Draft ${route.id} not found`),
        h('p', {}, 'Check the code or link and try again.'),
        h('a', { href: '#/' }, '← Back home'),
      ),
    );
  }

  const isHost = draft.hostUid === backend.uid;
  return h('main', { class: 'draft' },
    renderDraftHeader(isHost),
    draft.status === 'lobby' ? renderLobby(isHost) : renderDrafting(isHost),
  );
}

function renderDraftHeader(isHost) {
  const link = draftLink(route.id);
  return h('header', { class: 'draft-header' },
    h('div', {},
      h('a', { href: '#/', class: 'muted small back' }, '← Home'),
      h('h1', {}, 'Draft ', h('span', { class: 'code' }, route.id)),
      isHost && h('span', { class: 'badge' }, 'You are the host'),
    ),
    h('button', { onclick: () => copyText(link, 'Link copied.') }, 'Copy invite link'),
  );
}

// ----- lobby -----

function renderLobby(isHost) {
  const me = backend.uid;
  const joined = draft.players && draft.players[me];
  const seats = effectiveSeatOrder(draft);
  const problems = startProblems(draft);

  return h('div', { class: 'lobby' },
    !joined && renderJoinForm(),
    h('section', { class: 'card' },
      h('h2', {}, `Players (${seats.length}/${MAX_PLAYERS})`),
      h('p', { class: 'muted small' },
        'Seat 1 is the start player. The draft runs in reverse snake order: the last seat picks first.'),
      h('ol', { class: 'seats' }, seats.map((id, i) => renderSeat(id, i, seats, isHost))),
      isHost && renderSeatControls(seats),
      joined && !isHost && h('button', {
        class: 'link danger small',
        onclick: () => guarded(() => backend.set(`drafts/${route.id}/players/${me}`, null)),
      }, 'Leave draft'),
    ),
    renderExclusions(isHost, seats.length),
    isHost
      ? h('section', { class: 'card' },
        problems.length > 0 && h('ul', { class: 'problems' }, problems.map((p) => h('li', {}, p))),
        h('button', {
          class: 'primary big', disabled: problems.length > 0,
          onclick: () => guarded(startDraft),
        }, 'Start draft'),
      )
      : h('p', { class: 'muted center' }, 'Waiting for the host to start the draft…'),
  );
}

function renderJoinForm() {
  if (ui.joinName === null) ui.joinName = storageGet(NAME_KEY, '');
  const submit = (e) => {
    e.preventDefault();
    const name = ui.joinName.trim();
    if (!name) return toast('Enter your name first.', 'error');
    storageSet(NAME_KEY, name);
    guarded(() => backend.set(`drafts/${route.id}/players/${backend.uid}`, { name, joinedAt: Date.now() }));
  };
  return h('section', { class: 'card highlight' },
    h('h2', {}, 'Join this draft'),
    h('form', { class: 'row', onsubmit: submit },
      h('input', {
        id: 'join-name', type: 'text', placeholder: 'Your name', maxlength: 40, value: ui.joinName,
        autocomplete: 'nickname', oninput: (e) => { ui.joinName = e.target.value; },
      }),
      h('button', { class: 'primary', type: 'submit' }, 'Join'),
    ),
  );
}

function renderSeat(id, index, seats, isHost) {
  const player = draft.players[id];
  const move = (delta) => guarded(() => {
    const order = [...seats];
    const j = index + delta;
    [order[index], order[j]] = [order[j], order[index]];
    return backend.update(`drafts/${route.id}`, { seatOrder: order, randomSeats: false });
  });
  return h('li', { class: 'seat' },
    h('span', { class: 'seat-name' },
      player.name,
      id === backend.uid && h('span', { class: 'muted' }, ' (you)'),
      id === draft.hostUid && h('span', { class: 'badge small' }, 'host'),
      player.manual && h('span', { class: 'badge small muted' }, 'added by host'),
    ),
    isHost && h('span', { class: 'seat-actions' },
      h('button', { class: 'icon', title: 'Move up', disabled: index === 0, onclick: () => move(-1) }, '▲'),
      h('button', { class: 'icon', title: 'Move down', disabled: index === seats.length - 1, onclick: () => move(1) }, '▼'),
      id !== backend.uid && h('button', {
        class: 'icon danger', title: 'Remove player',
        onclick: () => {
          if (confirm(`Remove ${player.name} from the draft?`)) {
            guarded(() => backend.set(`drafts/${route.id}/players/${id}`, null));
          }
        },
      }, '✕'),
    ),
  );
}

function renderSeatControls(seats) {
  const addManual = (e) => {
    e.preventDefault();
    const name = ui.manualName.trim();
    if (!name) return;
    ui.manualName = '';
    const id = `manual-${Math.random().toString(36).slice(2, 10)}`;
    guarded(() => backend.set(`drafts/${route.id}/players/${id}`, { name, joinedAt: Date.now(), manual: true }));
  };
  return h('div', { class: 'seat-controls' },
    h('label', { class: 'check' },
      h('input', {
        type: 'checkbox', checked: draft.randomSeats !== false,
        onchange: (e) => guarded(() => backend.update(`drafts/${route.id}`, { randomSeats: e.target.checked })),
      }),
      ' Randomize seat order when the draft starts',
    ),
    h('button', {
      class: 'small',
      onclick: () => guarded(() => backend.update(`drafts/${route.id}`, { seatOrder: shuffle(seats), randomSeats: false })),
    }, 'Shuffle seats now'),
    h('form', { class: 'row', onsubmit: addManual },
      h('input', {
        id: 'manual-name', type: 'text', placeholder: 'Add a player without a device', maxlength: 40,
        value: ui.manualName, oninput: (e) => { ui.manualName = e.target.value; },
      }),
      h('button', { type: 'submit', class: 'small' }, 'Add'),
    ),
  );
}

function renderExclusions(isHost, n) {
  const excluded = draft.excluded || {};
  return h('section', { class: 'card' },
    h('h2', {}, 'Components'),
    h('p', { class: 'muted small' },
      isHost
        ? 'Tap an item to exclude it from the random selection (e.g. a missing component). Palace #17 is never drafted.'
        : 'Items the host has excluded are crossed out.'),
    CATEGORIES.map(({ key, plural }) => {
      const available = availableItems(key, excluded).length;
      const target = Math.max(n, 2);
      return h('div', { class: 'exclusion-group' },
        h('h3', {}, plural, h('span', { class: 'muted small' },
          ` · ${poolSize(key, target)} drawn for ${target} players · ${available} available`)),
        h('div', { class: 'chips' }, ITEMS[key].map((item) => {
          const isOut = !!(excluded[key] && excluded[key][item.id]);
          return h('button', {
            class: `chip${isOut ? ' excluded' : ''}`,
            disabled: !isHost,
            title: item.text,
            style: item.color ? { '--swatch': item.color } : null,
            onclick: () => guarded(() => backend.set(`drafts/${route.id}/excluded/${key}/${item.id}`, isOut ? null : true)),
          }, item.color && h('span', { class: 'swatch' }), item.name);
        })),
      );
    }),
  );
}

async function startDraft() {
  const problems = startProblems(draft);
  if (problems.length) throw new Error(problems[0]);
  let seats = effectiveSeatOrder(draft);
  if (draft.randomSeats !== false) seats = shuffle(seats);
  await backend.update(`drafts/${route.id}`, {
    status: 'drafting',
    startedAt: Date.now(),
    seatOrder: seats,
    turnOrder: buildTurnOrder(seats),
    pool: buildPool(draft.excluded || {}, seats.length),
    picks: null,
  });
}

// ----- drafting -----

function renderDrafting(isHost) {
  const state = draftState(draft);
  const me = backend.uid;
  const canAct = !state.done && (state.currentUid === me || isHost);

  return h('div', { class: 'drafting' },
    renderTurnBanner(state, isHost),
    renderOrderStrip(state),
    state.done && renderSummary(state),
    h('div', { class: 'pool' }, CATEGORIES.map((cat) => renderPoolCategory(cat, state, canAct))),
    !state.done && renderPlayerTable(state),
    isHost && renderHostControls(state),
    ui.selected && renderConfirmBar(state),
  );
}

function renderTurnBanner(state, isHost) {
  if (state.done) {
    return h('div', { class: 'banner done' }, 'Draft complete! Set up the game using the summary below.');
  }
  const current = state.currentUid;
  const step = `Pick ${state.pickIndex + 1} of ${state.turnOrder.length}`;
  if (current === backend.uid) {
    return h('div', { class: 'banner mine' },
      h('strong', {}, 'Your pick!'), ` Choose one item from a category you haven't filled yet. · ${step}`);
  }
  const p = draft.players[current];
  return h('div', { class: 'banner' },
    `Waiting for ${p ? p.name : 'player'} to pick. · ${step}`,
    isHost && h('div', { class: 'small' }, 'As host you can pick on their behalf.'),
  );
}

function renderOrderStrip(state) {
  return h('section', { class: 'card order' },
    h('h2', {}, 'Pick order'),
    h('ol', { class: 'order-strip' }, state.turnOrder.map((uid, i) => {
      const pick = state.picks[i];
      const cls = i < state.pickIndex ? 'past' : i === state.pickIndex ? 'current' : 'future';
      return h('li', { class: `${cls}${uid === backend.uid ? ' me' : ''}` },
        h('span', { class: 'order-name' }, playerName(uid)),
        pick && h('span', { class: 'order-pick' }, itemLabel(pick.category, pick.item)),
      );
    })),
  );
}

function renderPoolCategory({ key, plural }, state, canAct) {
  const current = state.currentUid;
  const filled = current && state.byPlayer[current] && state.byPlayer[current][key];
  return h('section', { class: `card pool-category${filled ? ' filled' : ''}` },
    h('h2', {}, plural, filled && !state.done && h('span', { class: 'muted small' },
      current === backend.uid ? ' · you already have one' : ` · ${playerName(current)} already has one`)),
    h('div', { class: 'items' }, state.pool[key].map((id) => {
      const item = findItem(key, id);
      const takenBy = state.pickedBy[key][id];
      const selectable = canAct && !pickProblem(state, current, key, id);
      const selected = ui.selected && ui.selected.category === key && ui.selected.item === id;
      return h('button', {
        class: `item${takenBy ? ' taken' : ''}${selected ? ' selected' : ''}${selectable ? ' selectable' : ''}`,
        disabled: !selectable,
        style: item.color ? { '--swatch': item.color } : null,
        onclick: () => { ui.selected = { category: key, item: id }; render(); },
      },
      h('span', { class: 'item-name' }, item.color && h('span', { class: 'swatch' }), item.name),
      h('span', { class: 'item-text' }, item.text),
      takenBy && h('span', { class: 'item-taken' }, `Taken by ${playerName(takenBy)}`));
    })),
  );
}

function renderPlayerTable(state) {
  return h('section', { class: 'card' },
    h('h2', {}, 'Players'),
    h('div', { class: 'table-wrap' },
      h('table', { class: 'players' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Seat'), h('th', {}, 'Player'),
          CATEGORIES.map((c) => h('th', {}, c.label)))),
        h('tbody', {}, state.seatOrder.map((uid, i) => h('tr', {
          class: `${uid === state.currentUid ? 'current' : ''}${uid === backend.uid ? ' me' : ''}`,
        },
        h('td', {}, i + 1),
        h('td', {}, playerName(uid)),
        CATEGORIES.map(({ key }) => {
          const id = state.byPlayer[uid] && state.byPlayer[uid][key];
          return h('td', {}, id ? itemLabel(key, id) : h('span', { class: 'muted' }, '—'));
        })))),
      ),
    ),
  );
}

function renderConfirmBar(state) {
  const { category, item } = ui.selected;
  const forOther = state.currentUid !== backend.uid;
  const label = `${itemLabel(category, item)}${forOther ? ` for ${playerName(state.currentUid)}` : ''}`;
  const confirm = () => guarded(async () => {
    const problem = pickProblem(state, state.currentUid, category, item);
    if (problem) throw new Error(problem);
    const ok = await backend.create(`drafts/${route.id}/picks/${state.pickIndex}`, {
      uid: state.currentUid, category, item, by: backend.uid, at: Date.now(),
    });
    ui.selected = null;
    if (!ok) toast('That pick was already made by someone else.', 'error');
    render();
  });
  return h('div', { class: 'confirm-bar' },
    h('span', {}, 'Take ', h('strong', {}, label), '?'),
    h('span', { class: 'row' },
      h('button', { onclick: () => { ui.selected = null; render(); } }, 'Cancel'),
      h('button', { class: 'primary', onclick: confirm }, 'Confirm pick'),
    ),
  );
}

function renderHostControls(state) {
  const undo = () => guarded(async () => {
    const last = state.picks[state.pickIndex - 1];
    if (!last) return;
    if (!confirm(`Undo ${playerName(last.uid)}'s pick of ${itemLabel(last.category, last.item)}?`)) return;
    await backend.set(`drafts/${route.id}/picks/${state.pickIndex - 1}`, null);
  });
  const reset = () => guarded(async () => {
    if (!confirm('Return to the lobby? All picks and the drawn components will be discarded.')) return;
    await backend.update(`drafts/${route.id}`, {
      status: 'lobby', pool: null, turnOrder: null, picks: null, startedAt: null,
    });
  });
  return h('section', { class: 'card host-controls' },
    h('h2', {}, 'Host controls'),
    h('div', { class: 'row' },
      h('button', { onclick: undo, disabled: state.pickIndex === 0 }, 'Undo last pick'),
      h('button', { class: 'danger', onclick: reset }, 'Back to lobby'),
    ),
  );
}

// ----- summary -----

function summaryText(state) {
  const lines = [`Age of Innovation draft ${route.id}`, ''];
  state.seatOrder.forEach((uid, i) => {
    const picks = state.byPlayer[uid] || {};
    lines.push(`Seat ${i + 1}${i === 0 ? ' (start player)' : ''}: ${playerName(uid)}`);
    for (const { key, label } of CATEGORIES) {
      const item = findItem(key, picks[key]);
      lines.push(`  ${label}: ${item ? `${item.name} (${item.text})` : '—'}`);
    }
  });
  const leftover = remainingItems(state, 'bonuses').map((id) => itemLabel('bonuses', id));
  lines.push('', `Remaining Round Bonus tiles (place 1 Coin on each): ${leftover.join(', ') || 'none'}`);
  return lines.join('\n');
}

function renderSummary(state) {
  const leftover = remainingItems(state, 'bonuses');
  return h('section', { class: 'card summary' },
    h('div', { class: 'summary-head' },
      h('h2', {}, 'Result'),
      h('button', { class: 'primary', onclick: () => copyText(summaryText(state), 'Summary copied.') }, 'Copy summary'),
    ),
    h('div', { class: 'summary-grid' }, state.seatOrder.map((uid, i) => {
      const picks = state.byPlayer[uid] || {};
      const terrain = findItem('terrains', picks.terrains);
      return h('article', { class: 'summary-player', style: terrain ? { '--swatch': terrain.color } : null },
        h('h3', {}, `Seat ${i + 1}: ${playerName(uid)}`, i === 0 && h('span', { class: 'badge small' }, 'start player')),
        h('dl', {}, CATEGORIES.map(({ key, label }) => {
          const item = findItem(key, picks[key]);
          return [
            h('dt', {}, label),
            h('dd', {}, item ? [h('strong', {}, item.name), h('span', { class: 'muted small' }, ` ${item.text}`)] : '—'),
          ];
        })),
      );
    })),
    h('p', {}, h('strong', {}, 'Remaining Round Bonus tiles'), ' (place 1 Coin on each): ',
      leftover.map((id) => itemLabel('bonuses', id)).join(', ') || 'none'),
  );
}

// ---------- boot ----------

async function boot() {
  try {
    backend = await createBackend();
  } catch (err) {
    console.error(err);
    app.replaceChildren(h('main', {},
      h('section', { class: 'card' },
        h('h2', {}, 'Could not connect'),
        h('p', {}, 'The app could not sign in to Firebase. Check your connection and reload.'),
        h('pre', { class: 'small muted' }, String(err && err.message ? err.message : err)),
      )));
    return;
  }
  window.addEventListener('hashchange', onRouteChange);
  route = { page: null };
  onRouteChange();
}

boot();
