# Moteur Réussite Carte

Moteur JavaScript sans dépendance pour la réussite française en grille à 32 cartes, extrait de [Réussite Carte](https://reussite-carte.com/). [English documentation](README.md)

## Installation et démonstration

Depuis votre application, installez une copie locale avec `npm install ../reussite-carte-engine`. Ouvrez directement `demo/index.html` dans votre navigateur pour jouer à la démonstration. Pour exécuter les tests, lancez `npm test` dans le moteur avec Node.js 22 ou plus récent.

```js
const Grid32 = require("reussite-carte-engine");
const deck = Grid32.shuffledDeck();
let etat = Grid32.deal(deck);
let coups = 0;

function jouer() {
  const suivant = Grid32.advance(etat);
  if (!suivant) return;
  etat = suivant;
  coups += 1;
}

const sauvegarde = { deck: deck.map(carte => carte.id), moves: coups };
const reprise = Grid32.restoreSession(sauvegarde);
```

Dans un module ES de Node.js, utilisez `import Grid32 from "reussite-carte-engine"`. Dans le navigateur, chargez `assets/grid32.js` comme script classique puis utilisez `Grid32` dans le script suivant.

```html
<script src="./assets/grid32.js"></script>
<script>
  const grille = Grid32.deal(Grid32.shuffledDeck());
  console.log(grille.reserve.length); // 4
</script>
```

## Règles et API

La donne comprend 28 cartes cachées réparties en quatre rangées de couleur et quatre cartes en réserve. Retournez une carte de la réserve, posez-la dans sa case puis jouez la carte déplacée. Chaque 7 termine une chaîne. Le dernier 7 met fin à la partie. Pour gagner, il faut avoir rangé les 28 cartes de la grille.

- `shuffledDeck(random = Math.random)` mélange les cartes et renvoie un nouveau tableau. Injectez une fonction renvoyant des nombres dans `[0, 1)` pour rejouer des donnes reproductibles.
- `deal(deck)` attend une permutation complète des cartes exportées. L’état contient `grid`, `reserve`, `sevens`, `current`, `placed` et `result`. Une case `null` dans `grid` représente une carte rangée, disponible dans `byCell`. Gardez les autres cartes cachées à l’écran.
- `advance(state)` renvoie le nouvel état ou `null` si la partie est terminée. Conservez les états précédents pour annuler un coup. Traitez le catalogue et les états comme des valeurs en lecture seule.
- `restoreSession({ deck, moves })` rejoue une donne sauvegardée. Fournissez les 32 identifiants numériques et le nombre entier de coups. Une sauvegarde invalide ou impossible renvoie `null`. Dans le résultat `{ deck, state, history }`, l’historique commence par l’état le plus ancien.
- Le catalogue expose `cards`, `suits`, `ranks`, `byCell` et `gridSize`. Une carte contient son libellé français, sa valeur, sa couleur, son symbole et sa destination. La destination d’un 7 vaut `null`. Le résultat vaut `null`, `"won"` ou `"lost"`.

Personnalisez l’apparence en CSS et utilisez `card.rank` et `card.suit` pour retrouver vos propres libellés. L’application hôte gère l’interface et la sauvegarde. Le moteur fonctionne sans DOM, sans réseau et sans stockage.
