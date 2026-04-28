---
title: TDD, IA Agentique et Puissance 4
pubDatetime: 2026-04-28
featured: true
draft: false
tags:
  - TDD
  - IA
description: Retour d'expérience sur l'intégration de l'IA dans le cycle TDD.
---

Il y a quelques semaines, j'ai écrit un [article](https://ajoanny.github.io/posts/tester-impl%C3%A9menter-et-refactorer-avec-lia/)
sur l'utilisation de l'IA pour générer du code dans le contexte du kata Gilded Rose. Dans cet article, j'ai pointé les
limitations que j'ai observées lors de mes expérimentations : les comportements
"aberrants" — hallucinations — de l'IA, la charge cognitive liée à la quantité de code à revoir, l'effort de formulation pour
donner des instructions claires à l'IA, etc. Ces résultats mitigés ont été une invitation à pousser l'expérience plus loin.
En tant que praticien du TDD, j'étais curieux de connaître l'impact de l'IA générative sur la pratique du TDD.

## Table of contents

## Contexte

Pour essayer de répondre à cette question, j'ai décidé de faire un deuxième kata plus long et plus complexe : le Puissance 4.
J'ai expérimenté successivement deux configurations d'agent IA — chacune avec son propre protocole d'interaction — pour
évaluer leur impact sur les différentes phases du TDD.
Cela me semble un bon terrain d’expérimentation, car il apporte une complexité métier plus importante que Gilded Rose. Il
permet d’aborder des questions de design, notamment la séparation des responsabilités, ainsi que la distinction entre logique
métier et infrastructure.

Pour l'agent, j'ai utilisé la plateforme Dust.tt, qui permet de configurer un agent via un prompt et qui fournit un CLI.
Pendant le développement, j'ai lancé les tests en continu dans un terminal et en ayant l'agent dans un second terminal fonctionnant
en mode interactif. Pour faciliter l'expérience, j'ai donné à l'agent l'autorisation de lire et modifier les fichiers
du projet ainsi que de lancer les tests.

Pendant le kata, j'ai été amené à ajuster la configuration de l'agent. Je vais partager au fil de l'article les différentes
versions de la configuration et les raisons de ces modifications.

Le repository contenant l'ensemble du code est disponible sur [Github](https://github.com/ajoanny/four_in_a_row_ia) et
chaque étape du cycle TDD est séparée dans un commit. Je vais également partager les prompts que j'ai utilisés pour faire
le kata afin d'illustrer mes propos.

Avant de démarrer, il est utile de revenir sur les principes du TDD.
Au cœur de cette approche se trouve la notion de retour d’information. Les tests automatisés fournissent un feedback
ayant pour vocation de nous faire ajuster tests et implémentation.

Je veux respecter ce principe tout en déléguant à l’agent la génération du code et des tests. Dans
ce cadre, je reste responsable de la définition des tests, de leur pertinence, de leur ordre d’écriture, ainsi que la validation
des implémentations qui permettent de les faire passer. L'idée est d'obtenir les mêmes bénéfices qu'en faisant du TDD
sans agent.

Pour limiter la charge cognitive liée à la relecture du code généré, j’ai choisi d’avancer par petites étapes, en appliquant
les principes de `baby steps` et de `fake it till you make it`.

Il est important de rappeler qu'un kata reste bien plus simple qu'un projet en production. Les conclusions et observations
de cet article peuvent et doivent être interprétées avec recul. Avec ce cadre posé, voici comment cette première version de
l'agent a abordé chacune des trois phases du TDD.

## Agent V1

[La branche sur Github](https://github.com/ajoanny/four_in_a_row_ia/tree/agent_v1)

Dans la première version de l'agent, j'ai essayé de rester assez classique dans les principes de conception et d'architecture
cités. J'ai essayé de décrire le workflow que je voulais avoir pour le kata :

- Générer un test. (RED)
- Valider le test. (RED)
- Générer une implémentation. (GREEN)
- Valider l'implémentation. (GREEN)
- Faire un refactoring si c'est utile. (REFACTO)

```prompt
Tu es un expert TDD en Kotlin. Tu suis strictement le cycle Red-Green-Refactor

...
...
...

**Étape 1 -- Red (écrire le test)**

Quand l'utilisateur décrit un comportement :

1. Tu génères un test JUnit 5 en Kotlin qui correspond au comportement
2. Tu attends que l'utilisateur valide le test

**Étape 2 -- Green (faire passer le test)**

Uniquement quand l'utilisateur valide le test :

1. Tu génères le code Kotlin **le plus simple possible** pour faire passer le test même une valeur en dur (*fake it*) si c'est suffisant.
2. Tu attends que l'utilisateur valide le code

**Étape 3 -- Refactor (si demandé)**

1. Tu attends les suggestions de refactoring
2. Tu t'assures que les tests passent toujours après refactoring

## Règles absolues

- Ne jamais sauter d'étape sans validation explicite de l'utilisateur
- Préférer les tests expressifs avec des noms en backticks : `return X when Y`
- Test auto-portant et indépendant
- Ne jamais généraliser l'implémentation sans qu'un nouveau test l'exige (principe YAGNI). La triangulation se fait via de nouveaux tests pas par anticipation.
```

Ma première version avait pour but de définir mon workflow : commencer par un test, faire l'implémentation et refactorer si besoin.

### Partie 1 : La grille

La première partie du kata consiste à faire une classe représentant une grille de puissance 4 (6x7).

La classe aura 3 responsabilités :

- jouer un jeton dans une colonne
- donner une représentation textuelle de la grille
- obtenir le contenu d'une cellule de la grille

#### Tests

La génération des tests est la partie qui a le mieux fonctionné. Chaque test généré correspondait bien aux tests décrits via
le prompt. Il y a cependant, deux points importants à aborder.

[Github: Commit](https://github.com/ajoanny/four_in_a_row_ia/commit/2aa59e8d664276dc380aac092ff36b287b3f9edd)

Pour générer mon premier test, j'ai utilisé le prompt suivant.

_Prompt:_

<!-- prettier-ignore -->
>Add tests for :
>Class Grid
>  play(token, column)
>  text()
>
>When no token is played
>Then text return an empty grid
>EmptyGrid =
> 
> `". . . . . . ."`
> 
> `". . . . . . ."`
> 
> `". . . . . . ."`
> 
> `". . . . . . ."`
> 
> `". . . . . . ."`
> 
> `". . . . . . ."`

```kotlin
    @Test
    fun `text returns an empty grid when no token has been played`() {
        val grid = Grid()

        val expected = """
            . . . . . . .
            . . . . . . .
            . . . . . . .
            . . . . . . .
            . . . . . . .
            . . . . . . .
        """.trimIndent()

        assertEquals(expected, grid.text())
    }
```

Le test est généré et échoue, ce qui correspond à l’étape RED du cycle TDD. L'agent m'informe que le test ne passe pas et
me propose de passer à l'étape d'implémentation. En regardant plus attentivement, je constate
que le test ne passe pas, mais pour les mauvaises raisons. C'est une erreur de compilation qui empêche le test de passer. Le test
ne passe pas, mais ne donne aucun retour sur le comportement du code. Avec la configuration actuelle, l'agent ne vérifie
pas les raisons de l'échec. Si détecter une erreur de compilation est assez facile, les autres raisons d'échecs sont plus subtiles — mauvais tests,
régressions, etc. La question peut se poser aussi pour les tests qui passent. Est-ce de la duplication
de test ou est-ce que les implémentations précédentes couvrent plus que ce qui était nécessaire ? L'interprétation des résultats
des tests est donc un point important, qui conditionne le choix des tests suivants.

L'importance de ce point dans la pratique du TDD pousse à garder la responsabilité de l'interprétation des résultats des tests.
En cas d'erreur, la suite de tests perd en fiabilité.

[Github: Commit](https://github.com/ajoanny/four_in_a_row_ia/commit/9bf319081b5c7bbdb3a5152e6ac42b44ad38b9b0)

En introduisant un premier comportement métier via un nouveau test, un autre phénomène apparaît.

_Prompt:_

<!-- prettier-ignore -->
> test when 'R' is played in the first column, then the token at the bottom of first column is 'R'

```kotlin
@Test
    fun `text shows R at the bottom of the first column when R is played in column 1`() {
        val grid = Grid()
        grid.play('R', 1)

        val expected = """
            . . . . . . .
            . . . . . . .
            . . . . . . .
            . . . . . . .
            . . . . . . .
            R . . . . . .
        """.trimIndent()

        assertEquals(expected, grid.text())
    }
```

Lors de la génération de ce test, je n'ai pas précisé l'indice de la colonne à utiliser. Dans ce contexte, l'agent a pris
une décision de design : Les colonnes sont indexées à partir de 1. Ce n'est pas la pertinence du choix qui importe dans ce
cas, par contre, ce choix pose les bases de design. En prenant cette décision l'agent m'a enlevé la responsabilité de faire ce
choix. La configuration actuelle de l'agent ne définit pas de contraintes claires sur ce point, ce qui rend
ce comportement plus probable. Sans relecture attentive, ce type de choix peut facilement passer inaperçu, alors qu’il impacte
l’ensemble du système.

#### Implémentation

Si la génération des tests a été relativement simple, générer une implémentation minimale permettant de faire passer les tests
s'est révélé plus complexe.

[Github: Commit](https://github.com/ajoanny/four_in_a_row_ia/commit/b813d4a7d032dbf68882b057f3f9461ae9f70207)

_Prompt:_

<!-- prettier-ignore -->
> implement

```kotlin
package org.example

class Grid {
  private val rows = 6
  private val cols = 7
  private val cells = Array(rows) { Array(cols) { '.' } }

  fun play(token: Char, column: Int) {
      for (row in rows - 1 downTo 0) {
          if (cells[row][column] == '.') {
              cells[row][column] = token
              return
          }
        }
  }

  fun text(): String {
      return cells.joinToString("\n") { row ->
          row.joinToString(" ")
      }
  }
}
```

Lors de la première tentative de génération d'implémentation l’agent produit une implémentation complète. Cette implémentation
permettait d'ajouter des jetons dans toute la grille et de les empiler. Garder cette implémentation ne permettrait pas de
faire du TDD, avoir une implémentation complète dès le premier test fait perdre tous les bénéfices du TDD.

Il est intéressant de noter que la configuration définit un persona connaissant le TDD, qu'il y a des "gardes" pour éviter
d'avoir des implémentations complètes trop tôt.

```prompt
Tu es un expert TDD en Kotlin. Tu suis strictement le cycle Red-Green-Refactor

...
...
...

**Étape 2 -- Green (faire passer le test)**

Uniquement quand l'utilisateur valide le test :

1. Tu génères le code Kotlin **le plus simple possible** pour faire passer le test même une valeur en dur (*fake it*) si c'est suffisant.
2. Tu attends que l'utilisateur valide le code

...

- Ne jamais généraliser l'implémentation sans qu'un nouveau test l'exige (principe YAGNI). La triangulation se fait via de nouveaux tests pas par anticipation.
```

Cette première difficulté met en évidence une problématique importante : On ne peut pas garantir que l'agent fera exactement ce qu'on lui demande.
Pour moi, c'est cette particularité qui implique de garder le contrôle le plus possible sur la validation des actions de l'agent.
Il est possible de mettre l'accent sur des contraintes dans la configuration de l'agent, mais cela ne suffit pas pour garantir
que l'agent fera précisément ce qu'on lui demande.

Mon objectif étant de faire du TDD, mais de ne pas écrire de code, j'ai tenté de faire faire à l'agent la correction de l'implémentation.

[Github: Commit](https://github.com/ajoanny/four_in_a_row_ia/commit/b813d4a7d032dbf68882b057f3f9461ae9f70207)

_Prompt:_

<!-- prettier-ignore -->
> minimal implementation for existing test

```kotlin
class Grid {
    fun play(token: Char, column: Int) {}

    fun text(): String {
        val row = ". . . . . . ."
        return (1..6).joinToString("\n") { row }
    }
}
```

Pour corriger cette dérive, je reformule la demande en insistant sur la notion d'implémentation minimale.
Cette fois, l’agent produit une version plus simple, limitée au comportement testé. Dans notre cas, l'implémentation n'est pas
strictement la plus simple possible, mais elle n'offre que le comportement correspondant au test existant. Ce qui suffit
pour ne pas perdre les bénéfices du TDD.

La génération de l'implémentation pour mon second test est tout aussi laborieuse.

[Github: Commit](https://github.com/ajoanny/four_in_a_row_ia/compare/step_4.1?expand=1)

_Prompt:_

<!-- prettier-ignore -->
> implement

En utilisant cette instruction, je me retrouve encore une fois avec une implémentation complète de la classe `Grid`. En repassant
sur la configuration de l'agent, je constate que les instructions que j'utilise ne correspondent pas forcément aux étapes du
workflow que j'ai défini. Mon workflow parle de Red, Green et Refactor et pour l'instant, j'ai utilisé "test", "add test" et "implement"
pour générer tests et implémentations. Si pour les tests ces instructions ont suffi, pour obtenir une implémentation simple
ce n'est pas le cas. Pour essayer de guider un peu mieux l'agent, j'essaye d'utiliser le nom de l'étape comme instruction.

_Prompt:_

<!-- prettier-ignore -->
> green

L'utilisation du nom de l'étape n'est pas suffisante et je me retrouve une nouvelle fois avec une implémentation complète.
Pour essayer d'amener l'agent à générer une implémentation plus simple, je décide d'utiliser la description du test qu'il
doit faire passer.

_Prompt:_

<!-- prettier-ignore -->
> make simplest implementation for test "text shows R at the bottom of the first column when R is played in column 1"

```kotlin
package org.example

class Grid {
    private var lastToken: Char? = null
    private var lastColumn: Int? = null

    fun play(token: Char, column: Int) {
      lastToken = token
      lastColumn = column
    }

    fun text(): String {
      return (1..6).joinToString("\n") { rowIndex ->
          val cols = Array(7) { '.' }
          if (rowIndex == 6 && lastToken != null) {
                  cols[lastColumn!! - 1] = lastToken!!
              }
              cols.joinToString(" ")
          }
      }
}
```

Cette fois, je n'ai pas une implémentation complète, mais toujours trop complète par rapport à mes tests. L'agent m'explique
pourquoi cette implémentation est minimale.

```prompt
**Pourquoi c'est minimal :**
  - On ne stocke qu'un seul jeton et sa colonne (pas de tableau 2D)
  - `text()` ne place le token qu'à la dernière ligne (seul cas couvert par les tests actuels)
  - Aucune logique de gravité réelle, juste assez pour faire passer les 2 tests
```

La réponse de l'agent est fausse. Il est facile de le démontrer en écrivant un test ajoutant des jetons dans plusieurs colonnes.
Cette interaction soulève une question importante sur les LLMs et leur entraînement.
Si le TDD repose en partie sur des implémentations volontairement incomplètes, voire “fausses”, afin d’introduire la complexité
de manière progressive. De leur côté, les LLMs me semblent orientés vers la production de code fonctionnel et relativement
complet. Mon hypothèse est que les corpus utilisés pour entraîner les modèles contiennent essentiellement du code fonctionnel
et terminé - Hypothèse qui me paraît réaliste au regard de l'évolution de leurs résultats ces derniers mois. Ces entraînements
ont possiblement entraîné un biais, rendant la production de code partiel moins évidente. Cette hypothèse interroge sur
l'utilité d'un modèle généraliste pour l'exercice auquel je me livre. La question étant est-ce qu'un entraînement spécifique permettrait de
faire de petites itérations pour la génération du code plus facilement.

Une autre de mes réflexions concerne la notion de simplicité. Pour avoir pratiqué le TDD en pair et mob programming, le choix du test
ou de l’implémentation “la plus simple” est souvent sujet à discussion. Cette subjectivité rend l’utilisation d’un LLM délicate,
car il n’existe pas de définition unique de l’implémentation la plus simple.

On pourrait envisager l'intégration d'un certain nombre d'indicateurs et d'outils pour guider les LLMs comme la complexité
cyclomatique, la couverture des tests, des tests de mutation, un framework de tests d'architecture. D'expérience, ces outils sont utiles pour
indiquer des parties de code ne respectant pas certaines règles de conception, mais moins fiable pour déterminer la
"qualité" du code. Par exemple, une suite de tests permettant du refactoring — complète et indépendante des détails d'implémentation —
en sécurité aura une bonne couverture de tests, mais la réciproque n'est pas vraie. Je pense que l'intégration de ce type
d'outils peut aider, mais n'enlève pas la nécessité d'avoir une validation humaine.

Ces difficultés me font sortir du cadre que je me suis fixé pour interagir avec l'agent et je me mets à utiliser le français
pour lui donner des instructions plus claires.

_Prompt:_

<!-- prettier-ignore -->
> Ce n'est pas l'implémentation la plus simple, pour l'instant on utilise qu'une seule couleur et la 1ere colonne.

```kotlin
class Grid {
    private var played = false

    fun play(token: Char, column: Int) {
        played = true
    }

    fun text(): String {
        val top = (1..5).joinToString("\n") { ". . . . . . ." }
        val bottom = if (played) "R . . . . . ." else ". . . . . . ."
        return "$top\n$bottom"
    }
}
```

Cette fois, j'obtiens bien une implémentation permettant de faire uniquement passer le test existant. Je constate
les limites de mon workflow, guider l'agent quand il faut corriger une erreur me donne le sentiment de sortir du workflow
que j'ai défini.

Pour la suite de cette première partie du kata, j'ai passé plus de temps à essayer de rattraper les implémentations de l'agent
qu'à vraiment être concentré sur l'exercice. Ces difficultés m'ont poussé à challenger ma version actuelle de l'agent et le
manque de formalisme dans les interactions avec lui. J'ai quand même fini cette partie de l'exercice en gardant cet agent.

#### Refactoring

Après avoir terminé l'implémentation de la fonction `play`, j'ai tenté quelques refactoring.

_Prompt:_

<!-- prettier-ignore -->
> Refactoring: Ajoute une énumération pour les index des colonnes et utilise la comme type pour la fonction play
>
> Refactoring: ajoute une enum pour les tokens Il y a deux valeur R et Y
>
> Refactoring: Utilise des constantes pour " " "." et "\n" dans la class Grid
> 
> Refactoring: Utilise des constantes les valeurs 0 et 5 dans la class Grid

Les phases de refactoring se sont bien passées, les modifications étaient bien celles que je voulais faire et les tests passaient.
Un point intéressant, qui n'est pas lié à mon workflow, l'agent me proposait d'accepter les modifications par blocs de quelques
lignes en affichant un `diff-change`. Un petit peu à la manière d'un `git commit add . -p`, mais sans la possibilité de découper
les modifications. Cette présentation a beaucoup facilité la relecture des modifications.

```diffchange
-    grid.play('R', Column.ONE)
+    grid.play(Token.R, Column.ONE)
```

Ces refactoring très simpliste se sont bien passés et n'ont pas été le sujet de frictions particulières.

### Résultats

Avec cette première version de l’agent, je n'ai pas le sentiment de m'être concentré véritablement sur le kata.
Bien que les tests soient correctement générés, leur influence sur le design dans le cadre du TDD rend leur lecture
cruciale. L'interprétation du langage naturel amène l'agent à faire des hypothèses sur les choix de design que l'on peut
faire de manière implicite — first column = index 1.
Pour la génération d'une implémentation minimale, j'ai l'impression que sans décrire explicitement le comportement, l'agent
n'infère pas d'implémentation à partir des tests existants.
Les refactoring dans un contexte simple fonctionnent et les `diff-changes` rendent la relecture efficace.

En termes d'expérience développeur, je suis assez insatisfait pour cette première version, car les frictions sont nombreuses et les suggestions
de l'agent n'incitent pas à rester vigilant. De mon point de vue durant cette première partie du kata, tirer les bénéfices de l'utilisation
du TDD demande un effort plus important qu'en faisant du TDD sans agent.

Pour essayer d'améliorer l'expérience, je décide de reprendre le kata depuis le début en utilisant un agent différent.

## Agent V2

[La branche sur Github](https://github.com/ajoanny/four_in_a_row_ia/tree/main)

```prompt
You are a Kotlin TDD expert. You strictly follow the Red-Green-Refactor cycle.

...

Step 1 — RED

When receiving ADD_TEST:

    - Generate a single JUnit 5 test in Kotlin
    - The test must be:
        - self-contained
        - minimal
        - focused on one behavior
    - Use expressive backtick test names
    - Wait approval before file editing
Then Stop

Step 2 — GREEN

When receiving GO_GREEN:
    - Produce the simplest implementation to pass the last validated test
    - Allowed:
        - hardcoded values
        - duplication
        - naive logic
    - Forbidden:
        - generalization
        - anticipation of future behaviors
        - handling cases not covered by the test
    - Wait approval before file editing
Then STOP

Step 3 — REFACTOR

When receiving REFACTOR:
    - Improve code without changing behavior
    - Ensure all tests still pass
    - Only refactor if:
        - duplication exists
        - naming is unclear
        - structure reduces readability
    - Wait approval before file editing

Test Guidelines
    - Tests must be independent
    - Tests must not share state
    - Use clear, behavior-driven naming: return X when Y

Interaction Protocol

You only respond to these commands:
    ADD_TEST → Generate one test
    GO_GREEN → Generate minimal implementation for last validated test
    REFACTOR → Refactor safely
    FIX_TEST → Correct the last test
    TOO_COMPLEX → Simplify implementation to match strict YAGNI
    CLARIFY → Adjust understanding based on user input
    CONTEXT → Specifying context for command

Protocol Rules

- Do not infer commands from free text
- Each message contains exactly one command
- If command is missing or ambiguous → ask for clarification
- Never act without an explicit command
- Never skip a step
- Implement only what the current test requires
- Any generalization requires at least 2 tests
- Prefer duplication over abstraction
```

Mon objectif avec cette version était de définir un protocole d’interaction avec l’agent, en formalisant des instructions visant à
le maintenir dans le cadre du TDD. Chaque étape du workflow correspond à une commande spécifique, tandis que les autres
servent à recentrer l’agent sur le TDD en cas de dérive. J’ai également cherché à renforcer les contraintes incitant
à produire des implémentations minimales.

### Test

Cette seconde version de l'agent a été l'occasion d'aller plus loin dans le kata et de concevoir des tests plus élaborés. Elle
offre l’opportunité d’évaluer les LLM sur la génération de tests pour des classes comportant des dépendances, rendant
possible l’usage de doublures de test. Pour la génération de tests simples, cette nouvelle version n'a pas apporté d'améliorations
particulières.

Le premier constat est que j’obtiens une suite de tests très proche de celle que je produirais en pratiquant le TDD sans
IA sur ce kata. Le nombre de tests est comparable, et j’ai couvert les mêmes cas dans le même ordre. Jusqu'ici rien de
surprenant puisque j'ai piloté la génération test par test.
Là où on peut noter une différence c'est sur l'organisation des tests. La configuration de mon agent n'inclut ni contraintes,
ni suggestions, ce qui peut expliquer leur organisation erratique, contrairement à ce que je fais d'habitude. Je pense qu'il
est possible dans une certaine mesure d'améliorer ce point via le prompt et la configuration. Bien que dans mon contexte,
je ne me sois pas attardé sur ce point, il reste important de garder en tête cette problématique pour faciliter la relecture des tests.

La génération de tests utilisant plusieurs classes et de dépendances a été la source de réflexions intéressantes sur les frictions
entre le TDD et les LLMs.

Pour contextualiser, c'est en travaillant sur la classe `Analyzer` — dont la responsabilité est de vérifier la
présence de quatre jetons consécutifs de la même couleur, que ce soit en ligne, en colonnes ou en diagonale — que j'ai rencontré
mes premières difficultés pour générer des tests. Un des objectifs du kata est de travailler la lisibilité des tests. L’approche
que j’ai retenue consiste à utiliser une représentation textuelle de la grille, puis de construire celle-ci à partir de cette représentation.

```kotlin
val grid = Grid()

grid.play(Token.R, Column.C1)
grid.play(Token.Y, Column.C1)
grid.play(Token.Y, Column.C2)
grid.play(Token.Y, Column.C2)
grid.play(Token.R, Column.C3)
grid.play(Token.Y, Column.C3)
grid.play(Token.Y, Column.C4)
grid.play(Token.Y, Column.C4)

Grid().apply {
    setup("""
            .......
            .......
            .......
            .......
            YYYY...
            RYRY...
        """
    )
}
```

J'ai généré la fonction `setup` via l'agent et il est intéressant de savoir qu'elle fonctionne même dans le cas d'une représentation
invalide, mais ne construira pas la grille représentée. C'est cette représentation qui a complexifié la génération des tests.

```prompt
  ADD_TEST when there is one token R followed by 4 Y tokens in the second column then there is a winner
```

```kotlin
fun `return has winner when one R token followed by four Y tokens are stacked in the second column`() {
    val grid = Grid().apply { setup("""
        .Y.....
        .Y.....
        .Y.....
        .Y.....
        .R.....
        .......
    """) }

    assertThat(Analyzer(grid).hasWinner()).isTrue()
}
```

La représentation de la grille générée par l’IA est invalide, les jetons ne sont pas “tombés” en bas de leur colonne comme
ils le devraient. Dans ce cas particulier, bien que la représentation soit incorrecte, la grille sera malgré tout initialisée
correctement. Ce type de représentations de grille “impossibles” risque toutefois de nuire à la lisibilité et de compliquer
la compréhension des tests lors de leur relecture.

Dans une mesure différente les soucis de représentation ont été récurrents.

```prompt
ADD_TEST when there are 4 R identical tokens in the diagonal starting from first column at fourth line there is
   a winner
**Visual:**
. . . . . . .   ← R1
. . . . . . .   ← R2
R . . . . . .   ← R3  (start)
. R . . . . .   ← R4
. . R . . . .   ← R5
. . . R . . .   ← R6
```

```prompt
ADD_TEST when there are 4 identical tokens at the beginning of diagonal C1/L5 then there is a winner

**Visual:**
. . . . . . .   ← R1
R . . . . . .   ← R2  ← diagonal start
Y R . . . . .   ← R3
Y Y R . . . .   ← R4
Y Y Y R . . .   ← R5
Y Y Y Y . . .   ← R6
```

Parfois les représentations ne permettaient pas de tester les cas décrits, soit parce que la grille ne correspondait pas
à la description, soit parce que la disposition des jetons offrait une victoire pour des cas déjà couverts.

Dans ce dernier cas, le test passait immédiatement, mais l'agent n'a pas toujours interprété ces résultats correctement. Quelquefois,
il a considéré que la réussite immédiate du test était le résultat de la duplication d'un autre test. Ce comportement fait écho
à un point que j'ai soulevé précédemment : L'interprétation des résultats des tests par l'agent reste faillible.
Ces soucis de génération impliquent une relecture vigilante non seulement pour les implémentations, mais aussi pour les tests.
La correction de ces jeux de données restait généralement assez simple, mais ces ajustements ont rendu la pratique du TDD moins fluide.

```prompt
FIX_TEST invalid grid there is no tokens under R tokens in the diagonal

**Visual (with gravity respected):**
. . . . . . .   ← R1
. . . . . . .   ← R2
R . . . . . .   ← R3  ← diagonal start
Y R . . . . .   ← R4
Y Y R . . . .   ← R5
Y Y Y R . . .   ← R6
```

Une autre problématique est la cohérence dans l'instanciation des classes ayant des dépendances. Une partie du kata consiste
à créer une classe `Game` dépendant de la classe `Grid` pour jouer les coups et de la classe `Analyzer` pour vérifier les conditions de victoire, cette
dernière elle-même dépendante de la classe `Grid`. Les choix de designs sont discutables, mais ont pour but permettre une utilisation
de doublures des tests.

Dans la majorité des tests, les constructeurs des classes `Game` et `Analyzer` ont été appelés avec des instances distinctes de la classe `Grid`.

```kotlin
@Test
fun `status is ONGOING when game begins`() {
    val game = Game(Grid(), Analyzer(Grid()))

    assertThat(game.status()).isEqualTo(Status.ONGOING)
}

@Test
fun `grid play is called with C1 and Y when Y plays on column 1`() {
    val grid = mockk<Grid>(relaxed = true)
    val game = Game(grid, Analyzer(Grid()))

    game.play(Column.C1)

    verify { grid.play(Token.Y, Column.C1) }
}
```

Dans notre cas, ces incohérences ne font pas échouer les tests, mais les rendent moins clairs et plus fragiles, ce qui
nuit à leur maintenabilité. La mise en place des tests doit refléter celle d’un contexte de production, avec des
instanciations correctes.

Ces défauts dans les tests permettent d'aborder la question du design du code. Le TDD fait des tests les premiers consommateurs
du code en conséquence, ils permettent de définir le design et offrent un retour d'information sur sa qualité. Dans ce contexte,
le plus gros avantage de la génération de code devient aussi une limite. La facilité à générer du code limite
les retours d'informations du TDD. Les difficultés rencontrées lors de l’écriture des tests, de l’implémentation
ou du refactoring sont des sources d’informations précieuses sur la qualité du code, notamment sur son design.
Les LLM atténuent ces difficultés, les rendant moins visibles et moins perceptibles.

Une analogie imparfaite, mais parlante, serait celle de la douleur pour le corps. On peut considérer la douleur comme
un signal destiné à nous inciter à interrompre une action afin d’éviter une blessure. La difficulté à écrire un test est
une invitation à s'arrêter pour ajuster nos choix — de design, de test, etc. — pour avancer plus facilement. La difficulté
est un code smell naïf, mais particulièrement efficace, on peut comprendre que le design n'est pas bon, mais pas forcément pourquoi.

C'est d'autant plus vrai pour les tests utilisant des doublures,
qui mettent en évidence les interactions entre les différents éléments composant le design. L'idée, de manière un peu simpliste,
est que plus, il y aura d'éléments et d'interactions, plus la mise en place du test sera difficile, et plus le test
aura tendance à créer du couplage avec le design en le figeant. Je laisse les plus courageux tenter de comprendre le test
suivant.

```prompt
     GO_GREEN use loop to play until status does not return ONGOING
```

```kotlin
@Test
fun `when status returns ONGOING then Y it plays each turn with column from input`() {
    val game = mockk<Game>(relaxed = true)
    every { game.status() } returnsMany listOf(Status.ONGOING, Status.ONGOING, Status.Y)
    every { game.player() } returns Token.Y
    val grid = mockk<Grid>(relaxed = true)
    val input = mockk<Input>()
    every { input.get() } returnsMany listOf(Column.C1, Column.C2)
    val output = mockk<Output>(relaxed = true)
    val fourInARow = FourInARow(game, grid, input, output)

    fourInARow.play()

    verifyOrder {
        game.play(Column.C1)
        game.play(Column.C2)
    }
}
```

Cette dilution du retour d’information renforce l’importance de l’étape de relecture, qui devient alors le principal moment
où ce type de feedback peut émerger. On peut se demander si écrire les instructions pour générer le test est assez complexe
pour offrir une opportunité de retour d'information. Personnellement dans ce contexte, je dois avouer que ça n'a pas été le cas.
Je pense que c'est un aspect de la pratique qui gagnerait à être éprouvé dans un contexte plus proche de conditions réelles.
Voyons maintenant si ce protocole formel a eu davantage d'impact sur la phase d'implémentation.

### Implémentation

Le premier constat est que, sur la première partie du kata, cette nouvelle version de l'agent mettant l'accent sur les implémentations
minimales ainsi que la définition d'un protocole formel pour interagir avec l'agent n'est pas la source d'amélioration notable sur
la génération de code. Pour l'implémentation de la fonction `play` de la `Grid`, j'ai rencontré les mêmes difficultés à générer
des implémentations minimales.
C'est un point particulièrement important à rappeler : clarifier le contexte et mettre l'accent sur certaines actions en définissant
des "contraintes" ne garantit pas d'obtenir le comportement attendu. TDD ou non, c'est un aspect important à comprendre et à
accepter lors de l'utilisation de ces outils.

Ce qui a réellement été impacté par cette version de l’agent, et plus particulièrement par ce protocole d’interaction,
c’est mon expérience de développeur. C'est moi qui ai le plus bénéficié de ce cadre qui m'a aidé à me concentrer
sur la description de mes tests et de mes implémentations. Je me suis senti plus à l'aise, sans avoir été véritablement
plus efficace. Pour l'implémentation seule de la fonction `play` de la grille, j'ai dû corriger une dizaine d'implémentations,
globalement la même quantité qu'avec la version précédente de l'agent. Ce qui me conforte dans l'idée de ne pas avoir réussi à
améliorer la génération de code.
Dans la suite, de l'exercice, j'ai changé d'approche pour générer les implémentations. Jusqu'à cette étape, je ne donnais
pas d'indication particulière à l'agent pour générer les implémentations et je comptais essentiellement sur le contexte
défini dans la configuration de l'agent. Mon idée était d'être plus directif dans les instructions.

```prompt
  GO_GREEN check if there is a non empty token at the bottom of the column 4
  ...
  GO_GREEN if the four tokens of the diagonal C1/L4 are identical then there is a winner
```

Ce changement d’approche a considérablement amélioré la capacité de l’agent à générer des implémentations minimales. À
titre de comparaison pour toute la suite du kata comprenant les classes `Analyzer`,
`Game` et `FourInARow` — boucle principale pour le jeu — j'ai eu la même quantité de corrections à faire que lors de l'implémentation
de la méthode `play`. Même sans améliorer les résultats, cette version de l'agent réduit beaucoup les frictions avec la génération de code, ce qui fait de cette version
une piste intéressante d'amélioration de l'expérience développeur.

Malgré cette amélioration l'agent est quand même sorti du cadre pendant le kata. La configuration tente de pousser l'agent
à proposer des corrections et d'attendre une validation humaine avant de les appliquer. À plusieurs reprises l'agent a tenté
de modifier les fichiers avant la validation des modifications. Le CLI obligeant une validation humaine avant la modification
des fichiers a permis de stopper l'agent. Lors de ces dérives, l'agent a interprété son incapacité à modifier le fichier comme une
erreur de droit de modification du fichier et pas comme une mauvaise implémentation. Bien que cette erreur soit probablement
liée spécifiquement à Dust et son CLI, il est intéressant de noter que l'évaluation erronée de l'agent sur ces erreurs l'a
amené à me proposer de copier les modifications dans le fichier moi-même. Ces erreurs dans l'interprétation des signaux
qui pilotent les actions de l'agent donnent un comportement différent de celui attendu.

Ces comportements m'ont fait réfléchir sur notre façon d'apporter des solutions aux limites des LLMs. Aujourd'hui, j'ai l'impression peut-être à tort qu'une partie
de ces solutions cherche à enrichir le contexte ou à outiller le LLMs pour mieux guider leurs actions. La question que je me pose est si l’agent,
en appliquant ces refactoring, a créé un contexte l’incitant à continuer à produire une implémentation respectant les patterns
qu’il avait lui-même introduits avant. Ici, il a choisi de séparer la méthode `winner` en `horizontal` et `vertical` Est-ce que ces approches
dans une certaine mesure n'alimentent pas les problèmes de dégradation du contexte des LLMs ?

Cet enrichissement du contexte a d'ailleurs un coût direct, que j'ai fini par rencontrer concrètement en atteignant les quotas d'utilisation journaliers de l'agent. En toute
transparence, mes usages ne se limitaient pas à ce kata, mais cette limite soulève des questions intéressantes sur la tension entre le modèle économique des LLMs et la pratique du TDD. Pour commencer, même si parfois la
tarification est transparente avec Anthropic et Dust par exemple offrant une grille de tarification par million de tokens
lors des usages de leur APIs, cela reste globalement opaque. Les limites d'utilisation des agents et des prompts sont moins
transparentes avec des quotas par messages, requêtes, etc.

Le fait est que l'on ne maitrise pas ce qui est envoyé aux LLMs via les agents. Pour améliorer la génération de code, on
va utiliser une configuration plus ou moins grande, l'agent va lire le code source — tests, implémentations, ADR, etc. —
le rapport des tests qui peut être plus ou moins verbeux, l'historique des messages. Toutes ces sources d'information
vont définir un contexte qui est construit dynamiquement, qui va être découpé en tokens et
envoyé au LLM. Ce sont ces tokens qui sont utilisés pour définir la consommation des quotas.

Ce fonctionnement implique d'avoir un coût proportionnel au contexte pour chaque échange avec l'agent. Le TDD reposant en
partie sur des courtes itérations pour un feedback rapide, multiplie ces échanges. Multiplier les étapes, c'est multiplier
les interactions avec l'agent. Ce modèle économique introduit une tension dans la pratique du TDD pouvant pousser à allonger
la taille des itérations ce qui augmente le temps du retour d'information.

### Refactoring

Tout comme pour les tests et l'implémentation la nouvelle configuration n'a pas été différenciante sur la qualité des
refactoring, mais plus sur l'expérience développeur.

Une observation intéressante, c'est que lors de l'étape d'implémentation, l'agent a parfois fait du refactoring. Ces refactorings
ont eu lieu assez tôt et sans sollicitation de ma part. Généralement, je trouve intéressant de laisser apparaître la duplication
avant de faire des refactorings. Dans ce contexte, l'agent n'a pas laissé le temps à cette duplication de ressortir.
Dans un contexte moins familier, ne pas observer cette duplication peut limiter notre capacité à trouver
des refactorings intéressants. Cette problématique est vraie, que ce soit avec l'utilisation d'IA générative ou non.

Les refactorings autonomes de l'agent ont donné un découpage spécifique dans le code. La question que je me pose est si
l'agent en appliquant ces refactoring a créé un contexte l'incitant à continuer à produire une implémentation
respectant les patterns qu'il avait lui-même introduits avant.

```kotlin
class Analyzer(private val grid: Grid) {

    fun hasWinner(): Boolean {
        return hasHorizontalWinner() || hasVerticalWinner()
    }

    private fun hasHorizontalWinner(): Boolean {
        for (row in Row.entries) {
            for (startCol in 0..3) {
                val token = grid.getCell(Column.entries[startCol], row)
                if (token != Grid.EMPTY_CELL &&
                    (1..3).all { grid.getCell(Column.entries[startCol + it], row) == token })
                    return true
            }
        }
        return false
    }

    private fun hasVerticalWinner(): Boolean {
        return hasVerticalWinnerInColumn(Column.C1) || hasVerticalWinnerInColumn(Column.C2)
    }

    private fun hasVerticalWinnerInColumn(col: Column): Boolean {
        for (startRow in 0..2) {
            val token = grid.getCell(col, Row.entries[startRow])
            if (token != Grid.EMPTY_CELL &&
                (1..3).all { grid.getCell(col, Row.entries[startRow + it]) == token })
                return true
        }
        return false
    }
}
```

En termes d'expérience, j'ai trouvé que décrire les refactorings est plus complexe que de décrire les tests et les implémentations.

```kotlin
REFACTOR uses loop to iterate over diagonals, and for each diagonal check is there is a winner only handle the first and second diagonals
```

```kotlin
private fun hasDescendingDiagonalWinner(): Boolean {
  return listOf(1, 2).any { startRow ->
      val maxOffset = Row.entries.size - startRow - 4
      (0..maxOffset).any { offset ->
          hasDescendingDiagonalWinnerAt(offset, startRow + offset)
      }
  }
}
```

L'implémentation ne correspond pas véritablement à la description du refactoring, il m'a fallu plusieurs itérations pour
obtenir un résultat acceptable, mais pas forcément celui que je voulais. Contrairement aux implémentations, faire des refactorings
en étant directif me semble moins efficace qu'en se concentrant sur l'intention — factoriser, extraire des fonctions.

```kotlin
 REFACTOR extract rows, columns and descending diagonal from the grid as an array of
  lines and check if there is any line with 4 consecutives identical tokens
```

La principale distinction que j'ai notée par rapport à ma pratique du TDD sans IA est la taille des étapes de refactoring. Sans IA,
je privilégie généralement de petites itérations afin de garder le code dans un état fonctionnel.
Avec l’IA, en revanche, je m’autorise des refactorings plus importants.
Il y a deux raisons à ça. La première est que sur de gros refactoring l'IA est rapide et les tests permettent de savoir
si les modifications sont fonctionnelles tout aussi rapidement. La seconde est qu'en ayant investi très peu de temps sur ces refactoring,
j'évite le biais du coût irrécupérable pour mon code.

Ces deux raisons me font réfléchir à ma manière d'aborder les refactoring. Je me demande si je peux lancer des refactoring
avec l'IA uniquement pour les revoir et me faire une opinion sur le code en fonction
d'une idée que j'aurais eu. Ensuite, je pourrais décider de garder ou pas les modifications ou tenter une nouvelle approche
de refactoring. C'est une approche que je trouve intéressante, car elle donne un caractère jetable au code généré par l'IA,
il n'a pas besoin d'être parfait. Ce que j'apprécie avec cette piste, c'est qu'elle permettrait d'avoir un feedback
plus rapide sur des refactorings plus grands, et ce n'est pas quelque chose que j'arrive à avoir facilement.

### Résultats

Avec cette nouvelle version les soucis de fond restent présents. La relecture reste indispensable et
les dérives sont toujours présentes. Les améliorations pour génération d'implémentation sont plus corrélées avec la précision
des prompts qu'avec la configuration. Être directif sur la génération d'implémentation est ce qui a nettement diminué
le travail de corrections. L'agent tend à refactorer trop tôt et sans sollicitation, ce qui limite l'émergence naturelle de la
duplication.

Là où cette version se distingue vraiment, c'est sur l'expérience développeur. Le protocole formel a réduit
les frictions et aidé à rester concentré sur le kata. La valeur de l'Agent V2 est davantage dans ce cadre
de travail que dans la qualité du code généré.

## Conclusion

De manière générale, je n'ai pas le sentiment d'avoir véritablement tiré de bénéfices de l'usage de l'IA dans le cadre
du TDD avec cette approche en petites étapes.
Que ce soit pour les tests ou les implémentations, devoir rattraper le code généré par l'IA peut être chronophage et
devenir frustrant en cas de récurrence. Pour le moment, je pense que le TDD sans IA est moins contraignant qu'avec l'IA.
Au-delà de la qualité du code, le risque de dette cognitive — laisser passer des fragilités de design que le TDD révèle normalement —
est aussi un facteur à prendre en compte. Cependant, je pense qu'il reste des pistes à explorer, surtout dans notre
manière d'aborder les refactorings. Je trouve l'idée de générer une implémentation pour me faire une idée concrète de ce que donnerait
le code assez séduisante. Je pense que cette idée vaut la peine d'être testée dans des contextes de code "legacy".

Formaliser la configuration et les interactions constitue une piste intéressante, mais elle semble surtout améliorer
l’expérience utilisateur davantage que les résultats eux-mêmes. La nature des LLMs ne semble pas jouer en leur faveur quand
l'objectif est d'avoir une application stricte de règles définies. Ces réflexions sur les limites du TDD agentique m'amènent
naturellement à me demander dans quel contexte les LLMs pourraient être plus à l'aise. Un candidat me semble particulièrement
intéressant : le BDD.

Cette pratique vise à clarifier les objectifs à travers des échanges entre profils techniques — développeurs, tech leads, QA — et métiers — PO, etc. —.
L’idée est de définir précisément le comportement attendu d’une fonctionnalité à l’aide d’exemples concrets, formulés dans
un langage naturel. Ces exemples peuvent ensuite être automatisés, ou non, via des outils comme Cucumber ou Gherkin. Malheureusement,
dans de nombreux contextes professionnels que j’ai connus, ces tests étaient rarement présents et lorsqu’ils existaient, ils n’étaient
pas toujours réellement issus d’une collaboration approfondie avec les équipes produit. De plus, leur automatisation
reste souvent fastidieuse, elle repose sur matching du langage naturel vers du code. Les premiers scénarios demandent généralement
un investissement conséquent lors des premiers tests. Dans ce contexte, l’efficacité des LLM dans le traitement
du langage naturel soulève une question intéressante : peuvent-ils aider à l’automatisation de ces tests sur nos projets ?

Sur la question du TDD et de l'IA agentique, deux articles m'ont aidé à mettre des mots sur certaines de mes observations. Dans [Test-Driven Development with Agentic AI](https://coding-is-like-cooking.info/2026/03/test-driven-development-with-agentic-ai/),
Emily Bache dresse un portrait plus large de ce que font aujourd'hui les praticiens TDD avec l'IA agentique qui apporte
une mise en perspective intéressante de ma propre expérience.
Ian Cooper, dans [Coding Is Dead, Long Live Programming](https://ian-cooper.writeas.com/coding-is-dead-long-live-programming),
propose un cadre théorique qui m'a semblé particulièrement juste : la distinction entre le rôle de coder, que l'agent peut prendre en charge, et celui
de programmer qui reste humain. C'est une lecture que je recommande à quiconque s'interroge sur ce que l'IA
change réellement dans notre métier.
