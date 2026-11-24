"use strict";

const grid = document.getElementById("grid");
const status = document.getElementById("status");
const next = document.getElementById("next");
const { suits, ranks, byCell, shuffledDeck, deal, advance } = Grid32;
let state;

function render() {
  grid.replaceChildren();
  for (const [suit, seven] of state.sevens.entries()) {
    const row = document.createElement("div");
    row.className = "row";
    for (const [column, rank] of ["7", ...ranks].entries()) {
      const cell = document.createElement("span");
      const index = suit * ranks.length + column - 1;
      const card = column === 0 ? seven : state.grid[index] === null ? byCell[index] : null;
      cell.className = "cell " + (card ? card.color : "hidden");
      cell.textContent = card ? card.value + card.symbol : column === 0 ? suits[suit].symbol : rank;
      row.append(cell);
    }
    grid.append(row);
  }
  const { current, placed, reserve, result } = state;
  const message = result === "won" ? "Réussite !" : result === "lost" ? "Partie terminée." : "";
  status.textContent = [message, current?.label, `${placed}/28 cartes rangées. ${reserve.length} en réserve.`]
    .filter(Boolean).join(" ");
  next.textContent = current ? "Placer la carte" : "Retourner une carte";
  next.disabled = Boolean(result);
}

function newGame() {
  state = deal(shuffledDeck());
  render();
}

next.addEventListener("click", () => {
  state = advance(state);
  render();
});
document.getElementById("new").addEventListener("click", newGame);
newGame();
