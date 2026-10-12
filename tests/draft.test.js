import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, PALACES } from '../js/data.js';
import {
  toList, buildTurnOrder, effectiveSeatOrder, buildPool, draftState, pickProblem,
  startProblems, remainingItems, newDraftId,
} from '../js/draft.js';

test('reverse snake starts with the last seat', () => {
  assert.deepEqual(buildTurnOrder(['a', 'b', 'c', 'd']), [
    'd', 'c', 'b', 'a',
    'a', 'b', 'c', 'd',
    'd', 'c', 'b', 'a',
    'a', 'b', 'c', 'd',
  ]);
  assert.deepEqual(buildTurnOrder(['a', 'b']), ['b', 'a', 'a', 'b', 'b', 'a', 'a', 'b']);
});

test('toList handles arrays, sparse objects and null', () => {
  assert.deepEqual(toList(null), []);
  assert.deepEqual(toList(['x', null, 'y']), ['x', 'y']);
  assert.deepEqual(toList({ 10: 'k', 2: 'b', 0: 'a' }), ['a', 'b', 'k']);
});

test('effective seat order keeps host arrangement and appends late joiners', () => {
  const draft = {
    players: {
      a: { name: 'A', joinedAt: 1 },
      b: { name: 'B', joinedAt: 2 },
      c: { name: 'C', joinedAt: 3 },
    },
    seatOrder: ['b', 'gone', 'a'],
  };
  assert.deepEqual(effectiveSeatOrder(draft), ['b', 'a', 'c']);
});

test('pool sizes follow N+1 / 6 / N+1 / N+3 and skip palace 17', () => {
  for (const n of [2, 3, 4, 5]) {
    const pool = buildPool({}, n);
    assert.equal(pool.factions.length, n + 1);
    assert.equal(pool.terrains.length, 6);
    assert.equal(pool.palaces.length, n + 1);
    assert.equal(pool.bonuses.length, n + 3);
    for (const key of Object.keys(pool)) {
      assert.equal(new Set(pool[key]).size, pool[key].length, `${key} has duplicates`);
    }
  }
  assert.ok(!PALACES.some((p) => p.id === 'p17'));
});

test('excluded items never appear in the pool', () => {
  const excluded = { factions: { blessed: true, moles: true }, terrains: { swamp: true } };
  for (let i = 0; i < 50; i++) {
    const pool = buildPool(excluded, 5);
    assert.ok(!pool.factions.includes('blessed'));
    assert.ok(!pool.factions.includes('moles'));
    assert.ok(!pool.terrains.includes('swamp'));
    assert.equal(pool.terrains.length, 6);
  }
});

test('start problems report player counts and over-exclusion', () => {
  const players = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`p${i}`, { name: `P${i}`, joinedAt: i }]));
  assert.equal(startProblems({ players: players(1) }).length, 1);
  assert.deepEqual(startProblems({ players: players(4) }), []);
  assert.equal(startProblems({ players: players(6) }).length, 1);
  const tooFewTerrains = Object.fromEntries(ITEMS.terrains.slice(0, 4).map((t) => [t.id, true]));
  assert.equal(startProblems({ players: players(4), excluded: { terrains: tooFewTerrains } }).length, 1);
});

function playDraft(seats) {
  const draft = {
    seatOrder: seats,
    turnOrder: buildTurnOrder(seats),
    pool: buildPool({}, seats.length),
    picks: [],
  };
  return draft;
}

test('a full draft gives each player one item per category', () => {
  const draft = playDraft(['a', 'b', 'c']);
  let state = draftState(draft);
  while (!state.done) {
    const uid = state.currentUid;
    const choice = ['factions', 'terrains', 'palaces', 'bonuses']
      .flatMap((category) => remainingItems(state, category).map((item) => ({ category, item })))
      .find(({ category, item }) => !pickProblem(state, uid, category, item));
    assert.ok(choice, 'there is always a legal pick');
    draft.picks.push({ uid, ...choice });
    state = draftState(draft);
  }
  assert.equal(state.picks.length, 12);
  for (const uid of ['a', 'b', 'c']) {
    assert.deepEqual(Object.keys(state.byPlayer[uid]).sort(), ['bonuses', 'factions', 'palaces', 'terrains']);
  }
  assert.equal(remainingItems(state, 'bonuses').length, 3);
  assert.equal(remainingItems(state, 'terrains').length, 3);
});

test('pickProblem rejects illegal picks', () => {
  const draft = playDraft(['a', 'b']);
  draft.pool = { factions: ['blessed', 'moles', 'omar'], terrains: ['lake'], palaces: ['p1'], bonuses: ['b1'] };
  let state = draftState(draft);
  assert.equal(state.currentUid, 'b');
  assert.ok(pickProblem(state, 'a', 'factions', 'blessed'), 'not your turn');
  assert.ok(pickProblem(state, 'b', 'factions', 'felines'), 'not in pool');
  assert.equal(pickProblem(state, 'b', 'factions', 'blessed'), null);

  draft.picks.push({ uid: 'b', category: 'factions', item: 'blessed' });
  state = draftState(draft);
  assert.equal(state.currentUid, 'a');
  assert.ok(pickProblem(state, 'a', 'factions', 'blessed'), 'already taken');

  draft.picks.push({ uid: 'a', category: 'factions', item: 'moles' });
  state = draftState(draft);
  assert.equal(state.currentUid, 'a', 'snake: a picks twice in a row');
  assert.ok(pickProblem(state, 'a', 'factions', 'omar'), 'already has a faction');
  assert.equal(pickProblem(state, 'a', 'terrains', 'lake'), null);
});

test('draft ids are 6 unambiguous characters', () => {
  for (let i = 0; i < 100; i++) assert.match(newDraftId(), /^[A-HJ-NP-Z2-9]{6}$/);
});
