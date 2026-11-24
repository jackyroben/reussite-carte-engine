# Moteur Réussite Carte

[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![Dernière version](https://img.shields.io/github/v/release/jackyroben/reussite-carte-engine)](https://github.com/jackyroben/reussite-carte-engine/releases/latest)
[![Tests du moteur](https://github.com/jackyroben/reussite-carte-engine/actions/workflows/tests.yml/badge.svg)](https://github.com/jackyroben/reussite-carte-engine/actions/workflows/tests.yml)

Grid32 est un moteur JavaScript sans dépendance pour la réussite française en grille à 32 cartes. Il propose des donnes reproductibles, des transitions sans mutation et une sauvegarde compacte qui permet de rejouer une donne.

[Site Réussite Carte](https://reussite-carte.com/) · [Intégration des widgets](https://reussite-carte.com/integrer/) · [Démonstration jouable](https://jackyroben.github.io/reussite-carte-engine/demo/) · [English documentation](README.md)

## Installation et démonstration

Clonez ce dépôt puis, depuis votre application, installez la copie locale avec `npm install ../reussite-carte-engine`. Vous pouvez jouer hors ligne en ouvrant `demo/index.html` dans votre navigateur. L’API Node et les tests nécessitent Node.js 22 ou plus récent.

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

Pour une iframe prête à l’emploi, choisissez votre jeu dans le [configurateur de widgets](https://reussite-carte.com/integrer/) et copiez son code HTML.

## Développement

Lancez `npm test` depuis le dépôt. Consultez le [journal des changements](CHANGELOG.md) et le [guide de contribution](CONTRIBUTING.md).
