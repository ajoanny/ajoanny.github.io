---
title: Développer, tester et refactorer avec l'IA
pubDatetime: 2026-03-24
featured: false
draft: false
tags:
  - Refactoring
  - Tests
  - IA
description: Utiliser l'IA pour générer du code, faire du refactoring et poser des tests.
---

En tant que développeurs, nous disposons de nombreux outils pour nous accompagner et faciliter le développement
d'applications. Aujourd’hui, les outils les plus mis en avant sont les IA permettant de générer du code. Ces derniers mois,
ces outils se sont bien améliorés. Sensible aux bonnes pratiques de développement, je me suis interrogé sur l’intérêt d’intégrer
ces outils à ma manière de travailler, ainsi que sur la façon de les utiliser efficacement.
J’ai régulièrement réalisé des katas de code pour apprendre et expérimenter différentes approches de refactoring, de test
et de conception. Il m’a semblé pertinent de mettre ces outils à l’épreuve dans ce contexte et de partager mes impressions
ainsi que mon ressenti sur leur utilisation à travers cet article.

## Table of contents

## Le Contexte

C'est le kata [Gilded Rose](https://github.com/emilybache/GildedRose-Refactoring-Kata/blob/main/GildedRoseRequirements_fr.md) que j'ai choisis pour tester le génération de code.

Le kata consiste à ajouter une fonctionnalité à du code de "mauvaise qualité", non testé et aux spécifications
incomplètes. Je vais partir du principe que les lecteurs connaissent [les règles de Gilded Rose](https://github.com/emilybache/GildedRose-Refactoring-Kata/blob/main/GildedRoseRequirements_fr.md)
et je vous invite à les lire, si ce n'est pas le cas pour mieux appréhender le contexte fonctionnel de mes expérimentations.

Mon but était de résoudre kata en respectant les contraintes de design de son énoncé, tout en générant le code et les
tests à l’aide de l’IA.

Je vais utiliser l'IA pour :

- Générer des tests de caractérisation
- Ajouter la feature
- Ajouter des tests
- Refactorer le code

Pour ces expérimentations j'ai utilisé :

- L'IDE WebStorm
- Le plugin **AI Chat** avec l'agent **Claud Code**

Pour m'assurer de conserver le comportement au fil des différentes modifications, j’ai utilisé un golden master. Je ne vais
pas détailler la méthode comment ici, mais vous pouvez regarder [la préséntation de David Gageot à l'USI](https://www.youtube.com/watch?v=q11gydDAMSo)
pour savoir comment j'ai procédé.

Je n'ai pas pour but de donner le nom du modèle le plus performant pour générer du code. Je partage mes expériences en
dehors d'un contexte de production, mes réflexions sur ce type d'outils et les manières dont j'envisage de les intégrer
dans ma manière de développeur. Au fil de l'article, je vais partager les instructions que j'ai utilisées pour le prompt,
le code qui a été généré, les réussites et les difficultés rencontrées. Une partie importante de l'article est composé
de code. Je donne mon opinion sur le code basé sur les standards de code que j'ai en travaillant qui peuvent différer des
vôtres. Le code et les instructions du prompt sont là pour contextualiser mes réflexions
et aussi vous permettre de formuler les vôtres.

Tout le code est disponible sur ce [repository](https://github.com/ajoanny/gilded-rose-ia) et je me suis efforcé de mettre
les liens vers les commits correspondant aux exemples de code.

## Approche **Directe**

Ma première approche a été de générer du code en donnant assez peu d'indication à l'IA.

### Tests de Caractérisation

Les tests de caractérisation sont des tests appliqués à du code qui n’a pas encore été testé. Le principe est simple : écrire
un test qui capture le comportement existant du code, sans se soucier de sa validité. On construit une suite de tests
permettant de s’assurer que lors d’un refactoring le comportement reste inchangé.

Le code et mes expérimentations sont disponibles sur la branche [tests/mutation](https://github.com/ajoanny/gilded-rose-ia/tree/tests/mutation).

#### Génération des tests

Pour générer les tests, j'ai utilisé les instructions suivantes :

_Prompt:_

> Generate tests for:
>
> - GildedRose class from golden-master.ts
> - Add tests in gilded-rose.spec.ts

Les tests générés sont disponibles [ici](https://github.com/ajoanny/gilded-rose-ia/blob/tests/mutation/test/gilded-rose.spec.ts).

Il y a 25 tests sur 188 lignes de code et tous les tests passent. Ils sont globalement organisés par type de produits et les cas de tests principaux
par type de produits sont présents. On trouve aussi des tests pour certains des cas aux limites. Les descriptions des tests
correspondent aux spécifications du kata.
Sans être parfaite, je trouve que c'est une bonne base de départ pour des tests de caractérisations surtout en prenant en compte l'effort
humain fournis pour les générer.
La première chose importante à noter c'est que les tests ne sont pas complets, il manque une partie des cas aux limites
et il y a une légère de la duplication dans les tests.

```ts
//gilded-rose.spec.ts:90
it("should increase quality by 2 when sellIn is 10 days or less", () => {
  const gildedRose = new GildedRose([
    new Item("Backstage passes to a TAFKAL80ETC concert", 10, 20),
  ]);
  gildedRose.updateQuality();
  expect(gildedRose.items[0].quality).toBe(22);
  expect(gildedRose.items[0].sellIn).toBe(9);
});

it("should increase quality by 3 when sellIn is 5 days or less", () => {
  const gildedRose = new GildedRose([
    new Item("Backstage passes to a TAFKAL80ETC concert", 5, 20),
  ]);
  gildedRose.updateQuality();
  expect(gildedRose.items[0].quality).toBe(23);
  expect(gildedRose.items[0].sellIn).toBe(4);
});

//gilded-rose.spec.ts:117
it("should increase quality by 2 when sellIn is exactly 10", () => {
  const gildedRose = new GildedRose([
    new Item("Backstage passes to a TAFKAL80ETC concert", 10, 20),
  ]);
  gildedRose.updateQuality();
  expect(gildedRose.items[0].quality).toBe(22);
});

it("should increase quality by 3 when sellIn is exactly 5", () => {
  const gildedRose = new GildedRose([
    new Item("Backstage passes to a TAFKAL80ETC concert", 5, 20),
  ]);
  gildedRose.updateQuality();
  expect(gildedRose.items[0].quality).toBe(23);
});
```

Il est intéressant de noter que bien que les descriptions des tests soient différentes les données utilisées et les assertions
sont les mêmes d'où la duplication.
Un second point à soulever, je connais bien les règles du Gilded Rose et j'ai fait plusieurs fois le kata. Ce contexte
relativement petit que je connais bien a rendu la revue du code assez simple. Je pense que dans un contexte différent, moins
familier ou avec une complexité fonctionnelle plus grande, l'effort de relecture serait probablement plus important pour
être capable de vérifier de la pertinence des tests. En ayant simplement plus de code, je ne suis pas sûr que j'aurais été
capable de détecter aussi facilement la duplication dans les tests.

#### Mutation Testing

Pour vérifier mes propos sur la complétude des tests, j'ai décidé de faire quelques tests de mutations.
C'est une pratique que je fais en revue de code que (pratique que j'ai emprunté à mon 1er tech lead que je remercie) qui est assez simple :
changer un peu les implémentations pour voir si les tests passent.

```ts
//gilded-rose.mutation.ts:32
if (this.items[i].sellIn === 10) {
  if (this.items[i].quality < 50) {
    this.items[i].quality = this.items[i].quality + 1
  }
}
if (this.items[i].sellIn < 6) {
  if (this.items[i].quality < 50) {
    this.items[i].quality = this.items[i].quality + 2
  }
}

//gilded-rose.mutation.ts:48
  if (this.items[i].sellIn === -1)
```

Ce que j'ai fait concrètement, c'est changer les conditions de certains `if` et ajuster la valeur ajoutée à la qualité.
Ensuite, j'ai lancé les tests en utilisant cette nouvelle implémentation. Sans surprise, les tests caractérisations sont
passé. Par contre, les tests du golden master ne passaient plus ce qui m'a permis de confirmer que le comportement avait changé.

En comparaison à la 1ère fois où j'ai fait le kata avoir une suite de test en quelques minutes est très agréable. Le problème
est que la suite de tests était incomplète et pas suffisante pour permettre d'être un véritable filet de sécurité pour les refactoring.

Je pense que ça peut devenir un bon outil pour ajouter des tests sur des bases de code qui en manquent. Pour mitiger
l'effort de relecture, je me suis demandé si générer les tests un par un serait efficace.

Vous pouvez refaire l'expérience en vous mettant sur la branche [tests/mutation](https://github.com/ajoanny/gilded-rose-ia/tree/tests/mutation)
et en lançant les tests vous-même. Vous pouvez aussi essayer de trouver des mutations qui ne cassent pas les tests.

#### Ajouter une feature

Le code: Le code: [Approche directe: Feature add Conjured item](https://github.com/ajoanny/gilded-rose-ia/commit/c56f2709a0f32d1db6bf306105937996373405aa)

Pour l'ajout de la fonctionnalité des produits `Conjured` (produits qui perdent en qualité 2 fois plus vite que les
autres produits), j'ai essayé de générer l'implémentation et les tests en une seule fois.

_Prompt:_

> Add feature "Conjured" in the updateQuality method of GildedRose
> Step:
>
> - File gilded-rose.ai.1.ts
> - Quality of "Conjured" item decreases 2 times faster.
> - Add tests in gilded-rose-ia.1.spec.ts

```ts
//gilded-rose.ai.1.ts:23
if (this.items[i].quality > 0) {
  if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
    const degradationRate = this.items[i].name.startsWith("Conjured") ? 2 : 1;
    this.items[i].quality = this.items[i].quality - degradationRate;
  }
}
//gilded-rose.ai.1.ts:52
if (this.items[i].quality > 0) {
  if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
    const degradationRate = this.items[i].name.startsWith("Conjured") ? 2 : 1;
    this.items[i].quality = this.items[i].quality - degradationRate;
  }
}

//gilded-rose.spec.ts:160
describe("Conjured items", () => {
  it("should decrease quality by 2 for Conjured items", () => {
    const gildedRose = new GildedRose([new Item("Conjured Mana Cake", 10, 20)]);
    gildedRose.updateQuality();
    expect(gildedRose.items[0].quality).toBe(18);
    expect(gildedRose.items[0].sellIn).toBe(9);
  });

  it("should decrease quality by 4 when sellIn date has passed", () => {
    const gildedRose = new GildedRose([new Item("Conjured Mana Cake", 0, 20)]);
    gildedRose.updateQuality();
    expect(gildedRose.items[0].quality).toBe(16);
    expect(gildedRose.items[0].sellIn).toBe(-1);
  });

  it("should never have negative quality", () => {
    const gildedRose = new GildedRose([new Item("Conjured Mana Cake", 5, 1)]);
    gildedRose.updateQuality();
    expect(gildedRose.items[0].quality).toBe(0);
  });

  it("should handle quality of 0", () => {
    const gildedRose = new GildedRose([new Item("Conjured Mana Cake", 5, 0)]);
    gildedRose.updateQuality();
    expect(gildedRose.items[0].quality).toBe(0);
  });

  it("should degrade twice as fast as normal items before expiry", () => {
    const normalItem = new GildedRose([new Item("Normal Item", 10, 20)]);
    const conjuredItem = new GildedRose([new Item("Conjured Item", 10, 20)]);

    normalItem.updateQuality();
    conjuredItem.updateQuality();

    expect(normalItem.items[0].quality).toBe(19);
    expect(conjuredItem.items[0].quality).toBe(18);
  });

  it("should degrade twice as fast as normal items after expiry", () => {
    const normalItem = new GildedRose([new Item("Normal Item", -1, 20)]);
    const conjuredItem = new GildedRose([new Item("Conjured Item", -1, 20)]);

    normalItem.updateQuality();
    conjuredItem.updateQuality();

    expect(normalItem.items[0].quality).toBe(18);
    expect(conjuredItem.items[0].quality).toBe(16);
  });
});
```

J'ai lancé les tests et l'un d'eux échouait (`should never have negative quality`).
La condition vérifiant que `quality` est strictement positive n'ayant pas été modifiée, un produit `Conjured` avec une qualité
de 1 et un `sellIn` positif se retrouvait avec une qualité négative. Ensuite, j'ai utilisé le golden master pour vérifier
que rien d'autre n'était cassé.
On peut également noter que le manque de clarté dans mes instructions a conduit l’IA à considérer que les produits `Conjured`
avaient un nom commençant par `Conjrued`.

Après ces différents constats, j'ai utilisé le prompt pour faire passer le test.

_Prompt:_

> Test "Gilded Rose - Golden Master", "Conjured items", "should never have negative quality" does not work:
>
> - correct implementation in gilded-rose.ai.1.ts

Le code: [Approche directe: Feature correct Conjured item](https://github.com/ajoanny/gilded-rose-ia/commit/d5d669e58293aea923d36cb787e36f681c088369)

```ts
//gilded-rose.ai.1.ts:23
if (this.items[i].quality > 0) {
  if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
    const degradationRate = this.items[i].name.startsWith("Conjured") ? 2 : 1;
    this.items[i].quality = Math.max(
      0,
      this.items[i].quality - degradationRate
    );
  }
}

//gilded-rose.ai.1.ts:52
if (this.items[i].quality > 0) {
  if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
    const degradationRate = this.items[i].name.startsWith("Conjured") ? 2 : 1;
    this.items[i].quality = Math.max(
      0,
      this.items[i].quality - degradationRate
    );
  }
}
```

La correction a permis de faire passer les tests et la correction n'a introduit aucune régressions.
Certains tests mélangeaient plusieurs cas, ce qui de mon point de vue est un problème d'intension. Dans
deux tests, on vérifiait à la fois le comportant pour les produits simples et pour les produits `Conjured`.
(`should degrade twice as fast as normal items before expiry`,`should degrade twice as fast as normal items after expiry`).
Autre point problématique : la suite contenait des tests distincts pour les produits simples et `Conjured`.

Suite à ce constat, j'ai poussé un peu plus loin l'ajout de fonctionnalité en demandant à l'IA de faire les modifications
pour rendre la fonctionnalité insensible à la casse.
Lors de ma première tentative, l'IA avait refactorer le code en ajoutant la fonctionnalité. Étant donné que je voulais
dirigier le refactoring via le prompt, j'ai supprimé les modifications et j'ai recommencé.

_Prompt:_

> "Conjured" is case-sensitive:
>
> - Add missing test for case-sensitive ("conjured" should work) in gilded-rose.spec.ts
> - Make implementation not case-sensitive in gilded-rose.ai.1.ts

Le code: [Approche directe: Feature Conjured Case Unsensitive](https://github.com/ajoanny/gilded-rose-ia/commit/58866137b668e48df3be1e20793c56ec1a37e239)

```ts
//gilded-rose.spec.ts:209
it("should handle case-insensitive conjured items", () => {
  const conjuredItem = new GildedRose([new Item("conjured Mana Cake", 10, 20)]);
  conjuredItem.updateQuality();
  expect(conjuredItem.items[0].quality).toBe(18);
  expect(conjuredItem.items[0].sellIn).toBe(9);
});

//gilded-rose.ai.1.ts:24
if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
  const degradationRate = this.items[i].name
    .toLowerCase()
    .startsWith("conjured")
    ? 2
    : 1;
  this.items[i].quality = Math.max(0, this.items[i].quality - degradationRate);
}
//gilded-rose.ai.1.ts:53
if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
  const degradationRate = this.items[i].name
    .toLowerCase()
    .startsWith("conjured")
    ? 2
    : 1;
  this.items[i].quality = Math.max(0, this.items[i].quality - degradationRate);
}
```

J'ai utilisé deux fois les mêmes instructions pour avoir ce résultat. C'est le premier moment où je me suis questionné sur la capacité
de l'IA à reproduire le même résultat deux fois. Je ne pense pas que ce soit un comportement souhaitable pour un LLM, mais
dans un contexte de développement cela peut s’avérer utile. La reproductibilité apporte un certain niveau de fiabilité, si chaque
génération produit un résultat différent, alors même avec de bonnes instructions les résultats sont incertains.
Suite à ces réflexions, je suis passé au refactoring.

#### Refactoring

Le kata une contrainte de design: On peut modifier la logique de la méthode `updateQuality`, mais il
ne faut pas modifier la classe `Item`.
C'est cette consigne que j'ai essayée de faire passer dans mes instructions pour cette étape de refactoring.

Pour toutes ces étapes, j'ai utilisé les mêmes instructions.

_Prompt:_

> Refactor updateQuality in gilded-rose.ai.1.ts
>
> - Logique must stay in updateQuality method

##### Itération 1

Le code: [Approche directe: Refactoring Itération 3](https://github.com/ajoanny/gilded-rose-ia/commit/b396384a5496655447e5fb9856c7b1402676ea63)

```ts
//gilded-rose.ai.1.ts:21
  updateQuality() {
  for (let i = 0; i < this.items.length; i++) {
    const item = this.items[i];
    const isLegendary = item.name === 'Sulfuras, Hand of Ragnaros';
    const isAgedBrie = item.name === 'Aged Brie';
    const isBackstagePass = item.name === 'Backstage passes to a TAFKAL80ETC concert';
    const isConjured = item.name.toLowerCase().startsWith('conjured');

    // Legendary items never change
    if (isLegendary) {
      continue;
    }

    // Update quality before sell date
    if (isAgedBrie) {
      // Aged Brie increases in quality
      if (item.quality < 50) {
        item.quality += 1;
      }
    } else if (isBackstagePass) {
      // Backstage passes increase in quality as concert approaches
      if (item.quality < 50) {
        item.quality += 1;

        if (item.sellIn < 11 && item.quality < 50) {
          item.quality += 1;
        }

        if (item.sellIn < 6 && item.quality < 50) {
          item.quality += 1;
        }
      }
    } else {
      // Normal and Conjured items degrade
      const degradationRate = isConjured ? 2 : 1;
      item.quality = Math.max(0, item.quality - degradationRate);
    }

    // Update sellIn
    item.sellIn -= 1;

    // Update quality after sell date
    if (item.sellIn < 0) {
      if (isAgedBrie) {
        // Aged Brie increases twice as fast after sell date
        if (item.quality < 50) {
          item.quality += 1;
        }
      } else if (isBackstagePass) {
        // Backstage passes drop to 0 after concert
        item.quality = 0;
      } else {
        // Normal and Conjured items degrade twice as fast after sell date
        const degradationRate = isConjured ? 2 : 1;
        item.quality = Math.max(0, item.quality - degradationRate);
      }
    }
  }

  return this.items;
}
```

Après cette première phase de refactoring les tests générés par l'IA fonctionnaient, mais plus ceux du golden master.
En pratique, l'IA n'a pas respecté le principe du refactoring : modifier l'implémentation, en conservant le comportement.
Ce résultat me conforte dans l'idée que les résultats obtenus sont incertains. La conséquence directe de ce problème est
que, même en se basant sur les instructions fournies, on ne peut pas être sûr de ce qui a été réellement réalisé sans faire
de revue. Devoir faire des revues de code n'est pas un problème soit, en revanche en faire sur de grandes quantités de code l'est.
Garder le même niveau d'attention en lisant de code pendant plusieurs heures est fatiguant. Dans mon cas, je sais qu'au bout d'une
heure, je n'ai plus la même capacité d'attention.

En pratique ce qui a été corrigé dans le code n'était pas spécifié dans le kata. Quand un item à une qualité négative,
celle-ci n'est pas changé par la fonction `updateQuality`. Il est possible d'interpréter cette modification comme une correction,
mais le refactoring ne doit pas apporter ce genre de changement. L'outil a altéré le comportement sans contrôle de notre part.
Une autre partie du code pourrait s'appuyer sur ces comportements et c'est qui rend la modification risquée.

Ma formulation maladroite dans les instructions à influencer le refactoring, mais malgré ça le code me parait plus
compréhensible. Les conditions ont été inversées et extraites dans des constantes, ce qui facilite la lecture. C'est à mon
sens une étape de refactoring pertinente. Constatant qu'il restait des axes d'amélioration, j'ai continué le refactoring.

##### Itération 2

Le code: [Approche directe: Refactoring Itération 3](https://github.com/ajoanny/gilded-rose-ia/commit/306b0dbeb0777d8f4c9ac7275b242036ce21c951)

```ts
//gilded-rose.ai.1.ts:21
  updateQuality() {
  for (const item of this.items) {
    // Item type identification
    const isLegendary = item.name === 'Sulfuras, Hand of Ragnaros';
    const isAgedBrie = item.name === 'Aged Brie';
    const isBackstagePass = item.name === 'Backstage passes to a TAFKAL80ETC concert';
    const isConjured = item.name.toLowerCase().startsWith('conjured');

    // Skip legendary items - they never change
    if (isLegendary) {
      continue;
    }

    // Quality bounds helpers (inline to keep logic in updateQuality)
    const increaseQuality = (amount: number) => {
      item.quality = Math.min(50, item.quality + amount);
    };

    const decreaseQuality = (amount: number) => {
      item.quality = Math.max(0, item.quality - amount);
    };

    const isExpired = () => item.sellIn <= 0;

    // Update quality based on item type and expiration status
    if (isAgedBrie) {
      // Aged Brie increases quality over time (faster when expired)
      increaseQuality(isExpired() ? 2 : 1);
    } else if (isBackstagePass) {
      // Backstage passes have complex quality rules
      if (isExpired()) {
        item.quality = 0; // Worthless after concert
      } else if (item.sellIn <= 5) {
        increaseQuality(3);
      } else if (item.sellIn <= 10) {
        increaseQuality(2);
      } else {
        increaseQuality(1);
      }
    } else {
      // Normal and Conjured items degrade (faster when expired and if conjured)
      const baseRate = isConjured ? 2 : 1;
      const degradationRate = isExpired() ? baseRate * 2 : baseRate;
      decreaseQuality(degradationRate);
    }

    // Decrease sellIn date
    item.sellIn -= 1;
  }

  return this.items;
}
```

Cette fois aussi, le refactoring est pertinent, on peut voir que du code a été factorisé, les noms des fonctions expriment bien
l'intention du code. Un autre aspect important, le code a été regroupé en fonction de l'intention. On a d'un côté la logique
de mise à jour de `quality` et de l'autre la logique de mise à jour du 'sellIn'.
Pour les points moins positifs, il y a les effets de bord dans les fonctions `increaseQuality` et `decreaseQuality` qui
perturbent. J'aurais préféré passer `item` en paramètre aux fonctions, si l'intention était d'avoir un effet de bord.
Du côté des tests, ceux générés passaient toujours.

Malgré des résultats nuancés sur cette itération, j'ai décidé de relancer une dernière étape de refactoring.

##### Itération 3

Le code: [Approche directe: Refactoring Itération 3](https://github.com/ajoanny/gilded-rose-ia/commit/019cd069ee86055bccd9bd8c8558c5e67b9e8fd2)

```ts
//gilded-rose.ai.1.ts:21
  updateQuality() {
  const MAX_QUALITY = 50;
  const MIN_QUALITY = 0;

  for (const item of this.items) {
    // Item type matchers
    const isLegendary = item.name === 'Sulfuras, Hand of Ragnaros';
    const isAgedBrie = item.name === 'Aged Brie';
    const isBackstagePass = item.name === 'Backstage passes to a TAFKAL80ETC concert';
    const isConjured = item.name.toLowerCase().startsWith('conjured');
    const isExpired = item.sellIn <= 0;

    // Skip legendary items - they never change
    if (isLegendary) {
      continue;
    }

    // Quality adjustment helpers (inline to keep logic in updateQuality)
    const clampQuality = () => {
      item.quality = Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, item.quality));
    };

    const adjustQuality = (delta: number) => {
      item.quality += delta;
      clampQuality();
    };

    // Calculate quality change based on item type
    let qualityDelta = 0;

    if (isAgedBrie) {
      // Aged Brie increases quality over time (faster when expired)
      qualityDelta = isExpired ? 2 : 1;
    } else if (isBackstagePass) {
      // Backstage passes: quality increases as concert approaches, drops to 0 after
      if (isExpired) {
        item.quality = MIN_QUALITY;
      } else if (item.sellIn <= 5) {
        qualityDelta = 3;
      } else if (item.sellIn <= 10) {
        qualityDelta = 2;
      } else {
        qualityDelta = 1;
      }
    } else {
      // Normal and Conjured items degrade (conjured degrade twice as fast)
      const baseRate = isConjured ? 2 : 1;
      const multiplier = isExpired ? 2 : 1;
      qualityDelta = -(baseRate * multiplier);
    }

    // Apply quality change (skip for backstage passes that expired)
    if (!(isBackstagePass && isExpired)) {
      adjustQuality(qualityDelta);
    }

    // Decrease sellIn date
    item.sellIn -= 1;
  }

  return this.items;
}
```

Lors de cette itération, on peut voir qu'il y a eu des extractions de constantes et de la factorisation avec la fonction
`adjustQuality`. Les modifications apportées lors de ce refactoring, n'étaient pas toutes bonnes à prendre. Par exemple,
la factorisation via la fonction `adjustQuality` fait perdre l'intention du code. La condition `!(isBackstagePass && isExpired)`
rend le code un peu plus confus selon moi.
Ces refactoring maladroits m'ont poussé à arrêter le refactoring à cette étape.

Par curiosité, je regarde l'implémentaion du golden master, je sélectionne le code du `switch/case` et avec un clic-droit,
je regarde les propositions d'actions avec IA.

Je trouve une option intéressante que je décide d'utiliser : Suggest Refactoring.

```ts
//Suggestion
switch (this.items[i].name) {
  case "Aged Brie":
    this.updateAgedBrieQuality(i);
    break;
  case "Backstage passes to a TAFKAL80ETC concert":
    this.updateBackstagePassQuality(i);
    break;
  case "Sulfuras, Hand of Ragnaros":
    break;
  default:
    this.updateStandardItemQuality(i);
    break;
}
```

La suggestion est intéressante, bien plus aboutie que ce que l'IA à fait jusqu'à présent. Elle inclut
de l’extraction de fonctions, de la factorisation et un nommage cohérent.

Mon premier constat est que l'on peut facilement générer du code et des tests, sans avoir une grande connaissance sur
l'écriture des instructions pour le prompt. Générer une suite de tests pour du code non testé en quelques minutes est une
idée intéressante. Le véritiable problème avec cette approche est la quantité de code à relire. Le temps gagné à l'écriture
est utilisé pour la relecture du code. Dans le cadre des tests, chercher de la duplication en regardant tous les jeux de
donnés est fastidieux. Ce qui est intéressant, c'est que ce point est valable que le code soit généré ou non. Le souci est
qu'avec la génération, c'est que notre capacité à produire du code augmente, mais pas notre capacité à le relire.
Du côté de l'IA c'est l'aspect non-deterministe qui est destabilisant, parce qu'il implique d'être partuclièrement attentif
en revue. Même en ayant des instructions qui demandent de ne pas changer le comportement, il est possible que cela se produise.

### Approche cyclique

Pour faire face aux difficultés de relecture et de maîtrise du code généré lors de ma première approche, j’ai décidé de
refaire le kata différement. J'ai essayé de palier à mes difficultés en m’appuyant sur le cycle du TDD
(test → implémentation → refactoring) et en lancant les tests en mode watch.

#### Test de Caractérisations

Lors de ma première tentative la couverture des tests n'était pas suffisante pour ne pas introduire de régréssions. Cette
fois, j'ai utilisé le'IA pour générer les tests un par un.

L'ensemble des tests est ici : [Test de caractérisation](https://github.com/ajoanny/gilded-rose-ia/commit/2687944e0ea6bb3f6d499ff82ba3c0e45ea9731d)

_Prompt:_

> Generate the following test for method updateQuality from "gilded-rose.2.ts"
>
> - item simple quality: 10, sellIn 0
> - add tests in gilded-rose.2.spec.ts

Le premier test généré est passé tout de suite, ce qui ne convenait pas à cette approche. L'objectif était de
commencer par test qui ne passe pas pour ensuite le corriger à la main. La solution la plus simple a été de modifier les
instructions pour utiliser des chaines de caratères comme valeurs dans les assertions.

_Prompt:_

> Generate the following test for method updateQuality from "gilded-rose.2.ts"
>
> - item Aged Brie quality: 10, sellIn 0
> - add tests in gilded-rose.2.spec.ts
> - expected value for quality and sellIn should be string

##### Résultat

L'expérience a été positive, la description des tests est améliorable, mais ce sont des choses que l'on peut corriger en améliorant
les instructions. Dans le contexte de ce kata, je ne suis pas certains des gains apportés par l'utilisation de l'IA. Le kata
étant relativement simple, écrire un test est facile et rapide. J'ai essayé de comparer le temps d'ajout d'un test avec et sans IA.
Étonnement dans les deux cas, le temps pour ajouter un test était du même ordre de grandeur (~15s). Le temps pour corriger
les valeurs dans les instructions, ajouté au temps de génération et de la relecture était équivalent qu'à celui nécessaire
copier/coller le test et le corriger. Une explication probable l'habitude : j'ai plus de facilité à copier un test et
à l'adapter qu'à donner des instructions à l'AI via le prompt. Pour me forger une opinion plus tranchée, il me faudrait
encore quelques semaines de pratique. L'autre question est : Comment serait généré des tests dans un contexte avec des dépendances
à instancier.

#### Refactoring

Cette fois, j'ai choisi de refactorer avant d'ajouter la fonctionnalité, afin d'avoir une démarche plus proche de mes
pratiques habituelles.

##### **Itération 1**

Le code : [Approche cyclique: Refactoring Itération 1](https://github.com/ajoanny/gilded-rose-ia/commit/dbd0eeeb1c6a45a7f5b12fd69192ae5591180495)

Ma première étape est générallement d'inverser les conditions pour qu'elle soit plus facile à lire.

_Prompt:_

> In "updateQuality" from "gilded-rose.ai.2.ts":
>
> - Reverse condition in if line 22

```ts
//gilded-rose.ai.2.ts:22
if (
  this.items[i].name == "Aged Brie" ||
  this.items[i].name == "Backstage passes to a TAFKAL80ETC concert"
) {
  if (this.items[i].quality < 50) {
    this.items[i].quality = this.items[i].quality + 1;
    if (this.items[i].name == "Backstage passes to a TAFKAL80ETC concert") {
      if (this.items[i].sellIn < 11) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
      if (this.items[i].sellIn < 6) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
    }
  }
} else {
  if (this.items[i].quality > 0) {
    if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
      this.items[i].quality = this.items[i].quality - 1;
    }
  }
}
```

Pas de surprise à cette étape, tous les tests passent. Le refactoring a été fait correctement, on retrouve le `else`
avec la logique des produits simples comme on peut s'y attendre et la condition est positive.

##### **Itération 2**

Le code : [Approche cyclique: Refactoring Itération 2](https://github.com/ajoanny/gilded-rose-ia/commit/0f33ba7998ae77cfc687bce43a9b77254bdd0cf8)

Mon deuxième objectif est généralement d'avoir une séparation de logique par produit. Habituellement, c'est un refactoring
que je fais par étape pour ne pas faire d'erreurs. Cette fois avec l'assistance de l'IA, j'ai décidé de ne pas faire de petites étapes.
Je me suis permis ce raccourci, car la quantité de code modifié est assez petite pour permettre une relecture rapide.

_Prompt:_

> In "updateQuality" from "gilded-rose.ai.2.ts":
>
> - Replace if line 22 by switch case on item name

```ts
switch (this.items[i].name) {
  case "Aged Brie":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
    }
    break;
  case "Backstage passes to a TAFKAL80ETC concert":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
      if (this.items[i].sellIn < 11) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
      if (this.items[i].sellIn < 6) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
    }
    break;
  case "Sulfuras, Hand of Ragnaros":
    break;
  default:
    if (this.items[i].quality > 0) {
      this.items[i].quality = this.items[i].quality - 1;
    }
    break;
}
```

Le refactoring correspond aux instructions et les tests passent. C'est la première fois où j'ai vraiment le sentiment d'avoir
été plus vite.

##### **Itération 3**

Une fois à cette étape, j'essaie de ne pas avoir de code qui modifie la valeur `quality` avant et après avoir modifié
la valeur `sellIn`.

&nbsp;&nbsp;**_3.1_**

Le code : [Approche cyclique: Refactoring Itération 3.1](https://github.com/ajoanny/gilded-rose-ia/commit/83a7adcb23d29cc2d601d2c7febf175b0edaf514)

_Prompt:_

> In "updateQuality" from "gilded-rose.ai.2.ts":
>
> - End the function by updating sellIn

```ts
//gilded-rose.ai.2.ts:22
switch (this.items[i].name) {
  case "Aged Brie":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
    }
    if (this.items[i].sellIn < 0) {
      if (this.items[i].quality < 50) {
        this.items[i].quality = this.items[i].quality + 1;
      }
    }
    break;
  case "Backstage passes to a TAFKAL80ETC concert":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
      if (this.items[i].sellIn < 11) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
      if (this.items[i].sellIn < 6) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
    }
    if (this.items[i].sellIn < 0) {
      this.items[i].quality = this.items[i].quality - this.items[i].quality;
    }
    break;
  case "Sulfuras, Hand of Ragnaros":
    break;
  default:
    if (this.items[i].quality > 0) {
      this.items[i].quality = this.items[i].quality - 1;
    }
    if (this.items[i].sellIn < 0) {
      if (this.items[i].quality > 0) {
        this.items[i].quality = this.items[i].quality - 1;
      }
    }
    break;
}
```

Cette fois deux problèmes se posent. En déplaçant les `if` qui suivaient la modification de la valeur `sellIn`, l’IA n’a pas
ajusté les conditions, ce qui a modifié le comportement du code et entraîné l’échec des tests. Le second problème est que
l'IA a fait plus que les instructions données en fusionnant la logique des `if` et du `switch/case`. Une partie des problèmes
provient ici du fait que les instructions utilisées sont restées trop vagues.

&nbsp;&nbsp;**_3.2_**

Le code : [Approche cyclique: Refactoring Itération 3.2](https://github.com/ajoanny/gilded-rose-ia/commit/f5db7a31751494cacc490e93d8a3eab498288b1d)

Comme le refactoring précédent n’était pas fonctionnel, j’ai choisi d’annuler les modifications et de relancer le
refactoring en ajustant les instructions.

_Prompt:_

> refactor "updateQuality" from "gilded-rose.ai.2.ts":
>
> - update sellIn value after updating quality

```ts
//gilded-rose.ai.2.ts:22
switch (this.items[i].name) {
  case "Aged Brie":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
    }
    if (this.items[i].sellIn < 1) {
      if (this.items[i].quality < 50) {
        this.items[i].quality = this.items[i].quality + 1;
      }
    }
    break;
  case "Backstage passes to a TAFKAL80ETC concert":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
      if (this.items[i].sellIn < 11) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
      if (this.items[i].sellIn < 6) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
    }
    if (this.items[i].sellIn < 1) {
      this.items[i].quality = this.items[i].quality - this.items[i].quality;
    }
    break;
  case "Sulfuras, Hand of Ragnaros":
    break;
  default:
    if (this.items[i].quality > 0) {
      this.items[i].quality = this.items[i].quality - 1;
    }
    if (this.items[i].sellIn < 1) {
      if (this.items[i].quality > 0) {
        this.items[i].quality = this.items[i].quality - 1;
      }
    }
    break;
}
```

Après ce refactoring, les tests passent, mais les modifications dépassent ce que je souhaitais. Pour cette itération, le
problème vient réellement des instructions. J’ai donc décidé, une nouvelle fois, d’annuler les modifications et de corriger
les instructions.

&nbsp;&nbsp;**_3.3_**

Le code : [Approche cyclique: Refactoring Itération 3.3](https://github.com/ajoanny/gilded-rose-ia/commit/828fb65ee933868bb875a3e095279574174644d8)

Pour ces changements, j'ai été plus précis sur les instructions en précisant les lignes à changer et en indiquant de
corriger le code pour garder le même comportement.

_Prompt:_

> refactor "updateQuality" from "gilded-rose.ai.2.ts":
>
> - switch if line 51 by if line 54
> - correct if to keep the same behavior

```ts
//gilded-rose.ai.2.ts:51
if (this.items[i].sellIn < 1) {
  if (this.items[i].name != "Aged Brie") {
    if (this.items[i].name != "Backstage passes to a TAFKAL80ETC concert") {
      if (this.items[i].quality > 0) {
        if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
          this.items[i].quality = this.items[i].quality - 1;
        }
      }
    } else {
      this.items[i].quality = this.items[i].quality - this.items[i].quality;
    }
  } else {
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
    }
  }
}
```

Les instructions ont permis d'apporter les modifications que je voulais, avec assez peu d'effort dans la qualité des instructions.
Satisfait des résultats, j'ai décidé de continuer le refactoring.

##### **Itération 4**

Le code : [Approche cyclique: Refactoring Itération 4](https://github.com/ajoanny/gilded-rose-ia/commit/3fa85abffa80350db71252f904662b2349d0abe9)

Après voir regroupé la logique de modification de la valeur `quality` d'un côté et de celle de la valeur `sellIn` de
l'autre, c'est le moment de faire l'étape anticipée par l'IA : fusionner la logique des `if` et du `switch/case`.

_Prompt:_

> refactor "updateQuality" from "gilded-rose.ai.2.ts":
>
> - merge if line 51 into switch line 22
> - keep the same behavior

```ts
//gilded-rose.ai.2.ts:22
switch (this.items[i].name) {
  case "Aged Brie":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
    }
    if (this.items[i].sellIn < 1) {
      if (this.items[i].quality < 50) {
        this.items[i].quality = this.items[i].quality + 1;
      }
    }
    break;
  case "Backstage passes to a TAFKAL80ETC concert":
    if (this.items[i].quality < 50) {
      this.items[i].quality = this.items[i].quality + 1;
      if (this.items[i].sellIn < 11) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
      if (this.items[i].sellIn < 6) {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
        }
      }
    }
    if (this.items[i].sellIn < 1) {
      this.items[i].quality = this.items[i].quality - this.items[i].quality;
    }
    break;
  case "Sulfuras, Hand of Ragnaros":
    break;
  default:
    if (this.items[i].quality > 0) {
      this.items[i].quality = this.items[i].quality - 1;
    }
    if (this.items[i].sellIn < 1) {
      if (this.items[i].quality > 0) {
        this.items[i].quality = this.items[i].quality - 1;
      }
    }
    break;
}
```

Encore une fois, aucun problème les changements sont les bons et tous les tests sont verts.

##### **Itération 5**

Je continue mon approche plus controlée, en essayant de donner pour instructions d'extraire et factoriser les lignes
de code qui augmentent la qualité des produits.

&nbsp;&nbsp;**_5.1_**
Le code : [Approche cyclique: Refactoring Itération 5.1](https://github.com/ajoanny/gilded-rose-ia/commit/67293509361500aac372a74d56b8bca25fc889bb)

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts":
> - extract a method for if line 24
> - replace in the function all matching occurrences

```ts
//gilded-rose.ai.2.ts:20
private isQualityBelowMax(item: Item): boolean {
  return item.quality < 50;
}
```

Lors de ce refactoring, ce sont uniquement les conditions qui ont été factorisées et pas tout le bloc de code. Du côté des
tests tout est vert, rien n'est cassé. Une nouvelle fois, je décide de ne pas garder les modifications pour corriger les
instructions de refactoring, puisque les modifications ne me conviennent pas.

&nbsp;&nbsp;**_5.2_**
Le code : [Approche cyclique: Refactoring Itération 5.2](https://github.com/ajoanny/gilded-rose-ia/commit/f2dc129e39eb8f5856057daf8f4b1c5210618fe4)

Afin d'augmenter les chances d'avoir le bon refactoring je passe les lignes à factoriser dans les instructions de modifications.

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts"
> - extract a function for lines:
> if (this.items[i].quality < 50) {
>   this.items[i].quality = this.items[i].quality + 1
> }
> - replace in the function all matching occurrences

```ts
//gilded-rose.ai.2.ts:20
private increaseQualityIfBelowMax(item: Item): void {
  if (item.quality < 50) {
  item.quality = item.quality + 1;
}

//gilded-rose.ai.2.ts:28
switch (this.items[i].name) {
  case 'Aged Brie':
    this.increaseQualityIfBelowMax(this.items[i]);
    if (this.items[i].sellIn < 1) {
      this.increaseQualityIfBelowMax(this.items[i]);
    }
    break;
  case 'Backstage passes to a TAFKAL80ETC concert':
    this.increaseQualityIfBelowMax(this.items[i]);
    if (this.items[i].sellIn < 11) {
      this.increaseQualityIfBelowMax(this.items[i]);
    }
    if (this.items[i].sellIn < 6) {
      this.increaseQualityIfBelowMax(this.items[i]);
    }
    if (this.items[i].sellIn < 1) {
      this.items[i].quality = this.items[i].quality - this.items[i].quality
    }
    break;
  case 'Sulfuras, Hand of Ragnaros':
    break;
  default:
    //...
}
```

En spécifiant exactement les lignes à factoriser, le refactoring s'est bien passé. Il est surement possible d'avoir le même
résultat avec des instructions moins spécifiques. Nos IDE, dans une certaine mesure, sont capables de faire une partie
de ces refactoring. La question intéressante est : Doit-on utiliser l'IDE ou l'IA ?
L'IDE à l'avantage être plus rapide, (généralement) moins gourmand en ressources et ses résultats sont reproductibles.
L'IA de son côté offre une analyse du code plus poussé et proposer des refactoring plus complexes.
Personnellement, je valorise le faire d'avoir des résultats déterministes, cela me permet de planifier les refactoring que
je veux faire, pour arriver à un résultat satisfaisant avec un minimum de frictions.

##### **Itération 6**

Le code :[Approche cyclique: Refactoring Itération 6](https://github.com/ajoanny/gilded-rose-ia/commit/aa50e6fa742a49816814e80e21a496dbe3615631)

J'applique la même stratégie pour refactorer le code qui diminue la qualité des produits.

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - extract a function for lines:
> if (this.items[i].quality > 0) {
>   this.items[i].quality = this.items[i].quality - 1
> }
> - replace in the function all matching occurrences

```ts
//gilded-rose.ai.2.ts:26
private decreaseQualityIfAboveMin(item: Item): void {
  if (item.quality > 0) {
    item.quality = item.quality - 1;
  }
}

//gilded-rose.ai.2.ts:55
default:
  this.decreaseQualityIfAboveMin(this.items[i]);
  if (this.items[i].sellIn < 1) {
    this.decreaseQualityIfAboveMin(this.items[i]);
  }
  break;
```

##### **Itération 7**

Le code : [Approche cyclique: Refactoring Itération 7](https://github.com/ajoanny/gilded-rose-ia/commit/065d6008d3be02100ae7d14b4d9ca93e1e493438)

À partir de cette itération, j'essaye d'extraite la logique contenue dans chaque cas du `switch/case` dans une fonction.

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - Extract a function for the body of "Aged Brie" case

```ts
//gilded-rose.ai.2.ts:32
private updateAgedBrie(item: Item): void {
  this.increaseQualityIfBelowMax(item);
  if (item.sellIn < 1) {
    this.increaseQualityIfBelowMax(item);
  }
}

//gilded-rose.ai.2.ts:42
case 'Aged Brie':
  this.updateAgedBrie(this.items[i]);
break;
```

##### **Itération 8**

Le code : [Approche cyclique: Refactoring Itération 8](https://github.com/ajoanny/gilded-rose-ia/commit/cc184bb33d4139e4cc0c364b80c8c0cc6d318157)

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - Extract a function for the body of Backstage passes to a TAFKAL80ETC concert case

```ts
//gilded-rose.ai.2.ts:39
private updateBackstagePasses(item: Item): void {
  this.increaseQualityIfBelowMax(item);
  if (item.sellIn < 11) {
    this.increaseQualityIfBelowMax(item);
  }
  if (item.sellIn < 6) {
    this.increaseQualityIfBelowMax(item);
  }
  if (item.sellIn < 1) {
    item.quality = item.quality - item.quality;
  }
}

//gilded-rose.ai.2.ts:58
case 'Backstage passes to a TAFKAL80ETC concert':
    this.updateBackstagePasses(this.items[i]);
break;
```

##### **Itération 9**

Le code : [Approche cyclique: Refactoring Itération 9](https://github.com/ajoanny/gilded-rose-ia/commit/f62e392bd0d94326b449b7d2651f31ef80c2b3e3)

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - Extract a function for the body of "default" (simple item) case

```ts
//gilded-rose.ai.2.ts:52
private updateSimpleItem(item: Item): void {
  this.decreaseQualityIfAboveMin(item);
  if (item.sellIn < GildedRose.EXPIRED_SELL_IN) {
    this.decreaseQualityIfAboveMin(item);
  }
}

//gilded-rose.ai.2.ts:70
default:
  this.updateSimpleItem(this.items[i]);
break;
```

##### **Itération 10**

Pour ma dernière itération de refactoring, j'essaye d'extraire les valeurs codées en dur dans le code par des constantes.

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - Extract magic value in constants

```ts
  private static readonly MAX_QUALITY = 50;
  private static readonly MIN_QUALITY = 0;
  private static readonly EXPIRED_SELL_IN = 1;
  private static readonly BACKSTAGE_FIRST_THRESHOLD = 11;
  private static readonly BACKSTAGE_SECOND_THRESHOLD = 6;
```

Tous les tests passent, par contre toutes les valeurs n'ont pas été remplacées. Bien que le refactoring soit incomplet, j'estime avoir
suffisamment testé le refactoring avec cette approche pour avoir une opinion.

##### Résultat

Faire des petites étapes a grandement facilité les revues de code, je me suis senti plus efficace en fonctionnant de cette
manière. Dans l’ensemble, il est relativement simple d'obtenir le refactoring que l'on veut, pour les modifications plus complexes nécessite
des instructions plus précises (qui dans le cadre de ce kata reste assez simple). Je ne pense que prompt soit la meilleure
forme d'interface.
Là où je suis plus nuancé, c'est que l'instant sur une partie du refactoring, je pense pouvoir être plus efficace en les faisant avec
l'IDE. Lancer les tests en parallèle, permet d'avoir même sensation de sécurité que lorsque je fais du refactoring classique
avec des tests qui tournent.

#### Ajouter une feature

Pour la suite de l'exercice, j'ai essayé de rajouter la même fonctionnalité que pour l'approche précédente.

##### **Itération 1**

Première étape, ajouter le comportement des produits `Conjured` dans le cas ou la valeur `sellIn` positive
Le code : [Approche cyclique: Feature Itération 1](https://github.com/ajoanny/gilded-rose-ia/commit/9ce13a6bcb5065a48f5b7172946ceb37be2f3cdb)

**_Test_**

**Prompt:**

<!-- prettier-ignore -->
> Generate the following test for method updateQuality from "gilded-rose.ai.2.ts"
> - Item Simple Conjured: quality: 10, sellIn 1
> - add tests in gilded-rose.2.spec.ts

Les spécifications partielles étant partielles, le test est passé immédiatement. Les assertions se
sont basées sur le comportement des produits simples. J’ai supprimé le test, corrigé les instructions et relancé la génération.

**Prompt:**

<!-- prettier-ignore -->
> Generate the following test for method updateQuality from "gilded-rose.ai.2.ts"
> - Item Simple Conjured: quality: 10, sellIn 1
> - expected quality: 8, sellIn 0
> - add tests in gilded-rose.ai.2.spec.ts

```ts
it("Conjured item: quality 10, sellIn 1 - quality should decrease by 2 and sellIn should decrease by 1", () => {
  const gildedRose = new GildedRose([new Item("Conjured", 1, 10)]);
  const items = gildedRose.updateQuality();

  expect(items[0].quality).toBe(8);
  expect(items[0].sellIn).toBe(0);
});
```

Mon test est bien rouge cette fois, j'adapte le nom du produit pour avoir un test plus cohérent, mais l'IA a produit le
bon test.

**_Implementation 1.1_**

Pour implémentation, je corrige légèrement les instructions utilisées pour la génération du test.

**Prompt:**

<!-- prettier-ignore -->
> Generate the simplest implementation in updateQuality from "gilded-rose.ai.2.ts" for the following spec:
> - Item Simple with "Conjured" in it's name. quality: 10, sellIn 1
> - expected quality: 8, sellIn 0

```ts
 if (this.items[i].name.includes('Conjured')) {
  this.decreaseQualityIfAboveMin(this.items[i]);
  this.decreaseQualityIfAboveMin(this.items[i]);
} else {
  switch (this.items[i].name) {
    case 'Aged Brie':
      this.updateAgedBrie(this.items[i]);
      break;
    case 'Backstage passes to a TAFKAL80ETC concert':
      this.updateBackstagePasses(this.items[i]);
      break;
    case 'Sulfuras, Hand of Ragnaros':
      break;
    default:
      this.updateSimpleItem(this.items[i]);
      break;
  }
```

Le code permet de faire passer les tests. L'implémentation se limite bien au cas d'usage avec une valeur `sellIn` positive.
En y regardant de plus près, on peut remarquer que le comportement est plus complexe que ce qui est nécessaire pour faire passer
le test. L'implémentation permet de fonctionner peu importe la position du mot `Conjured` dans le nom du produit. En
relisant les instructions, je constate que c'est dû à ma description de la fonctionnalité. C'est à çe moment que je réalise
qu'utiliser un prompt correctement est une véritable expertise à développer.
J'ai essayé de corriger l'implémentation en changeant les instructions utilisées.

**_Implementation 1.2_**
[Approche cyclique: Feature Itération 1.2](https://github.com/ajoanny/gilded-rose-ia/commit/7fe72cae8ec6676477cab86c8e9db8e7df337944)

<!-- prettier-ignore -->
> Generate the simplest implementation in updateQuality from "gilded-rose.ai.2.ts".to for the following test:
> - Test in file file: gilded-rose.ai.2.spec.ts
> - Test name: 'GildedRose', 'Conjured item: quality 10, sellIn 1 - quality should decrease by 2 and sellIn should decrease by 1'

```ts
//gilded-rose.ai.2.ts:65
private updateConjuredItem(item: Item): void {
  this.decreaseQualityIfAboveMin(item);
  this.decreaseQualityIfAboveMin(item);

  if (item.sellIn < GildedRose.EXPIRED_SELL_IN) {
    this.decreaseQualityIfAboveMin(item);
    this.decreaseQualityIfAboveMin(item);
  }
}

//gilded-rose.ai.2.ts:85
case 'Item Conjured':
  this.updateConjuredItem(this.items[i]);
  break;
```

Le point que je voulais adresser `this.items[i].name.includes('Conjured')` est corrigé. Sur ce point l'implémentation est
bien plus simple, mais moins satisfaisante que la version précédente. Dans la fonction `updateConjuredItem` l'IA à implémenter
le comportement complet de la fonctionnalité.

Ayant déjà bien testé le refactoring, j'ai décidé de continuer l'exercice avec la version du code précédente en tolérant
l'entorse faite sur la vérification du nom des produits.
J'ai estimé que je n'avais encore assez de code pour faire une refactoring intéressant et je suis passé au
test suivant.

##### Itération 2

Deuxieme étape, ajouter le comportement des produits `Conjured` dans le cas ou la valeur `sellIn` est 0.

**_Test_**

**Prompt:**

<!-- prettier-ignore -->
> Generate the following test for method updateQuality from "gilded-rose.2.ts"
> - Item Simple name: "Another item Conjured", quality: 10, sellIn 0
> - expected quality: 6, sellIn -1
> - add tests in gilded-rose.ai.2.spec.ts

```ts
it("Conjured item expired: quality 10, sellIn 0 - quality should decrease by 4 and sellIn should decrease by 1", () => {
  const gildedRose = new GildedRose([new Item("Another item Conjured", 0, 10)]);
  const items = gildedRose.updateQuality();

  expect(items[0].quality).toBe(6);
  expect(items[0].sellIn).toBe(-1);
});
```

**_Implémentation 2.1_**
Le code : [Approche cyclique: Feature Itération 2.1](https://github.com/ajoanny/gilded-rose-ia/commit/06edd5daae0a8eb1c7a8279ca46fb8a8eb49b524)

**Prompt:**

<!-- prettier-ignore -->
> Generate the simplest implementation in updateQuality from "gilded-rose.ai.2.ts" for the following spec:
> - Item Simple with "Conjured" in it's name. quality: 10, sellIn 0
> - expected quality: 6, sellIn -1

```ts
if (this.items[i].name.includes("Conjured")) {
  this.decreaseQualityIfAboveMin(this.items[i]);
  this.decreaseQualityIfAboveMin(this.items[i]);
  if (this.items[i].sellIn < GildedRose.EXPIRED_SELL_IN) {
    this.decreaseQualityIfAboveMin(this.items[i]);
    this.decreaseQualityIfAboveMin(this.items[i]);
  }
}
```

L'implémentation fait bien passer les tests, mais encore une fois le code est trop complet par rapport au test que j'ai
choisi. En ajoutant le cas de test pour les produits `Conjured` et une valeur `sellIn` négative, le test aurait été vert
tout de suite. J'ai essayé de corriger en changeant les instructions.

La première correction à générer le même code.

**Prompt:**

<!-- prettier-ignore -->
>Generate the simplest implementation in updateQuality from "gilded-rose.ai.2.ts" for the following spec:
>- Item Simple with "Conjured" in it's name. quality: 10, sellIn 0
>- when sellIn is exactly 0 quality decrease by 4
>- expected quality: 6, sellIn -1

**_Implémentation 2.2_**

Le code : [Approche cyclique: Feature Itération 2.2](https://github.com/ajoanny/gilded-rose-ia/commit/8280dd27f46440cd10dc0839850a554140c3aa82)

**Prompt:**

<!-- prettier-ignore -->
> Generate the simplest implementation in updateQuality from "gilded-rose.ai.2.ts" for the following spec:
> - simple item with "Conjured" in it's name
> - when sellIn === 0 quality decrease by 4

```ts
this.decreaseQualityIfAboveMin(this.items[i]);
this.decreaseQualityIfAboveMin(this.items[i]);
if (this.items[i].sellIn === 0) {
  this.decreaseQualityIfAboveMin(this.items[i]);
  this.decreaseQualityIfAboveMin(this.items[i]);
}
```

Ces instructions m'ont permis d'obtenir le résultat que je voulais. L'expérience sur ces quelques utilisations du prompt ont été
frustrantes. Pour parvenir à ce résultat, j’ai eu le sentiment de devoir écrire du « pseudo-code ». À ce moment-là, la question
qui m’est venue à l’esprit a été : quel est l’intérêt d’écrire du « pseudo-code » pour générer du code ? Je n'ai pas réponse
définitive, mais je partagerai quelques réflexions plus loin dans l’article.

##### Itération 3

J'implémente le dernier cas que je trouve intéressant, les produits `Conjured` dans le cas ou la valeur `sellIn` est négative.

**_test_**

**Prompt:**

<!-- prettier-ignore -->
> Generate the following test for method updateQuality from "gilded-rose.2.ts"
> - Item Simple name: "Yet Another item Conjured", quality: 10, sellIn -1
> - expected quality: 6, sellIn -2
> - add tests in gilded-rose.ai.2.spec.ts

```ts
it("Conjured item: quality 10, sellIn -1 - quality should decrease by 2 and sellIn should decrease by 1", () => {
  const gildedRose = new GildedRose([
    new Item("Yet another item Conjured", -1, 10),
  ]);
  const items = gildedRose.updateQuality();

  expect(items[0].quality).toBe(6);
  expect(items[0].sellIn).toBe(-2);
});
```

**_Implémentation_**

**Prompt:**

<!-- prettier-ignore -->
> Generate the simplest implementation in updateQuality from "gilded-rose.ai.2.ts" for the following spec:
> - simple item with "Conjured" in it's name
> - when sellIn <= 0 quality decrease by 4

```ts
this.decreaseQualityIfAboveMin(this.items[i]);
this.decreaseQualityIfAboveMin(this.items[i]);
if (this.items[i].sellIn <= 0) {
  this.decreaseQualityIfAboveMin(this.items[i]);
  this.decreaseQualityIfAboveMin(this.items[i]);
}
```

Les tests pas et j'ai l'implémentation que je veux, et c'est à ce moment que je décide de faire du refactoring.

**_Refactoring 3.1_**
Mes instructions n'ont pas permis à l'IA d'utiliser la constante `EXPIRED_SELL_IN` et c'est la première chose que je veux
corriger.

**Prompt:**

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - refactor the condition line 70 by using EXPIRED_SELL_IN constant

```ts
this.decreaseQualityIfAboveMin(this.items[i]);
this.decreaseQualityIfAboveMin(this.items[i]);
if (this.items[i].sellIn < GildedRose.EXPIRED_SELL_IN) {
  this.decreaseQualityIfAboveMin(this.items[i]);
  this.decreaseQualityIfAboveMin(this.items[i]);
}
```

Le refactoring est le bon tout de suite et les tests passent toujours.

**_Refactoring 3.2_**
**Prompt:**

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - Merge the logique about Conjured item with the logique for simple item

```ts
private decreaseQualityIfAboveMin(item: Item): void {
  if (item.quality > GildedRose.MIN_QUALITY) {
    item.quality = item.quality - 1;
  }
}

private updateSimpleItem(item: Item): void {
    this.decreaseQualityIfAboveMin(item);
    if (item.sellIn < GildedRose.EXPIRED_SELL_IN) {
    this.decreaseQualityIfAboveMin(item);
}

updateQuality() {
  for (let i = 0; i < this.items.length; i++) {
    switch (this.items[i].name) {
      case 'Aged Brie':
        this.updateAgedBrie(this.items[i]);
        break;
      case 'Backstage passes to a TAFKAL80ETC concert':
        this.updateBackstagePasses(this.items[i]);
        break;
      case 'Sulfuras, Hand of Ragnaros':
        break;
      default:
        this.updateSimpleItem(this.items[i]);
        break;
    }
    if (this.items[i].name != 'Sulfuras, Hand of Ragnaros') {
      this.items[i].sellIn = this.items[i].sellIn - 1;
    }
  }
  return this.items;
}
```

Cette fois l'IA a supprimé le code lié aux produits `Conjured`. Ce comportement me confirme l'utilité de faire des revues de
coed. Les tests ne passent plus et je décide d'annuler ces changements et modifier mes instructions.

**_Refactoring 3.3_**
Le code : [Approche cyclique: Feature Itération (Refacto) 3.3](https://github.com/ajoanny/gilded-rose-ia/commit/35d4162a1402e1fa6d40c2c85f22467f504de1d2)

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - Move the logique about Conjured in updateSimpleItem function

```
private updateSimpleItem(item: Item): void {
  this.decreaseQualityIfAboveMin(item);
  if (item.name.includes('Conjured')) {
    this.decreaseQualityIfAboveMin(item);
  }
  if (item.sellIn < GildedRose.EXPIRED_SELL_IN) {
    this.decreaseQualityIfAboveMin(item);
    if (item.name.includes('Conjured')) {
      this.decreaseQualityIfAboveMin(item);
    }
  }
}

```

Les tests passent et je me suis rapproché de ce que je voulais, mais un refactoring reste nécessaire.

**_Refactoring 3.4_**
Le code : [Approche cyclique: Feature Itération (Refacto) 3.4](https://github.com/ajoanny/gilded-rose-ia/commit/d813ac04e53a93846d8c64d54f27348fa6d06d27)

_Prompt:_

<!-- prettier-ignore -->
> refactor "updateQuality" from "gilded-rose.ai.2.ts".
> - Move the logique about Conjured in decreaseQualityIfAboveMin function

```ts
//gilded-rose.ai.2.ts:32
private decreaseQualityIfAboveMin(item: Item): void {
  if (item.quality > GildedRose.MIN_QUALITY) {
    item.quality = item.quality - 1;
  }
  if (item.name.includes('Conjured')) {
    if (item.quality > GildedRose.MIN_QUALITY) {
      item.quality = item.quality - 1;
    }
  }
}

//gilded-rose.ai.2.ts:63
private updateSimpleItem(item: Item): void {
  this.decreaseQualityIfAboveMin(item);
  if (item.sellIn < GildedRose.EXPIRED_SELL_IN) {
    this.decreaseQualityIfAboveMin(item);
  }
}
```

C'est le refactoring que j'attendais et les tests passaient, donc je suis passé à l'étape suivante.

##### **Itération 4**

La dernière étape, faire en sorte que le code ne soit pas sensible à la casse.

**_Tests_**

**Prompt:**

<!-- prettier-ignore -->
>Generate the following test for method updateQuality from "gilded-rose.2.ts"
>- Item Simple name: "Another item conjured", quality: 10, sellIn 2
>- expected quality: 8, sellIn 1
>- add tests in gilded-rose.ai.2.spec.ts

```ts
it("Conjured item: quality 10, sellIn 2 - quality should decrease by 2 and sellIn should decrease by 1", () => {
  const gildedRose = new GildedRose([new Item("Another item conjured", 2, 10)]);
  const items = gildedRose.updateQuality();

  expect(items[0].quality).toBe(8);
  expect(items[0].sellIn).toBe(1);
});
```

**_Implémentation_**

_Prompt:_

<!-- prettier-ignore -->
> Generate the simplest implementation in updateQuality from "gilded-rose.ai.2.ts" for the following spec:
> - Item Simple name: "Another item conjured", quality: 10, sellIn 2
> - expected quality: 8, sellIn 1

```ts
decreaseQualityIfAboveMin(item: Item): void {
  if (item.quality > GildedRose.MIN_QUALITY) {
    item.quality = item.quality - 1;
  }
  if (item.name.toLowerCase().includes('conjured')) {
    if (item.quality > GildedRose.MIN_QUALITY) {
        item.quality = item.quality - 1;
    }
  }
}
```

Le refactoring s’est bien déroulé et les tests passent, je décide donc de m’arrêter là. Il restait encore des axes
d’amélioration pour le code, mais j’ai estimé avoir suffisamment testé l’IA dans ce contexte pour pouvoir arrêter.

#### Résultats

Mis à part quelques surprises, cela s’est bien déroulé. Procéder par étapes m’a permis de me sentir davantage aux commandes
et de mieux maîtriser les modifications du code. Une phase de refactoring, plus importante que ce que je fais habituellement,
s’est révélée particulièrement intéressante (fusion des deux blocs de code qui modifiaient `quality`).
En revanche, la suppression de code par l’IA m’a surpris : ce n’est pas un comportement auquel je m’attendais. J'ai réussi
à faire ce que je voulais sans fournir un effort excessif, ce qui est positif.

### Conclusion

Mon premier point concerne l’utilisation du terminal : une meilleure intégration dans l’IDE serait réellement
bénéfique. Pour l’instant, j’ai toujours le sentiment d’être plus efficace quand j'exploite bien mon IDE. Il me semble
que certains IDE intègrent mieux l’IA, mais je n’ai pas encore eu l’occasion de les tester. Cela dit, l’IA s’est révélée
intéressante sur certaines tâches, notamment la génération des tests de caractérisation.
N’étant pas expert dans l’utilisation d’un LLM via des prompts, je n’ai pas toujours obtenu les résultats souhaités à la
première tentative. Je dois admettre que, même avec des prompts imparfaits, il est possible d’obtenir des résultats
intéressants. Le fait de devoir adapter mon niveau de langage entre le code et le LLM m’a semblé assez fatigant.
À certains moments, j’ai dû écrire du « pseudo-code » pour parvenir à faire ce que je voulais, ce qui me laisse quelque
peu perplexe. Je me demande si l'utilisation « pseudo-code » ne pourrait aider à limiter les aberrations. Cependant, vu la
nature des LLM, je ne suis pas sûr pas qu'il soit possible même en utilisant mieux le prompt de les faire complètement disparaitre.
Le côté non-deterministe des résultats m'empêche de me projeter dans l'utilisation poussée de la génération de code. Pour
le moment, je continue de trouver l'IA plus utile dans d'autres contextes, bien que j'avoue avoir impressionné par le fait
que tout le code généré était exécutable du premier coup.
La facilité à générer du code peut conduire à produire beaucoup de code à relire, il y a équilibre à trouver pour
toujours rester en capacité de le relire. Concernant l'approche par étapes, je ne suis pas certains d'avoir été plus productif avec l'IA.
La simplicité du kata fait que rédiger les instructions pour le prompt est aussi long que d'écrire les tests. Dans un contexte
plus riche, cela pourrait être différent. Pour avoir avis plus objectif, il me faudrait davantage de pratique dans des contextes plus variés.
Dernier point : la tarification. Avec IntelliJ, utiliser l'IA consomme des crédits. Pour faire ce kata deux fois et demie,
j'ai utilisé 15 crédits. Le plan AI Pro mensuel coûte 10€, et pour recharger un crédit coûte 1€, ce qui me revient à 15€.
Pour quelques jours de travail sur kata, cela me semble relativement cher, mais je tiens à préciser que je n'ai pas du tout
optimisé mon usage de l’IA pour cet article.
Après cet exercice, je n’ai pas encore d’avis tranché sur ce sujet. Je ne pense pas avoir trouvé la meilleure manière d’exploiter
pleinement l’IA. Je vais prendre le temps de la tester sur des cas plus complexes afin de trouver une approche qui me
conviendra davantage.

## Référence

- [GildedRose](https://github.com/emilybache/GildedRose-Refactoring-Kata) - Emily Bache
- [David Gageot - USI](https://www.youtube.com/watch?v=q11gydDAMSo)
- [GildedRoseIA](https://github.com/ajoanny/gilded-rose-ia) - Arthur Joanny
