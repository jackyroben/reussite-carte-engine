# Réussite Carte Engine

A dependency-free JavaScript engine for French 32-card grid solitaire, extracted from [Réussite Carte](https://reussite-carte.com/). [Documentation française](README.fr.md)

## Install and try it

From your application, install a local checkout with `npm install ../reussite-carte-engine`. Open `demo/index.html` directly in a browser to play the reference demo. Run `npm test` from the engine checkout with Node.js 22 or newer.

```js
const { shuffledDeck, deal, advance, restoreSession } = require("reussite-carte-engine");
const deck = shuffledDeck();
let state = deal(deck);
let moves = 0;

function next() {
  const updated = advance(state);
  if (!updated) return;
  state = updated;
  moves += 1;
}

const json = () => JSON.stringify({ deck: deck.map(card => card.id), moves });
const restored = restoreSession(JSON.parse(json())); // { deck, state, history }
```

In Node.js ES modules, use `import Grid32 from "reussite-carte-engine"`. In a browser, serve `assets/grid32.js` as a classic script and access `Grid32` in the script that follows.

```html
<script src="./assets/grid32.js"></script>
<script>
  const table = Grid32.deal(Grid32.shuffledDeck());
  console.log(table.reserve.length); // 4
</script>
```

## Rules and API

The deal contains 28 face-down cards in four suit rows and four reserve cards. Draw from the reserve, place the current card in its assigned cell, then play the card it displaced. A seven ends that chain. The last seven ends the game, with a win only if all 28 grid cards were placed.

- `shuffledDeck(random = Math.random)` returns a fresh array of card objects. Supply a function returning values in `[0, 1)` for seeded puzzles and deterministic tests.
- `deal(deck)` expects a complete permutation of the exported cards. It returns `grid`, `reserve`, `sevens`, `current`, `placed` and `result`. Null grid cells represent placements. Look up the displayed card in `byCell[cell]`. Hide the other grid cards in your interface.
- `advance(state)` returns a new state or `null` once play has ended. Save prior snapshots for undo. Treat the states and catalog as read-only.
- `restoreSession({ deck, moves })` replays a saved deal. Pass an array of all 32 stable integer card IDs and an integer move count. It returns `null` for invalid or impossible saves. The `history` array starts with the oldest state.
- The catalog exports `cards`, `suits`, `ranks`, `byCell` and `gridSize`. `result` is `null`, `"won"` or `"lost"`. A card includes its French label, rank, suit index, symbol, color and destination. Sevens have a `null` destination.

Keep layout, translated labels and persistence in your application. For instance, use `card.rank` and `card.suit` to look up translated names, and CSS to style your table. The engine uses no DOM, network or storage.
