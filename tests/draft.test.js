import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, PALACES } from '../js/data.js';
import { ROUND_SCORES, FINAL_SCORES } from '../js/board-data.js';
import {
  toList, buildTurnOrder, effectiveSeatOrder, buildPool, draftState, pickProblem,
  startProblems, remainingItems, newDraftId, buildBoard, roundScoresValid,
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
    const uid = state.currentPlayer;
    const choice = ['factions', 'terrains', 'palaces', 'bonuses']
      .flatMap((category) => remainingItems(state, category).map((item) => ({ category, item })))
      .find(({ category, item }) => !pickProblem(state, uid, category, item));
    assert.ok(choice, 'there is always a legal pick');
    draft.picks.push({ player: uid, ...choice });
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
  assert.equal(state.currentPlayer, 'b');
  assert.ok(pickProblem(state, 'a', 'factions', 'blessed'), 'not your turn');
  assert.ok(pickProblem(state, 'b', 'factions', 'felines'), 'not in pool');
  assert.equal(pickProblem(state, 'b', 'factions', 'blessed'), null);

  draft.picks.push({ player: 'b', category: 'factions', item: 'blessed' });
  state = draftState(draft);
  assert.equal(state.currentPlayer, 'a');
  assert.ok(pickProblem(state, 'a', 'factions', 'blessed'), 'already taken');

  draft.picks.push({ player: 'a', category: 'factions', item: 'moles' });
  state = draftState(draft);
  assert.equal(state.currentPlayer, 'a', 'snake: a picks twice in a row');
  assert.ok(pickProblem(state, 'a', 'factions', 'omar'), 'already has a faction');
  assert.equal(pickProblem(state, 'a', 'terrains', 'lake'), null);
});

test('draft ids are 6 unambiguous characters', () => {
  for (let i = 0; i < 100; i++) assert.match(newDraftId(), /^[A-HJ-NP-Z2-9]{6}$/);
});

const roundTile = (id) => ROUND_SCORES.find((t) => t.id === id);

test('board setup has the right number of each component', () => {
  for (const n of [2, 3, 4, 5]) {
    const board = buildBoard(n);
    assert.equal(board.rounds.length, 6);
    assert.equal(new Set(board.rounds).size, 6);
    assert.equal(board.bookActions.length, 3);
    assert.equal(board.innovations.length, 2 * n + 2);
    assert.equal(new Set(board.innovations).size, 2 * n + 2);
    assert.equal(board.competencies.length, 12);
    assert.equal(new Set(board.competencies).size, 12);
  }
});

test('round score setup rules always hold', () => {
  for (let i = 0; i < 500; i++) {
    const board = buildBoard(4);
    const rounds = board.rounds.map(roundTile);
    assert.ok(!rounds[4].noLate && !rounds[5].noLate, 'spade tile not in round 5 or 6');
    for (const d of ['banking', 'law', 'engineering', 'medicine']) {
      assert.ok(rounds.slice(0, 5).filter((t) => t.discipline === d).length < 3, `${d} not 3 times in rounds 1-5`);
    }
    const final = FINAL_SCORES.find((t) => t.id === board.finalScore);
    assert.notEqual(final.building, rounds[5].building, 'final tile differs from round 6 building');
  }
});

test('roundScoresValid rejects bad layouts', () => {
  const ids = (...list) => list.map((n) => roundTile(`rs${n}`));
  // rs4 is the spade tile: not allowed in round 5.
  assert.equal(roundScoresValid(ids(1, 2, 5, 6, 4, 7)), false);
  // rs1-rs3 are all Law: not allowed together in rounds 1-5.
  assert.equal(roundScoresValid(ids(1, 2, 3, 5, 6, 7)), false);
  // ...but fine when one of them is in round 6.
  assert.equal(roundScoresValid(ids(1, 2, 5, 6, 7, 3)), true);
});
