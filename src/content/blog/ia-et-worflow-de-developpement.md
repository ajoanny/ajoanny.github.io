---
title: Ia et worflow de developpement
pubDatetime: 2026-05-30
featured: false
draft: false
tags:
  - Developpement
  - IA
description: Retour d'expérience sur l'intégration de l'IA dans le cycle developpement sur un projet en production.
---

Ça fait plusieurs mois maintenant que j’essaie de trouver une manière pertinente d’intégrer les LLM dans mes pratiques de
développement. Mon but est de trouver une manière d’intégrer ces outils tout en conservant au moins le même niveau de maintenabilité,
de compréhension ainsi que d’ownership du code.

Jusqu’à présent, mes terrains d’expérimentation se sont limités aux katas, en tentant d’éprouver la génération d’implémentation,
la génération de tests, la pratique du TDD et le refactoring. Même sur des sujets simplistes, les résultats ont été discutables
en termes de fiabilité, de qualité et de répétabilité.

J’ai eu cette fois l’opportunité de tester l’utilisation des LLM sur un projet en production. Ce changement de contexte a
été l’occasion de valider la pertinence de mes observations précédentes tout en apportant un cadre plus proche de la réalité.

Beaucoup d’éléments entrent en jeu dans le cycle de développement d’un projet : l’alignement de l’équipe sur les pratiques,
l’entropie, les expérimentations, la compréhension des besoins. Tous influencent le projet et le code, mais s’influencent
aussi mutuellement. Tous ces éléments font du développement une pratique complexe qui va au-delà de la simple production
de code. Modifier ces dynamiques, c’est aussi modifier notre capacité à développer une application, soit en la renforçant,
soit en la fragilisant.

À travers cet article, je cherche à comprendre comment les LLM s’intègrent dans ce contexte, comment ils influencent nos
pratiques et le code et, en retour, comment le contexte du développement influence leur usage et leurs résultats.

## Table of contents

### 1 Contexte

### 1.1 Projet

Pour cette expérimentation, j'ai travaillé sur plusieurs composants d'une application en **microservices** dont le but est
la gestion de commandes. Les composants ont été développés en TypeScript, avec parfois une approche fonctionnelle utilisant
la librairie [fp-ts](https://gcanti.github.io/fp-ts/), et d'autres fois avec une approche plus orientée objet, à chaque fois dans les limites de ce que
permet le langage. Un élément de contexte intéressant est que l'équipe n'a pas le même niveau de connaissance sur les
différents microservices, plusieurs mircoservices ont été développés par d'autres équipes et sont maintenant maintenu
par l'équipe dont je fais partie et d'autres ont été developpés par l'équipe depuis le début.
L'architecture peut varier entre certains microservices, mais il y a généralement une volonté de faire une séparation entre
infrastructure et logique "métier". Les stratégies de test ne sont pas homogènes en fonction des projets, mais sur les projets principaux
elle consistait principalement à écrire des tests unitaires et un peu moins de tests d'intégrations. Pour l'équipe un test
unitaire correspond à un test n'utilisant ni base de données, ni système de fichiers, ni réseau, ni ce type de dépendances
externes. Les tests d'intégrations, par opposition, utilisent une base de données, le réseau, le système de fichiers, ou
parfois plusieurs de ces éléments à la fois.
Les différents services communiquent via des messages, mais aussi via des appels HTTP.
Côté IA, nous avons utilisé Claude Code avec le modèle **Sonnet 4.6**, sans avoir le budget nécessaire pour expérimenter
avec **Opus**. Nous nous en sommes servis pour générer des tests, produire du code, rédiger de la documentation, challenger
certaines idées d’implémentation, faire des revues de code, réaliser des analyses statiques, mais aussi clarifier les
spécifications de certaines fonctionnalités.
L’équipe était composée de huit développeurs, tous les membres de l’équipe n’étaient pas familiers avec l’utilisation de
Claude Code, ni même avec l’usage d’une IA agentique pour générer du code. Nous avons testé l'usage de Claude Code, dans
des contextes de solo, pair et mob programming.

### 1.2 Workflow

TODO: Completer

Pour améliorer notre expérience en tant que développeur, ce qu'on a choisi d'utiliser, c'est beaucoup de skills pour
nous aider à itérer et à construire ce qu'on faisait. On a utilisé des skills comme le Green With Doc, où l'idée c'était
de change ce qu'on va proposer en essayant de réduire l'aspect conciliant du LRN. OK, ce n'est pas bon du tout, donc je vais
commencer le parios parce que ce n'était pas ce qui était. Du coup, globalement, on a utilisé des skills pour améliorer notre
expérience en tant que développeur pour ne pas avoir à reonter complètement certaines instructions pour demander à LRN de
faire quelque chose. Dans l'idée, c'est un petit document avec un prompt qui décrit la tâche que LRN doit faire. C'est très
similaire à l'approche que j'ai vue dans mes expériences précédentes dans le cadre de Cata. Dans le cadre de Cata, ce que
j'ai observé, c'est que ça améliorait essentiellement mon expérience utilisateur, mais pas nécessairement les résultats sur
la production de Cata. Pour donner quelques exemples de skills qu'on a utilisé, il y avait Gridbulldogs où l'objectif était
d'essayer d'enlever le côté conciliant des réponses qu'on peut avoir quand on utilise des LLM pour être véritablement challengé
sur ce qu'on faisait. On avait aussi eu des skills qui nous ont servi à construire des spécifications. Nous, ce qu'on essayait
de demander dans le storytelling, c'était de ne pas poser d'hypothèses à partir de... de ne pas poser d'hypothèses sur ce qu'on
disait, mais de poser la question et essayer de clarifier avec l'utilisateur quand il y avait des éléments qui n'étaient pas
clairs ou précis. Ça a marché dans une certaine mesure, mais pas systématiquement. Les skills qu'on a surtout utilisés dans
les casit impératifs pour préparer le terrain, préparer un ensemble de specs cohérente et claire pour selon notre hypothèse
au départ essayer de faciliter et de mettre toutes nos chances de notre côté pour garantir un résultat cohérent.

#### 2. Spécifications

Pour chaque fonctionnalité, notre premier objectif était de clarifier les spécifications en itérant avec Claude Code. Ces clarifications contenaient
du contexte sur la fonctionnalité (une description de la fonctionnalité et de son contexte d'utilisation) et une liste d'éléments
à tester pour s'assurer d'avoir bien implémenté la fonctionnalité. Tout ce contexte était ensuite écrit dans un fichier
markdown.

Ces itérations ont mis en lumière des règles fonctionnelles implicites à plusieurs reprises, notamment autour de la gestion des
permissions. Ce point mérite d’être souligné car ces tickets avaient déjà été travaillés lors d’ateliers "tres amigos". Malgré
ces ateliers nous avons à plusieurs reprises identifié des éléments de contexte manquants (comme des noms pour certains états par exemple).
Dans certains cas, où des éléments de contexte manquaient, les LLMs généraient des hypothèses et créaient du contexte de façon
autonome. Ces éléments étaient faux et ne correspondaient pas à la réalité métier de la fonctionnalité. La problématique était que
ces éléments de contexte étaient plausibles, mais sans correspondre à la réalité métier. La cohérence de ces hypothèses a impliqué
une relecture attentive des spécifications, sans quoi nous aurions pu les rater.

Sur le moment, j’ai trouvé l’exercice utile, notamment pour identifier certains trous dans les spécifications ou pour expliciter
certains éléments. Avec un peu plus de recul, je me questionne sur l'utilité réelle des LLMs sur cet aspect du développement
logiciel. Une première réflexion est que ces clarifications sont arrivées relativement tard dans le cycle de développement,
c'est-à-dire au moment de commencer le développement. Personnellement, j'estime que démarrer le développement en ayant des
spécifications incomplètes, c'est prendre le risque de produire une solution qui ne répond pas au besoin initial. Cet exercice
de clarification doit avoir lieu plus tôt, car ce qu'on apprend peut influencer la priorisation des sujets et surtout le choix
de la solution. Un des risques avec cette approche, c'est qu'il est assez facile de poser des hypothèses ou de laisser les
LLMs les poser pour avancer alors que le contexte devrait être clarifié avec les experts métier et les PO. Il y a probablement
un intérêt à faire cet exercice pendant les ateliers tres amigos, puisque, avec la présence du product owner, avoir les bonnes
hypothèses sera plus simple.
Ma seconde réflexion est qu'en réalité, il existe déjà des pratiques permettant de vérifier qu'un ticket est complet, par exemple,
on peut utiliser une Definition of Ready, ou une check-list d'éléments à vérifier. Ces alternatives ont l'avantage d'être
simples à mettre en oeuvre, ont été éprouvée et questionne le réel bénefice à utliser des LLMs.

Dans notre cas, les instructions données au LLM précisaient explicitement qu’en cas d’ambiguïté ou d’information manquante,
il devait poser des questions pour clarifier. Cette consigne sans surprise n'est pas suffisante pour garantir ce comportement.
À plusieurs reprises, le modèle a préféré compléter lui-même le contexte plutôt que signaler explicitement l’incertitude.

Cette observation rejoint celles que j’avais déjà faites dans des contextes plus simples, même avec davantage de cadre
et plus de contexte ou une approche itérative, on ne peut pas garantir les résultats d'un LLMs. Il est possible de réduire
les dérives et hallucinations, sans pourtant réussir à aller jusqu'à les faire disparaitre et c'est un paramètre à ne pas oublier.

Bien que les interactions avec le modèle aient parfois été utiles pour faire émerger certains angles morts, elles n’ont pas remplacé
la valeur des échanges entre développeurs, QA et PO. L'atelier tres amigos ou même le BDD produisent plus qu'une liste
de tests. Ces pratiques permettent de construire progressivement une compréhension du besoin. Ce sont les échanges
dans ces pratiques qui permettent de construire cette compréhension partagée du contexte métier.

Avec un LLM, la dynamique est différente, même si générer un document permettant de lister ce que l'on comprend d'un sujet est
intéressant, il ne produit pas de lui-même de compréhension partagée. Notre objectif avec ce document de spécifications était
avant tout d'enrichir le contexte disponible pour orienter le modèle vers certaines réponses plutôt que d’autres. Dans l'approche
avec LLMs, on essaye en réalité de formuler un contexte suffisamment précis pour augmenter les probabilités de faire produire
par le LLM un résultat cohérent. On cherche via le contexte à dominer l'aspect probabiliste des réponses et pas à contruire
une compréhesion partagée. Cette distinction dans l'intention me semble importante, puisque pour avoir une réponse pertinente,
il n'y a pas nécessité de construire une compréhension partagée. Il est possible d'avoir une réponse cohérente avec une compréhension
d'un besoin erronée.

Le dernier point que je tiens à souligner c'est l’usage du langage naturel par le LLM. À plusieurs reprises le LLM a reformulé
nos propos dans ses réponses, donnant une fausse impression de compréhension. Je me demande si ce mimétisme avec des échanges
humains n'a pas tendance à nous laisser croire qu'on reproduit cette compréhension mutuelle alors que ce n'est pas la mécanique
sur laquelle reposent les LLMs. L'utilisation dans nos contextes et skills de phrases comme "Demande toujours avant",
"Ne fais pas X", ont tendance à me laisser penser que c'est bien le cas.

#### 3 Implémentations

Notre première approche était de lancer la génération à partir des spécifications que nous avions construites, et d'itérer
pour faire des corrections. Il est important de souligner un point, que ce soit pour la qualité du code générée ou même
le respect des spécifications, la génération n'a jamais été satisfaisant du premier coup. Les iérations avait pour objectif
de corriger ou de compléter la génération de la fonctionnalité. Ce n'était donc oas des itérations d'un point de vu
"agile", puisque les itérations ne servaient pas à construire de manière progressive. Cela dit ce n'est pas la seul chose que
n'avons fait de manière itérative, par exemple nous avons corriger le contexte notement sur les pratiques de code au fur et a mesure
que nous constations des générations incorrectes.

Pour notre premiere tentative, nous avonsconstaté que le code généré ne faisait pas passer les tests généré, étonnament c'est un point que nous n'avions pas pensé à
formaliser dans ni dans context ni dans les skills, puisqu'il nous parait évident et donc implicite. (a vérifier pour completer mais je sais que les TI ne passait pas, je suis plus certains pour les TU)
Toutes les corrections et ça semble important de le souligné, ont du se faire dans sans la sécurité qu'on peut avoir avec une suite
de tests fonctionnel et donc sans retours d'infromation sur ce qui marche ou pas, surtout sans retour d'information notre progression.
Suite à ce constat correction a été de rajouter un instructions dans le contexte demande explicitement de faire passer les tests.

Lors de génération suivante, ce qu'on a observé c'est que l'ajout de ces consignes à : TODO.

Les tests en eux même était rarement, exactement ceux lister dans les spécifications, parfois certains manquais et parfois des tests
qui n'était pas listé étaient ajouté. Un problème récurent a été que les tests était rarement complet, dans le sens ou il
ne testais pas complètement les implémentations. A plusieurs reprise nous avons fait du mutation testing en revue pour démontrer
la fragilité des suites de teste générée. Les tests était généraux, et ne vérifiait pas toujours tout et rarement l'enemble
des règles métiers spécifiées.

contexte, ce que nous avons observé, c’est que les itérations n’ont pas forcément été un moyen de cadrer le LLMs
pour l'amener là où nous voulions. Il y a eu des dérives à plusieurs reprises, parfois les corrections était incomplète,
pas les bonnes et surtout pas toujours limiter aux fichiers que nous traitions.

Nous avons essayé de nous servir de ces itérations pour faire un retour d’information
à Claude afin de lui indiquer les corrections que nous voulions apporter.

Par exemple, nous avions des corrections sur les types utilisés et sur le fait que nous essayions d’éviter d’avoir des types
nullables, et les corrections effectuées n’étaient pas forcément bonnes ni très cohérentes.

Nous avons eu plusieurs approches pour ajuster le contexte et ce qu’il y avait dans le `Claude.md`.

Premièrement, nous avons demandé à Claude de le mettre à jour en explicitant ce qui était ajouté.

Nous avons également eu une autre approche, un peu plus intéressante : nous avons fait les corrections à la main. Nous
avons demandé à Claude de faire la différence entre sa solution et la nôtre, et d’insérer les règles à partir de ces différences.

Il n’y a pas eu de meilleure construction du contexte avec ces deux approches, mais je dois avouer que reprendre la main,
faire la correction, puis laisser Claude faire la différence est assez intéressant et même amusant. Cela permet parfois de
mettre des mots, de verbaliser une manière de faire que l’on a parfois du mal à exprimer. Cela permet aussi d’être plus
proactif sur la construction du code et donc sur son appropriation.mais on peut faire des fts,

Malgré toutes ces itérations, à plusieurs reprises, Claude a dérivé dans les résultats qu’il produisait. Il a été parfois
difficile, voire impossible, de le ramener là où nous voulions aller. Il y avait une perte de cohérence au fur et à mesure
des différentes tentatives d’implémentation et de correction.

À plusieurs reprises, nous avons essayé de nettoyer le contexte de la session de génération de code. Nous avons conservé le
`Claude.md`, mais nous sommes repartis sur une nouvelle session d’échange avec Claude. Cela n’a pas été significativement
mieux. Nous n’avons pas toujours réussi à atteindre le résultat attendu, ce qui a été particulièrement frustrant.

L’observation que nous nous sommes faite est qu’à plusieurs reprises, tenter de décrire la correction était particulièrement
difficile. Décrire en langage naturel l’intention du code n’est pas toujours évident, ce n’est pas un exercice que nous
faisons régulièrement.

L’exercice de description en langage naturel était parfois plus complexe que l’écriture du code lui-même.

Le point est que, à partir du moment où écrire le code devient plus facile que de faire une description en langage naturel,
cela diminue fortement la valeur ajoutée du passage par un LLM.

Cela a discuté au moment où nous avons beaucoup questionné la manière de construire le contexte et son contenu, notamment
sur le fait que nous n’avions pas forcément des éléments totalement cohérents dans notre texte et surtout dans le code.

Au fil des années, une observation que j’ai faite est que les applications sont généralement hétérogènes dans leur code.
On ne retrouve pas toujours les mêmes patterns sur toutes les parties du code. Parfois parce qu’une décision a été prise
à un instant T qui ne semble plus cohérente à un instant T+1, ou parce que dans un contexte donné, une entorse à une règle
initiale a été acceptée pour diverses raisons.

Au-delà de cela, les équipes évoluent : des personnes arrivent, des personnes partent, ce qui fait évoluer les pratiques
et donc la manière dont le code est écrit.

Il existe aussi des contextes où plusieurs équipes différentes partagent une même codebase et, en fonction de qui travaille
sur quelle partie, les pratiques finissent par diverger avec le temps.

Toutes ces incohérences ont un impact sur la manière dont l’agent interprète les demandes. Elles influencent les résultats
produits par le LLM. Elles rejoignent le contexte et influencent la génération.

La distribution, par exemple la représentation d’un pattern dans le code, peut pousser le LLM à produire une solution plutôt
qu’une autre. C’est assez intéressant à observer.

Ce mécanisme, cette entropie, cette diversité est naturelle dans le cycle de vie d’un projet. On ne peut pas nécessairement
la faire disparaître ; on peut la ralentir, mais cela a un coût. Cela implique de passer beaucoup de temps à uniformiser des
pratiques spécifiques, et donc moins de temps à délivrer quelque chose de valeur pour les utilisateurs.

Faire évoluer des portions d’application ou de code, c’est toujours prendre le risque de les casser, et ce n’est pas forcément
intéressant dans certains contextes.

Mon hypothèse est que plus le code d’une application est hétérogène, plus il devient difficile de pousser un LLM à produire
quelque chose de cohérent vis-à-vis de ce code existant.

En essayant de pousser le raisonnement sur les entraînements des LLM et notamment les corpus, les projets et le code utilisés,
on retrouve cette même logique.

Si dans un projet mené par une seule équipe, on observe déjà cette hétérogénéité dans les pratiques et les patterns, elle
est encore plus présente dans des projets développés par différentes entreprises ou équipes, qui n’ont pas nécessairement
conscience des pratiques des autres et qui n’ont pas d’intérêt à créer des alignements.

Mon hypothèse est qu’aujourd’hui, pour rendre les modèles efficaces dans leur capacité à produire du code fonctionnel, on
a tendance à leur exposer un maximum de code différent.

Ce qui les rend probablement moins efficaces lorsqu’on cherche à produire une génération très spécifique de code.

Le composant principal sur lequel on travaille a été fait en essayant d'élibérer FTPF et en essayant d'avoir une approche
fonctionnelle à l'implémentation, notamment en utilisant des patterns comme les ifs, qui sont un objet permettant de représenter
par exemple deux embranchements, comme les fins else ou if. L'idée avec la fédérative, c'est d'utiliser un pipe pour enchaîner
les modifications de fonctionnalités des autres bords, en les contenant à chaque étape, l'objet qu'on a noté. Malgré les
exemples de code, malgré le code plutôt clair sur cet aspect-là, le LMM n'a pas forcément récepté ce concept-là jusqu'au
bout. Si on invente une pipeline utilisant ce concept-là, après on est pas ici des exemples, mais on peut faire des fts
ce serait très classique. Au-delà de ça, dans nos tentatives successives de refactorer le code par client par l'agent, ça a
été assez difficile d'essayer d'introduire le concept de cycles parc. Pas forcément très intéressant, peut-être un niveau de détail trop... OK.
C'est sur ces comportements qui m'ont fait questionner sur l'entraînement des LLM, la distribution sur laquelle repose la génération de la réponse.
C'est cette plénance qui m'a fait me poser la question si, en fonction du corpus d'entraînement qui a été utilisé, si la variété
et la distribution dans les solutions que les LLM a généré et ont étudiées pouvaient avoir un impact sur la capacité du LLM
à générer certaines représentations. Je suppose qu'en fonction de la distribution des différents patterns et des différentes
pratiques, il peut être difficile d'arriver sur des approches sous-représentées. Ce qui me fait penser que dans le contexte
de la génération, encore plus très variée, où entre guillemets avec des patterns sur-représentés ou d'autres sous-représentés,
il sera particulièrement difficile à orienter sur une implémentation spécifique, notamment si elle est sous-représentée dans
le corpus d'entraînement.

Un aspect que je trouve particulièrement intéressant dans cette métier, c'est la capacité à abstraire certaines problématiques.
On essaie de représenter avec du code, et donc dans un contexte normalisé très cadré, des problématiques réelles. Et ce
n'est pas toujours évident. Ça demande certains niveaux d'abstraction et des représentations pas toujours réelles. Et ça
va créer une tension entre le contexte fonctionnel, qui va impliquer une description plutôt réaliste du métier de ce qui
se passe, et une conception technique, et donc forcément partielle et orientée pour résoudre un problème. Je m'interroge
sur la capacité de l'IA à faire la distinction entre ces deux éléments, qui n'est déjà pas évidente humainement. J'ai eu
beaucoup de conversations sur le sujet où on tentait de me délivrer la réalité, et c'est rarement une bonne idée, parce
que la modélisation devient complète et n'est pas nécessairement orientée pour résoudre les problèmes qui nous intéressent.

Les fichiers qui vont convenir à ce contexte, les éléments importants du cycle de développement et impliquent une grande
communication et un effort assez important en termes de construction et de synchronisation entre les divers membres de
l'équipe. Parce que s'il est difficile d'évaluer l'impact du contexte en fonction de cette structure, de sa redondance et
de sa longueur sur la génération de code, il est facilement compréhensible que construire ce contexte en introduisant des
éléments contradictoires parce que les différents membres de l'équipe ne seraient pas d'accord soit une manière de faire
ne sera pas forcément produite. Le autre aspect qu'on a abordé est la possibilité d'avoir sur chaque poste un document de
la même nature que le fichier permettant de personnaliser un petit peu l'expérience de chaque développeur. Et c'est
intéressant et compréhensible, mais encore une fois, ça introduit de manière un peu plus forte la possibilité d'introduire
des contradictions dans les informations et dans le contexte qui va donner à la génération.

#### 3.1 Implémentation dans contexte non maitrisé

Un des microservices sur lesquels nous avons travaillé a été initié et développé pendant un certain temps par une autre
équipe. Pour diverses raisons, l’équipe avec laquelle je travaillais a repris ce microservice, avec la responsabilité de
le maintenir et de le faire évoluer lorsque nécessaire.

Ce microservice a été l’occasion de tester la génération de code et l’utilisation de l’IA de manière générale sur une
application dont l’équipe n’avait pas une appropriation particulièrement poussée.

Plusieurs fois, nous avons développé des fonctionnalités sur ce composant, mais nous n’étions pas responsables de la
cohérence globale du code. Nous nous contentions d’appliquer les modifications en essayant de respecter au mieux les
patterns existants, avec une compréhension relativement faible du contexte global de l’application et des raisons derrière
certains choix architecturaux.

Autrement dit, notre connaissance du système et des motivations des décisions techniques restait partielle.

Ce qui a été intéressant, c’est que la génération de code a globalement fonctionné, sans être parfaite.

Comme dans d’autres contextes, nous avons constaté que le LLM ne produisait pas toujours des implémentations complètes
ou entièrement correctes à partir des seules spécifications fonctionnelles. Certaines étapes nécessaires au bon fonctionnement
étaient parfois absentes et devaient être identifiées et complétées manuellement.

Étant donné que nous-mêmes n’avions pas une compréhension complète de l’application et de ses implications, nous nous
sommes souvent retrouvés à générer du code, puis à exécuter l’application pour vérifier son comportement.

Sur certaines parties, notamment celles liées au rendu ou à des composants isolés, la génération a été plutôt efficace.
En revanche, les parties impliquant des mappings, des appels serveur ou des interactions entre modules ont été plus
difficiles à générer correctement.

Ce qui a été particulièrement intéressant dans ce contexte, c’est que pour évaluer les résultats produits par le LLM, nous
ne disposions pas toujours de l’expertise nécessaire ni d’une compréhension suffisante pour juger rapidement de la cohérence
des modifications.

Dans les faits, nous réalisions des validations assez superficielles, ce qui a conduit à des implémentations parfois
incomplètes ou légèrement incohérentes avec l’existant.

Dans ce contexte, il aurait été tentant d’automatiser une partie des revues de code, étant donné notre connaissance limitée
du système.

Cependant, nous avons continué à réaliser les revues manuellement, ce qui s’est avéré particulièrement fatigant.

À chaque modification, il fallait reconstruire le contexte, retrouver des connaissances implicites que nous n’avions pas
initialement, et vérifier la cohérence globale. Cela impliquait beaucoup de lecture et d’exploration du code.

L’architecture du système, combinée à une certaine quantité de boilerplate, rendait parfois difficile la compréhension
rapide du comportement global de l’application. Mais ce n’était pas le seul facteur.

Pour juger correctement une modification, il fallait reconstruire progressivement le contexte métier et technique.

Ce processus était coûteux cognitivement, car il impliquait de lire beaucoup de code pour pouvoir formuler une opinion fiable.

Personnellement, cela m’a retiré une étape que je trouve habituellement essentielle : le fait de coder soi-même pour
s’approprier le système.

Écrire du code est pour moi un moment d’appropriation, qui permet de manipuler les abstractions, les fonctions et les
objets, et de construire une compréhension plus solide du système.

Dans ce cas, cette appropriation a été plus difficile, car elle reposait principalement sur la lecture.

Certaines parties du fonctionnement n’étaient pas immédiatement compréhensibles. Il a fallu plusieurs relectures et plusieurs
itérations pour reconstruire le modèle mental.

Cela a rendu l’exercice assez fastidieux.

Il était également plus difficile de juger si un test était pertinent ou si une implémentation était cohérente sans
maîtriser pleinement le contexte.

De même, il était plus difficile de détecter si le LLM avait omis certaines étapes importantes.

Contrairement à mon intuition initiale, le LLM ne nous a pas nécessairement aidés dans ce contexte. Il a plutôt retardé
le moment d’appropriation de la codebase.

Cette appropriation n’a eu lieu qu’au moment de la revue.

Avec le recul, je considère cette expérience comme plutôt difficile. Elle a été plus lente que si nous avions construit
la fonctionnalité manuellement, car elle a ajouté une étape de vérification et de correction a posteriori, en plus de la
compréhension du système.

#### 4.2 Analyse statique

Lors de l’expérimentation, nous avons été confrontés à une fuite de mémoire sur une application en production. La fuite
n’était pas importante et les déploiements réguliers ont empêché l’application de détecter la fuite rapidement. C’est
surtout son accumulation progressive dans le temps qui a conduit à une consommation mémoire excessive et qui a fini par
produire des erreurs _out of memory_.

De manière assez classique nous avons choisis d'analyser les déploiements effectués au moment où la fuite est apparue
pour identifier la modification responsable de la fuite. Nous avons identifié plusieurs éléments suspects et c'est l’introduction
d’une nouvelle librairie qui nous a semblé la piste la plus intéressante. Nous avons essayé de reproduire le problème en local,
sans succès. La librairie étant développée en interne et relativement petite, nous avons décidé de lire le code afin
d’identifier l’origine de la fuite.

En parallèle, nous avons utilisé Claude Code pour faire une analyse statique du code de la librairie. Cette analyse a
rapidement mis en évidence une piste à creuser comme origine potentielle de la fuite. Je dois reconnaître que l’analyse
de Claude Code a été plus rapide que la lecture du code de la librairie. L’analyse a permis de restreindre le champ de
recherche et de pointer un élément à creuser. La piste concernait une simple HashMap dans laquelle on ajoutait des éléments
sans jamais les enlever.

À partir de cette piste, nous avons essayé de comprendre et de vérifier la corrélation entre notre erreur et cette fuite
potentielle. L’idée était d’estimer le temps nécessaire pour faire crasher l’application avec cette fuite et notre trafic.
Nous avons essayé d’utiliser Claude pour faire cette estimation, mais n’étant pas très convaincus par la fiabilité du résultat,
nous avons modifié le code de notre application pour logger la quantité d’éléments dans la HashMap afin d’établir la corrélation.
Après quelques jours on a réussi a établir la corrélation avec la fuite et les personnes maintenant la librairies ont
corrigé la fuite.

Ce contexte montre une utilisation des LLM comme outil d’analyse intéressante. Il a été utile pour limiter notre espace
d’exploration, sans forcément avoir des attentes fortes sur la fiabilité. L’interprétation restant humaine, cette approche
permet de réduire la nécessité d’avoir une réponse exhaustive ou parfaitement fiable, et c’est ce qui rend l’utilisation
du LLM intéressante pour moi.

Ce fonctionnement est intéressant à mettre en contraste avec la génération de code. Comme je l’évoquais précédemment,
la diversité dans le corpus d’entraînement la nature probabiliste des LLM peut rendre difficile la génération de patterns
spécifiques ou sous-représentés. La diversité des possibilités peut réduire la précision du LLM.

Dans le cas de l’analyse statique, mon intuition est que les LLMs, et peut-être plus spécifiquement les réseaux de neurones,
sont particulièrement efficaces pour reconnaître des patterns. Avec ce prisme, un corpus d’entraînement large va augmenter
la capacité du modèle à reconnaître un pattern dans des situations variées et donc augmenter sa capacité à les identifier.
Les limites liées à un corpus hétérogène et à la nature probabiliste dans le cadre de la génération devient un atout dans
un contexte d’analyse et de reconnaissance de patterns.

Personnellement, je trouve que c’est une manière intéressante d’aborder l’usage de ces outils en comprenant ce qui fait
leur force et en essayant de les utiliser dans un contexte adapté. Les mêmes caractéristiques peuvent produire des effets
opposés selon le contexte.

Cette réalisation m’a fait me questionner sur mon positionnement quant à l’utilisation des LLMs pour les revues de code.
À l’origine, je ne suis pas particulièrement convaincu par leur utilisation pour les revues, qui sont d’une certaine manière
une analyse du code. J’ai essayé de mettre le doigt sur ce qui fait que je ne perçois pas leur usage dans ces deux contextes
de la même manière.

Pour moi, la revue de code est un processus assez subjectif, dépendant des pratiques d’équipe, des conventions et du contexte
technique et métier. Il n’existe pas toujours de réponse objectivement meilleure. Bien qu’on puisse être d'accord sur certains
principes de qualité, l’interprétation de ces principes varie en fonction des personnes et des équipes. Un exemple que je
trouve parlant est la tension entre les notions de couplage et de duplication. Si il y a plus ou moins un consensus pour
dire que le couplage est risqué, la duplication n'est pas toujours vu comme un moyen de réduire le couplage (DRY). On peut
aussi accepter des choses contradictoires dans le code en fonction des modules et des intentions. Tous ces éléments peuvent
amener du bruit dans l’analyse d’un LLM, et le bruit peut nuire à notre capacité à relire le code et devenir contre-productif.
La revue a aussi d’autres objectifs. Revoir le code, c’est aussi se l’approprier automatiser la revue c'est augmenter la dette
cognitive. Les revues sont aussi l’opportunité de pointer des sujets sur lesquels l’équipe n’est pas alignée.  
En prenant en compte tous ces paramètres, automatiser les revues ne me semble pas forcément une approche intéressante.

Une autre question intéressante est l’intégration des LLMs dans les pipelines CI/CD. L’utilisation dans les pipelines soulève
deux problèmes : le coût et la stabilité. La tarification des LLMs ne me semble pas permettre de lancer des pipelines de manière
régulière en s’appuyant sur un modèle fonctionnant avec un cloud. Même dans le cas où ce serait possible, le réseau et le non-déterminisme
des résultats rendraient la pipeline peu fiable. On peut se demander si faire tourner un modèle localement dans la pipeline est intéressant,
mais généralement les machines qui font tourner les pipelines ne sont pas forcément très performantes, pour des raisons de coût. Ces machines
ne permettraient probablement pas de faire tourner un modèle localement, et cela ne réglerait pas les problèmes de déterminisme.

En revanche, une alternative plus réaliste serait l’utilisation de modèles spécialisés, entraînés sur des tâches précises comme la
détection de fuites mémoire ou d’anomalies. Ces modèles seraient plus légers, potentiellement exécutables localement, sans forcément
nécessiter une exécution à chaque pipeline.
