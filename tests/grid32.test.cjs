"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { cards, ranks, suits, byCell, gridSize, shuffledDeck, deal, advance, restoreSession } =
  require("../assets/grid32.js");

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function verifyCards(state) {
  const inPlay = state.grid.map((card, cell) => card ?? byCell[cell])
    .concat(state.reserve, state.sevens, state.current).filter(Boolean);
  assert.deepEqual(Array.from(inPlay, card => card.id).sort((a, b) => a - b), Array.from(cards, card => card.id));
  assert.equal(state.grid.filter(card => card === null).length, state.placed);
  state.sevens.forEach((seven, suit) => {
    if (seven) assert.ok(seven.rank === 7 && seven.suit === suit);
  });
}

test("a seeded shuffle reproduces the 32 unique cards and deals 28 grid cards and four reserve cards", () => {
  assert.equal(cards.length, 32);
  assert.equal(new Set(cards.map(card => card.id)).size, 32);
  assert.deepEqual([...ranks], ["8", "9", "10", "V", "D", "R", "A"]);
  for (const [suit, { symbol }] of suits.entries()) {
    const matching = cards.filter(card => card.suit === suit);
    assert.deepEqual(Array.from(matching, card => card.rank), [1, 7, 8, 9, 10, 11, 12, 13]);
    assert.ok(matching.every(card => card.symbol === symbol));
  }
  assert.deepEqual(byCell.slice(0, 7).map(card => card.value), ranks);
  const deck = shuffledDeck(seededRandom(29));
  assert.deepEqual(deck, shuffledDeck(seededRandom(29)));
  assert.notDeepEqual(deck, shuffledDeck(seededRandom(30)));
  const state = deal(deck);
  assert.deepEqual(state.grid, deck.slice(0, 28));
  assert.deepEqual(state.reserve, deck.slice(28));
  assert.equal(state.current, null);
  assert.equal(state.placed, 0);
  verifyCards(state);
});

test("a placement reveals its occupant, and each seven terminates exactly one chain", () => {
  const outcomes = new Set();
  for (let seed = 0; seed < 150; seed++) {
    let state = deal(shuffledDeck(seededRandom(seed)));
    let draws = 0;
    let steps = 0;
    while (!state.result) {
      assert.ok(++steps <= 36, "each deal must terminate");
      const next = advance(state);
      verifyCards(next);
      if (!state.current) {
        draws++;
        assert.equal(next.current, state.reserve[0]);
        assert.equal(next.reserve.length, 4 - draws);
        assert.equal(next.placed, state.placed);
        assert.equal(next.result, null, "an empty reserve by itself does not end play");
      } else if (state.current.rank === 7) {
        assert.equal(next.current, null);
        assert.equal(next.sevens[state.current.suit], state.current);
        assert.equal(next.sevens.filter(Boolean).length, draws);
        assert.equal(next.placed, state.placed);
        if (draws < 4) assert.equal(next.result, null);
      } else {
        const { cell } = state.current;
        assert.equal(next.current, state.grid[cell]);
        assert.equal(next.grid[cell], null);
        assert.equal(next.placed, state.placed + 1);
        assert.equal(byCell[cell], state.current);
      }
      state = next;
    }
    assert.equal(draws, 4);
    assert.equal(state.reserve.length, 0);
    assert.equal(state.sevens.filter(Boolean).length, 4);
    assert.equal(state.result, state.placed === gridSize ? "won" : "lost");
    assert.equal(advance(state), null);
    outcomes.add(state.result);
  }
  assert.deepEqual(outcomes, new Set(["won", "lost"]));
});

test("a completed grid waits for the remaining sevens, and hidden cards in the right cells still count as hidden", () => {
  const sevens = cards.filter(card => card.rank === 7);
  const deck = [...byCell.slice(1), sevens[0], byCell[0], ...sevens.slice(1)];
  let state = advance(deal(deck));
  for (let index = 0; index < gridSize; index++) state = advance(state);
  assert.equal(state.placed, 28);
  assert.equal(state.current, sevens[0]);
  state = advance(state);
  assert.equal(state.result, null);
  for (let index = 0; index < 6; index++) state = advance(state);
  assert.equal(state.result, "won");
  verifyCards(state);

  state = deal([...byCell, ...sevens]);
  for (let index = 0; index < 8; index++) state = advance(state);
  assert.equal(state.result, "lost");
  assert.equal(state.placed, 0);
  verifyCards(state);
});

test("the saved deal and the prior states can restart and undo each kind of action", () => {
  const deck = shuffledDeck(seededRandom(18));
  const initial = deal(deck);
  let state = initial;
  const history = [];
  while (!state.result) {
    // The controller keeps these snapshots. Transitions must preserve their arrays.
    Object.freeze(state);
    for (const field of ["grid", "reserve", "sevens"]) Object.freeze(state[field]);
    const next = advance(state);
    history.push(state);
    assert.deepEqual(advance(history.at(-1)), next);
    state = next;
  }
  assert.deepEqual(deal(deck), initial);
  while (history.length) {
    const previous = history.pop();
    assert.deepEqual(advance(previous), state);
    verifyCards(previous);
    state = previous;
  }
  assert.deepEqual(state, initial);
});

test("the saved deck and move cursor restore every state and undo step in a win and a loss", () => {
  const results = [];
  for (const seed of [2, 0]) {
    const deck = shuffledDeck(seededRandom(seed));
    const ids = deck.map(card => card.id);
    const history = [];
    let state = deal(deck);
    while (true) {
      const reloaded = restoreSession(JSON.parse(JSON.stringify({ deck: ids, moves: history.length })));
      assert.deepEqual(reloaded.deck, deck);
      assert.deepEqual(reloaded.state, state);
      assert.deepEqual(Array.from(reloaded.history), history);
      if (state.result) break;
      history.push(state);
      state = advance(state);
    }
    results.push(state.result);
  }
  assert.deepEqual(results, ["won", "lost"]);
});

test("missing, malformed and impossible 32-card saves are rejected", () => {
  const ids = shuffledDeck(seededRandom(0)).map(card => card.id);
  for (const bad of [
    null, {}, { deck: ids.slice(1), moves: 0 },
    { deck: [ids[1], ...ids.slice(1)], moves: 0 },
    { deck: [-1, ...ids.slice(1)], moves: 0 },
    { deck: ids, moves: -1 }, { deck: ids, moves: 1.5 }, { deck: ids, moves: 37 },
    { deck: ids, moves: 25 }, // Seed 0 finishes with 16 placements and 8 other actions.
  ]) assert.equal(restoreSession(bad), null);
});
