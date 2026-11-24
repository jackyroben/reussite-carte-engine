"use strict";

// Réussite Carte 32-card engine · https://reussite-carte.com/
const Grid32 = (() => {
  const suits = Object.freeze([
    { symbol: "♠", name: "pique", color: "black" },
    { symbol: "♥", name: "cœur", color: "red" },
    { symbol: "♣", name: "trèfle", color: "black" },
    { symbol: "♦", name: "carreau", color: "red" },
  ].map(Object.freeze));
  const ranks = Object.freeze(["8", "9", "10", "V", "D", "R", "A"]);
  const gridSize = suits.length * ranks.length;
  const deckRanks = [
    [1, "A", "As"], [7, "7", "Sept"], [8, "8", "Huit"], [9, "9", "Neuf"],
    [10, "10", "Dix"], [11, "V", "Valet"], [12, "D", "Dame"], [13, "R", "Roi"],
  ];
  const cards = Object.freeze(suits.flatMap((info, suit) => deckRanks.map(([rank, value, name]) => Object.freeze({
    // Keep the 52-card IDs so existing serialized deals still replay in order.
    id: suit * 13 + rank - 1, suit, rank, ...info, value, label: `${name} de ${info.name}`,
    cell: rank === 7 ? null : suit * ranks.length + ranks.indexOf(value),
  }))));
  const byCell = Array(gridSize);
  const byId = new Map(cards.map(card => [card.id, card]));
  for (const card of cards) {
    if (card.cell !== null) byCell[card.cell] = card;
  }

  function shuffledDeck(random = Math.random) {
    const deck = [...cards];
    for (let index = deck.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [deck[index], deck[swap]] = [deck[swap], deck[index]];
    }
    return deck;
  }

  function deal(deck) {
    return {
      grid: deck.slice(0, gridSize),
      reserve: deck.slice(gridSize),
      sevens: Array(suits.length).fill(null),
      current: null,
      placed: 0,
      result: null,
    };
  }

  function advance(state) {
    if (state.result) return null;
    const { current } = state;
    if (!current) {
      return { ...state, current: state.reserve[0], reserve: state.reserve.slice(1) };
    }
    if (current.cell === null) {
      const sevens = [...state.sevens];
      sevens[current.suit] = current;
      let result = null;
      if (state.reserve.length === 0) result = state.placed === gridSize ? "won" : "lost";
      return { ...state, current: null, sevens, result };
    }
    const grid = [...state.grid];
    const displaced = grid[current.cell];
    grid[current.cell] = null;
    return { ...state, grid, current: displaced, placed: state.placed + 1 };
  }

  function restoreSession(saved) {
    if (!Array.isArray(saved?.deck) || saved.deck.length !== cards.length
      || new Set(saved.deck).size !== cards.length || !saved.deck.every(id => byId.has(id))
      || !Number.isInteger(saved.moves) || saved.moves < 0 || saved.moves > cards.length + suits.length) {
      return null;
    }
    // One legal action per position makes the deck and cursor sufficient to restore undo and the board.
    const deck = Array.from(saved.deck, id => byId.get(id));
    let state = deal(deck);
    const history = [];
    for (let move = 0; move < saved.moves; move++) {
      const next = advance(state);
      if (!next) return null;
      history.push(state);
      state = next;
    }
    return { deck, state, history };
  }

  return { suits, ranks, cards, byCell: Object.freeze(byCell), gridSize, shuffledDeck, deal, advance, restoreSession };
})();

if (typeof module === "object" && module.exports) module.exports = Grid32;
