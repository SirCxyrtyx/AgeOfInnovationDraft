// Pure draft logic: no DOM or database access, so it can be unit tested in Node.

import { CATEGORIES, ITEMS, poolSize, MIN_PLAYERS, MAX_PLAYERS } from './data.js';
import {
  ROUND_SCORES, FINAL_SCORES, BOOK_ACTIONS, INNOVATIONS, COMPETENCIES, innovationCount,
} from './board-data.js';

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

// Firebase returns arrays as arrays (or as objects with numeric keys if sparse).
export function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => v != null);
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => value[k])
    .filter((v) => v != null);
}

export function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Reverse snake: last seat picks first, then the order snakes back and forth.
// With 4 players: 4-3-2-1, 1-2-3-4, 4-3-2-1, 1-2-3-4.
export function buildTurnOrder(seatOrder) {
  const reversed = [...seatOrder].reverse();
  const turns = [];
  for (let round = 0; round < CATEGORY_KEYS.length; round++) {
    turns.push(...(round % 2 === 0 ? reversed : seatOrder));
  }
  return turns;
}

// Seat order as the host arranged it, with anyone not yet placed appended by join time.
export function effectiveSeatOrder(draft) {
  const players = draft.players || {};
  const ids = Object.keys(players);
  const arranged = toList(draft.seatOrder).filter((id) => players[id]);
  const rest = ids
    .filter((id) => !arranged.includes(id))
    .sort((a, b) => (players[a].joinedAt || 0) - (players[b].joinedAt || 0));
  return [...arranged, ...rest];
}

export function availableItems(category, excluded = {}) {
  const ex = excluded[category] || {};
  return ITEMS[category].filter((item) => !ex[item.id]);
}

// Returns a list of human-readable problems preventing the draft from starting.
export function startProblems(draft) {
  const n = effectiveSeatOrder(draft).length;
  const problems = [];
  if (n < MIN_PLAYERS) problems.push(`Need at least ${MIN_PLAYERS} players.`);
  if (n > MAX_PLAYERS) problems.push(`At most ${MAX_PLAYERS} players can draft.`);
  for (const { key, plural } of CATEGORIES) {
    const available = availableItems(key, draft.excluded).length;
    if (available < Math.max(n, 1)) {
      problems.push(`Not enough ${plural.toLowerCase()} left after exclusions (${available} available, need ${n}).`);
    }
  }
  return problems;
}

// Randomly picks the items on offer for this draft.
export function buildPool(excluded, n, random = Math.random) {
  const pool = {};
  for (const key of CATEGORY_KEYS) {
    const available = availableItems(key, excluded);
    const size = Math.min(poolSize(key, n), available.length);
    const chosen = shuffle(available, random).slice(0, size).map((item) => item.id);
    // Keep the pool in a stable, readable order.
    pool[key] = ITEMS[key].map((item) => item.id).filter((id) => chosen.includes(id));
  }
  return pool;
}

// Round Score tiles, indexed from Round 1, must follow the setup rules: the
// "no late" tile can't be in Round 5 or 6, and Rounds 1–5 can't hold all three
// tiles of one Discipline.
export function roundScoresValid(rounds) {
  if (rounds.slice(4).some((tile) => tile.noLate)) return false;
  const counts = {};
  for (const tile of rounds.slice(0, 5)) {
    counts[tile.discipline] = (counts[tile.discipline] || 0) + 1;
    if (counts[tile.discipline] >= 3) return false;
  }
  return true;
}

// Randomly sets up the board components that players see before drafting.
export function buildBoard(n, random = Math.random) {
  let rounds;
  do {
    rounds = shuffle(ROUND_SCORES, random).slice(0, 6);
  } while (!roundScoresValid(rounds));
  const round6 = rounds[5];
  const finals = FINAL_SCORES.filter((tile) => tile.building !== round6.building);
  return {
    rounds: rounds.map((tile) => tile.id),
    finalScore: shuffle(finals, random)[0].id,
    bookActions: shuffle(BOOK_ACTIONS, random).slice(0, 3).map((tile) => tile.id),
    innovations: shuffle(INNOVATIONS, random).slice(0, innovationCount(n)).map((tile) => tile.id),
    competencies: shuffle(COMPETENCIES, random).map((tile) => tile.id),
  };
}

// Derives everything the UI needs to know about an in-progress draft.
export function draftState(draft) {
  const seatOrder = toList(draft.seatOrder);
  const turnOrder = toList(draft.turnOrder);
  const picks = toList(draft.picks);
  const pool = {};
  for (const key of CATEGORY_KEYS) pool[key] = toList(draft.pool && draft.pool[key]);

  const byPlayer = {};
  for (const id of seatOrder) byPlayer[id] = {};
  const pickedBy = {};
  for (const key of CATEGORY_KEYS) pickedBy[key] = {};
  for (const pick of picks) {
    if (!byPlayer[pick.player]) byPlayer[pick.player] = {};
    byPlayer[pick.player][pick.category] = pick.item;
    pickedBy[pick.category][pick.item] = pick.player;
  }

  const pickIndex = picks.length;
  const done = turnOrder.length > 0 && pickIndex >= turnOrder.length;
  const currentPlayer = done ? null : turnOrder[pickIndex] || null;
  const nextSlot = nextPickSlot(draft.picks);

  return { seatOrder, turnOrder, picks, pool, byPlayer, pickedBy, pickIndex, nextSlot, done, currentPlayer };
}

// Slot numbers of the stored picks, in order. Firebase may return the picks as an
// array with holes or as an object with numeric keys.
function pickSlots(picks) {
  if (!picks) return [];
  return Object.keys(picks)
    .filter((key) => picks[key] != null)
    .map(Number)
    .sort((a, b) => a - b);
}

// Where the next pick is stored: after the highest slot in use, so a gap left in
// the picks can't make every new pick collide with an existing one.
export function nextPickSlot(picks) {
  const slots = pickSlots(picks);
  return slots.length ? slots[slots.length - 1] + 1 : 0;
}

// The stored picks without the last one, for undo. Returns undefined (no change)
// unless the last stored pick is still `expected`, so an undo confirmed after
// someone else picked can't remove the wrong pick. With no picks it returns null:
// Firebase may first run a transaction on an empty local copy, and then retries
// with the server's value if that differs.
export function withoutLastPick(picks, expected) {
  const slots = pickSlots(picks);
  if (!slots.length) return null;
  if (!expected) return undefined;
  const last = picks[slots[slots.length - 1]];
  const same = ['player', 'category', 'item', 'at'].every((key) => last[key] === expected[key]);
  if (!same) return undefined;
  if (slots.length === 1) return null;
  const out = {};
  for (const slot of slots.slice(0, -1)) out[slot] = picks[slot];
  return out;
}

// Returns null if the pick is legal, otherwise the reason it is not.
export function pickProblem(state, player, category, item) {
  if (state.done) return 'The draft is finished.';
  if (state.currentPlayer !== player) return 'It is not this player\'s turn.';
  if (!CATEGORY_KEYS.includes(category)) return 'Unknown category.';
  if (!state.pool[category].includes(item)) return 'That item is not in the draft.';
  if (state.pickedBy[category][item]) return 'That item has already been taken.';
  if (state.byPlayer[player] && state.byPlayer[player][category]) return 'This player already has one of those.';
  return null;
}

export function remainingItems(state, category) {
  return state.pool[category].filter((id) => !state.pickedBy[category][id]);
}

export function newDraftId(random = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += alphabet[Math.floor(random() * alphabet.length)];
  return id;
}
