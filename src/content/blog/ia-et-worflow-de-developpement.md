---
title: IA et workflow de développement
pubDatetime: 2026-05-30
featured: false
draft: false
tags:
  - Developpement
  - IA
description: Retour d'expérience sur l'intégration de l'IA dans le cycle de développement sur un projet en production.
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
différents microservices, plusieurs microservices ont été développés par d'autres équipes et sont maintenant maintenus
par l'équipe dont je fais partie et d'autres ont été développés par l'équipe depuis le début.
L'architecture peut varier entre certains microservices, mais il y a généralement une volonté de faire une séparation entre
infrastructure et logique "métier". Les stratégies de test ne sont pas homogènes en fonction des projets, mais sur les projets principaux
elle consistait principalement à écrire des tests unitaires et un peu moins de tests d'intégration. Pour l'équipe un test
unitaire correspond à un test n'utilisant ni base de données, ni système de fichiers, ni réseau, ni ce type de dépendances
externes. Les tests d'intégration, par opposition, utilisent une base de données, le réseau, le système de fichiers, ou
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

TODO: Compléter

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

### 2. Spécifications

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
simples à mettre en œuvre, ont été éprouvées et questionnent le réel bénéfice à utiliser des LLMs.

Dans notre cas, les instructions données au LLM précisaient explicitement qu’en cas d’ambiguïté ou d’information manquante,
il devait poser des questions pour clarifier. Cette consigne sans surprise n'est pas suffisante pour garantir ce comportement.
À plusieurs reprises, le modèle a préféré compléter lui-même le contexte plutôt que signaler explicitement l’incertitude.

Cette observation rejoint celles que j’avais déjà faites dans des contextes plus simples, même avec davantage de cadre
et plus de contexte ou une approche itérative, on ne peut pas garantir les résultats d'un LLM. Il est possible de réduire
les dérives et hallucinations, sans pourtant réussir à aller jusqu'à les faire disparaître et c'est un paramètre à ne pas oublier.

Bien que les interactions avec le modèle aient parfois été utiles pour faire émerger certains angles morts, elles n’ont pas remplacé
la valeur des échanges entre développeurs, QA et PO. L'atelier tres amigos ou même le BDD produisent une compréhension plus fine
de la fonctionnalité. Ces pratiques permettent de construire progressivement une compréhension du besoin. Ce sont les échanges
dans ces pratiques qui permettent de construire cette compréhension partagée du contexte métier. Il arrive parfois qu'il y ait
des incompréhensions et c'est naturel, mais les échanges permettent d'apprendre et de partager.

Avec un LLM, la dynamique est différente, même si générer un document permettant de lister ce que l'on comprend d'un sujet est
intéressant, il ne produit pas de lui-même de compréhension partagée. Notre objectif avec ce document de spécifications était
avant tout d'enrichir le contexte disponible pour orienter le modèle vers certaines réponses plutôt que d’autres. Dans l'approche
avec LLMs, on essaye en réalité de formuler un contexte suffisamment précis pour augmenter les probabilités de faire produire
par le LLM un résultat cohérent. On cherche via le contexte à dominer l'aspect probabiliste des réponses et pas à construire
une compréhension partagée. Cette distinction dans l'intention me semble importante, puisque pour avoir une réponse pertinente,
il n'y a pas nécessité de construire une compréhension partagée. Il est possible d'avoir une réponse cohérente avec une compréhension
d'un besoin erronée.

Le dernier point que je tiens à souligner c'est l’usage du langage naturel par le LLM. À plusieurs reprises le LLM a reformulé
nos propos dans ses réponses, donnant une fausse impression de compréhension. Je me demande si ce mimétisme avec des échanges
humains n'a pas tendance à nous laisser croire qu'on reproduit cette compréhension mutuelle alors que ce n'est pas la mécanique
sur laquelle reposent les LLMs. L'utilisation dans nos contextes et skills de phrases comme "Demande toujours avant",
"Ne fais pas X", ont tendance à me laisser penser que c'est bien le cas.

C'est un cas d'usage qui peut être intéressant, mais qui comme tout les autres outils promettant d'automatiser des pratiques,
montre que les échanges restent indispensables pour construire des spécifications et par extension une application.

### 3. Implémentations

Notre première approche était de lancer la génération à partir des spécifications que nous avions construites, et d'itérer
pour faire des corrections. Il est important de souligner un point, que ce soit pour la qualité du code généré ou même
le respect des spécifications, la génération n'a jamais été satisfaisante du premier coup. Les itérations avaient pour objectif
de corriger ou de compléter la génération de la fonctionnalité. Ce n'était donc pas des itérations d'un point de vue
"agile", puisque les itérations ne servaient pas à construire de manière progressive la fonctionnalité. Cela dit ce n'est pas la seule chose que
nous n'avons pas faite de manière itérative, nous avons construit et corrigé le contexte notamment sur les pratiques de code et nos standards au fur et à mesure
que nous constations des générations incorrectes.

Pour notre première tentative, nous avons constaté que le code généré ne faisait pas passer les tests générés, étonnamment c'est
un point que nous n'avions pas pensé à formaliser ni dans le contexte ni dans les skills, puisqu'il nous paraissait évident
et donc implicite.
Les tests n'étaient pas exactement ceux listés dans les spécifications, parfois certains manquaient et parfois des tests
qui n'étaient pas listés étaient ajoutés. Pour cette génération nous avons dû corriger le code et les tests en même temps,
donc sans avoir le bénéfice d'une suite de tests nous informant de ce qui fonctionne ou pas.

Du côté de l'implémentation, les résultats n'ont pas été plus probants, le code généré ne respectant que partiellement les standards
et pratiques de l'équipe malgré la présence d'ADR et de plusieurs fichiers markdown avec du contexte (CLAUDE.md, ENGINEERING_RULES.md).

Nous avons fait plusieurs itérations pour apporter les corrections que nous voulions au LLM.
Ce que nous avons observé, c’est que les itérations n’ont pas forcément été un moyen de cadrer le LLM
pour l'amener là où nous voulions. Il y a eu des dérives à plusieurs reprises, parfois les corrections étaient incomplètes,
pas les bonnes et surtout pas toujours limitées aux fichiers que nous traitions. On a constaté ces comportements sur différentes
corrections, que ce soient des corrections de signature de fonctions, du refactoring "pur", ou des tentatives de compléter des implémentations
partielles. Il a été parfois difficile, voire impossible, d'amener l'agent là où nous voulions aller. Il y avait une perte de
cohérence au fur et à mesure des différentes tentatives d’implémentation et de correction. À plusieurs reprises, nous avons
essayé de nettoyer le contexte de génération de code en démarrant une nouvelle session. Cela n’a pas été significativement mieux.
Nous n’avons pas toujours réussi à atteindre le résultat attendu, malgré les reformulations des prompts et
les multiples corrections apportées aux éléments de contexte. Toutes ces répétitions ont été particulièrement frustrantes et fatigantes.

L’observation que nous nous sommes faite est qu’à plusieurs reprises, tenter de décrire la correction était fastidieux.
le langage naturel étant quelque peu ambigu, décrire une implémentation n’est pas toujours évident, ce n’est pas un exercice que nous
faisons régulièrement. Faire une description en langage naturel était parfois plus complexe que l’écriture du code
lui-même. Dans certains cas écrire le code devient plus facile que de faire une description en langage naturel. Pour pallier à ces difficultés
nous avons essayer de faire les corrections à la main et de laisser l'agent analyser les corrections pour en tirer des règles.
On a eu cette approche à plusieurs reprises, personnellement, j'ai trouvé cette approche amusante et moins frustrante. J'ai apprécié d'être moins
passif dans la production de code. Le contexte généré par Claude n'était pas toujours pertinent et parfois c'étaient des généralisations
de règles vraies localement mais pas sur toute la base de code.

Lors des générations suivantes, nous avons essayé de revoir notre workflow, premièrement nous avons décidé de découper un peu mieux
le contexte fourni au LLM en ayant plusieurs fichiers markdown dans le projet. Le fichier CLAUDE.md à la racine servant à lister les autres fichiers markdown.
Nous avons un fichier ARCHITECTURE-RULES.md dans lequel nous avons inscrit les règles d'architecture globales par exemple que le domaine
doit dépendre d'interfaces et pas d'implémentations pour les éléments d'infrastructure, ainsi que le découpage par couche d'architecture
des éléments pour traiter une requête, de la validation de la requête en passant par les use-case etc.

---

exemple

---

Nous avons aussi un fichier DOMAIN_LANGUAGE.md, pour définir les éléments de langage que l'on veut utiliser et renforcer dans le code
en définissant les concepts métier et le sens qu'on leur donne dans notre contexte.

---

exemple

---

Nous avons aussi un fichier PRINCIPLES.md définissant les règles à suivre par l'agent pour produire du code.

---

example

---

Notre architecture étant découpée en deux couches principales, (domain et infra) chaque dossier contient son propre CLAUDE.md
définissant les règles de nommage et les patterns utilisés dans cette couche.

Notre code étant découpé en sous-domaines, l'idée étant de permettre d'avoir ce fichier par sous-domaine pour permettre
de faire varier les pratiques et les patterns pour avoir la représentation du métier la plus utile possible pour répondre
à nos besoins.

La mise en place de tous ces documents qui représentent l'ensemble de nos pratiques et notre compréhension du métier, a été la source
de beaucoup de discussions, notamment sur les éléments où l'équipe manquait d'alignement.

Nous avons aussi pris le temps de modifier les skills utilisés par le LLM pour la génération, la revue et la création des
spécifications, et de les rajouter au projet pour les versionner.

On a aussi challengé notre approche, en découpant la génération en fonction des différents use-cases qu'on identifiait dans les user stories.
L'idée était de diminuer la complexité de la tâche et la quantité de code généré pour revoir efficacement le code et détecter les dérives
plus tôt.

==> Constat global, peu importe l'approche

Malgré toutes ces discussions et les efforts pour rendre explicites beaucoup de nos pratiques et nos choix, la génération ne s'est pas significativement
améliorée. On a continué à observer des dérives et un manque de cohérence sur la génération. Le modèle n'appliquant pas certaines pratiques
tout le long des générations de code.

Le premier point que je veux soulever, c'est que les tests, l'élément censé nous aider à vérifier que le code généré est fonctionnel,
ne sont pas fiables car ils ne sont pas complets et et qu'ils ne testent pas correctement le code, il manque des vérifications. Cette
particularité fait qu'utiliser un indicateur comme la couverture de test nous aurait induit en erreur, car le code est bien exécuté
dans les tests, mais il n'y a pas les assertions permettant de vérifier le bon comportement du code.
C'est une situation que je n'aime parce qu'elle ne permet pas de se reposer sur une suite de tests pour faire des
corrections tout en s'assurant du bon fonctionnement du code.

==> Observation

Nos tentatives de générer du code ont été la source d'énormément de discussions à propos de nos pratiques, nos standards et
aussi de notre manque d'alignement sur certains points. Ça a été l'occasion de ré-aborder pas mal de sujets où nous étions alignés
sur les principes mais pas dans le fond. Par exemple les stratégies de tests et la répartition entre les tests d'intégration
et unitaires, ou la volonté de suivre la pyramide des tests ou le diamant.
En voulant définir un contexte meilleur et plus clair, et en limitant les contradictions, nous avons soulevé quelques sujets où
nous acceptions de façon implicite plusieurs manières de faire.

==> Hypothèse

Une observation que j’ai faite au cours de ma relativement petite expérience est que les applications sont généralement
hétérogènes dans leur code. On ne retrouve pas toujours les mêmes patterns sur toutes les parties du code. Parfois parce
qu’une décision a été prise à un instant T qui ne semble plus cohérente à un instant T+1, ou parce que dans un contexte
donné, une entorse à une règle initiale a été acceptée pour diverses raisons.

Au-delà de cela, les équipes évoluent : des personnes arrivent, des personnes partent, ce qui fait évoluer les pratiques
et donc la manière dont le code est écrit. Il existe aussi des contextes où plusieurs équipes différentes partagent une même
codebase et, en fonction de qui travaille sur quelle partie, les pratiques finissent par diverger avec le temps.

Ce mécanisme, cette entropie, cette diversité est naturelle dans le cycle de vie d’un projet. On ne peut pas nécessairement
la faire disparaître ; on peut la ralentir, mais cela a un coût. Cela implique de passer beaucoup de temps à uniformiser des
pratiques spécifiques, et donc moins de temps à délivrer quelque chose de valeur pour les utilisateurs.

Toutes ces incohérences et cette hétérogénéité ont un impact sur le contexte de génération de code. Ces éléments influencent
les résultats produits par le LLM qui à leur tour enrichissent le contexte de génération.

Une génération de code a été particulièrement intéressante et le sujet de beaucoup de réflexions.

Sur un des projets nous avons la librairie fp-ts, et du coup nous essayons de faire de la programmation fonctionnelle (dans
les limites de ce que permettent le langage et la librairie).

Ce qui est intéressant c'est que sur la durée, la génération n'a pas été cohérente.
Si par exemple le premier niveau de code utilisait bien la librairie fp-ts et notamment les Either de la librairie pour gérer les conditionnels
en avancant dans la génération, parfois le modèle a dérivé et générait du code utilisant des if/else au lieu de Either.

Le premier constat est que le modèle au début de la génération a utilisé fp-ts, donc il connaît cette librairie et est capable
de générer du code l'utilisant. Pourtant, la librairie n'a pas été utilisée sur toute la génération, et c'est utile d'essayer de comprendre pourquoi.

Mon hypothèse est que les différents entraînements ont, d'un côté, permis au modèle de générer du fp-ts et de l'autre l'empêchent
d'en générer sur la durée. Les différents entraînements (corpus, humain, etc.) ont renforcé la probabilité de générer certains types d'implémentation.
Dans notre cas, l'utilisation de if/else par rapport à l'utilisation du Either. Je suppose que les corpus contenaient plus de code if/else
impératif que de Either car la programmation fonctionnelle me semble moins fréquemment utilisée. Les autres entraînements ont probablement
suivi cette tendance, rendant plus probable la génération de if/else pour les conditionnels. Au fur et à mesure de la génération
le contexte change et certains élément influence moins la probabilité de faire générer quelque chose de spécifique. Dans notre
cas, malgré la présence d'instructions pour l'utilisation de fp-ts, sur la durée ça n'a pas suffi. Le contexte que nous avions
ne permettant plus au modèle de suffisamment influencer les probabilités et de générer du code fp-ts et donc il a produit ce qui
a le plus été renforcé pendant l'entraînement : les else/if.
Je suppose que pour avoir une génération cohérente, il faudrait un mécanisme permettant de garder/rafraîchir les règles sur
l'utilisation de fp-ts tout le long de la générations. Et ce n'est aujourd'hui pas encore fiable à faire, même sur des générations assez
courtes (une trentaine de lignes de code dans notre cas). C'est selon moi une forme de biais de génération, le modèle va tendre sur la durée
à produire les patterns qui ont été le plus renforcé pendant l'entraînement. Ces biais rendent difficile la génération de code
cohérent sur des patterns qui ne sont pas les patterns dominants du modèle.
Bien que je pense que l'entraînement et la génération influencent les résultats de la génération, il y a un dernier élément à prendre en compte à mon avis.
C'est le code et la cohérence de la base de code, dans notre projet nous avons essayer d'utiliser le plus possible fp-ts,
mais même comme ça il est possible de trouver par endroits du code utilisant des else if. Ces incohérences, vont influencer le contexte
et la capacité du LLM à produire du code en renforçant ou diminuant la probabilité de produire les patterns dominants du modèle.

Cette hypothèse et ces réflexions me laissent penser que le seul moyen de guider la génération à notre dispositiont est le contexte.
Les entraînements étant faits par les sociétés développant les modèles (et pas très transparents) et la génération faite par le modèle,
espérer contrôler les résultats produits en s'appuyant uniquement sur le contexte me paraît peu atteignable pour le moment.
C'est ce qui rend, de mon point de vue, la génération assez difficile à maîtriser et me gêne dans leur utilisation pour de
la génération.

===> À garder ? J'aime l'idée mais je ne sais pas l'articuler pour l'instant
Un aspect que je trouve particulièrement intéressant dans notre métier, c'est la capacité à abstraire certaines problématiques.
On essaie de représenter avec du code, et donc dans un contexte très cadré, des problématiques réelles. Et ce
n'est pas toujours évident. Ça demande certains niveaux d'abstraction et des représentations pas toujours réelles. Et ça
va créer une tension entre le contexte fonctionnel, qui va impliquer une description plutôt réaliste du métier de ce qui
s'y passe, et une conception technique, et donc partielle et orientée pour résoudre un problème spécifique ce qui peut être une source
de contradiction.
Je m'interroge sur la capacité de l'IA à faire la distinction entre ces deux éléments, qui n'est déjà pas évidente humainement.
<===

### 3.1 Implémentation dans un contexte non maîtrisé

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

### 4. Analyse statique

Lors de l’expérimentation, nous avons été confrontés à une fuite de mémoire sur une application en production. La fuite
n’était pas importante et les déploiements réguliers ont empêché l’application de détecter la fuite rapidement. C’est
surtout son accumulation progressive dans le temps qui a conduit à une consommation mémoire excessive et qui a fini par
produire des erreurs _out of memory_.

De manière assez classique, nous avons choisi d'analyser les déploiements effectués au moment où la fuite est apparue
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
Après quelques jours on a réussi à établir la corrélation avec la fuite et les personnes maintenant la librairie ont
corrigé la fuite.

Ce contexte montre une utilisation des LLM comme outil d’analyse intéressante. Il a été utile pour limiter notre espace
d’exploration, sans forcément avoir des attentes fortes sur la fiabilité. L’interprétation restant humaine, cette approche
permet de réduire la nécessité d’avoir une réponse exhaustive ou parfaitement fiable, et c’est ce qui rend l’utilisation
du LLM intéressante pour moi.

Ce fonctionnement est intéressant à mettre en contraste avec la génération de code. Comme je l’évoquais précédemment,
la diversité dans le corpus d’entraînement et la nature probabiliste des LLM peuvent rendre difficile la génération de patterns
spécifiques ou sous-représentés. La diversité des possibilités peut réduire la précision du LLM.

Dans le cas de l’analyse statique, mon intuition est que les LLMs, et peut-être plus spécifiquement les réseaux de neurones,
sont particulièrement efficaces pour reconnaître des patterns. Avec ce prisme, un corpus d’entraînement large va augmenter
la capacité du modèle à reconnaître un pattern dans des situations variées et donc augmenter sa capacité à les identifier.
Les limites liées à un corpus hétérogène et à la nature probabiliste dans le cadre de la génération deviennent un atout dans
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
trouve parlant est la tension entre les notions de couplage et de duplication. S'il y a plus ou moins un consensus pour
dire que le couplage est risqué, la duplication n'est pas toujours vue comme un moyen de réduire le couplage (DRY). On peut
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

### Conclusion

TODO:
Dans ce contexte
Plus utile sur de l'analyse que sur de la génération
Utilise pour réduire un espace de recherche, pas forcément nécessaire d'automatiser ? (comme des tests de charge).
Utilisation de l'IA probableùent intéressanten, mias pas forcément sour la forme LLMs ? sans le langaue naturelle qui peut etre super flu pour de l'analyse statique
Utilisation de patterns peu courants pour un langage rend difficile d'avoir une "longue" génération.
Observation partagée entre les membres de l'équipe : l'usage du LLM nous rend fainéants par moment, il est tellement facile de demander des choses au LLM que nous avons
plus envie de parcourir les docs officiels et de réfléchir par nous-mêmes pour résoudre certains problèmes.
Gros besoin d'alignement pour avoir un contexte cohérent, et besoin de permettre à chacun d'avoir aussi ses pratiques. Ça ne fait pas disparaître
le besoin de discussion : pas l'outil en soi, mais la nécessité de co-construire le contexte.
À compléter.
