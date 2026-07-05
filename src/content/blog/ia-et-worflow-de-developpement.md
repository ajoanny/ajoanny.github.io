---
title: IA et workflow de développement
pubDatetime: 2026-06-18
featured: false
draft: false
tags:
  - Développement
  - IA
description: Retour d'expérience sur l'intégration de l'IA dans le cycle de développement sur un projet en production.
---

Depuis plusieurs mois maintenant, j'essaie de trouver une manière pertinente d'intégrer les LLM dans mes pratiques de développement.
Toutes mes expérimentations sont animées par une question, est-il possible d'intégrer les LLMs dans le développement sans
dégrader la maintenabilité, la compréhension et l'ownership du code ?

Jusqu'à présent, mes terrains d'expérimentation se sont limités aux katas, en tentant d'éprouver la génération d'implémentation,
la génération de tests, la pratique du TDD et le refactoring. Même sur des sujets simplistes, les résultats ont été discutables
en termes de fiabilité, de qualité et de répétabilité.

J'ai eu cette fois l'opportunité de tester l'utilisation des LLM sur un projet en production. Ce changement de contexte a
été l'occasion de valider la pertinence de mes observations précédentes tout en ayant un cadre plus proche de la réalité.

À travers cet article, je cherche à partager les expériences faites avec mes collègues sur l'usage des LLM dans le cadre
du développement, et les réflexions sur les raisons des résultats que nous avons obtenus.

## Table of contents

## Contexte

Pour cette expérimentation, j'ai travaillé avec une équipe sur plusieurs composants d'une application en microservices de gestion de commandes.

Les services sont développés en TypeScript, avec parfois une approche fonctionnelle et d'autres fois avec une approche plus
orientée objet, à chaque fois dans les limites de ce que permet le langage. L'équipe n'a pas initié tous les microservices dont
elle a la responsabilité, certains ont été récupérés au fil du temps. Par conséquent, l'équipe n'a pas le même niveau d'expertise
sur tous les services qu'elle maintient. L'architecture peut varier entre certains microservices, mais il y a généralement
une volonté de faire une séparation entre infrastructure et logique "métier", bien qu'il y ait de la variété dans les patterns
et leurs implémentations dans le code.

Côté IA, nous avons utilisé Claude Code avec le modèle **Sonnet 4.6**. Nous nous en sommes servis pour générer des tests,
produire du code, rédiger de la documentation, questionner certaines idées d’implémentation, faire des revues de code,
réaliser des analyses statiques, mais aussi clarifier les spécifications de certaines fonctionnalités. J'ai testé l'usage
de Claude Code, dans des contextes de solo, _pair_ et _mob programming_.

Pour améliorer notre expérience en tant que développeur, nous avons décidé d'utiliser des _skills_. Les _skills_ sont des ensembles
d'instructions réutilisables, généralement composés d'un rôle, d'un objectif et d'un contexte qui encapsule les informations
nécessaires à l'exécution d'une tâche spécifique par un LLM. Le but étant de définir les tâches que l'on va utiliser de manière récurrente.
Nous avons utilisé des _skills_ comme [grill-with-docs](https://www.aihero.dev/grill-with-docs), qui a pour but de nous aider à
construire des spécifications (en essayant de réduire l'aspect conciliant du LLM) avant de se lancer dans la génération de code.

## Spécifications

Pour chaque fonctionnalité, notre premier objectif était de clarifier les spécifications en itérant avec Claude Code. Ces clarifications contenaient
du contexte sur la fonctionnalité (une description de la fonctionnalité et de son contexte d'utilisation) et une liste d'éléments
à tester pour s'assurer d'avoir bien implémenté la fonctionnalité. Tout ce contexte était ensuite écrit dans un fichier de spécifications en
markdown.

Ces itérations ont mis en lumière des règles fonctionnelles implicites à plusieurs reprises, notamment autour de la gestion des
permissions. Ce point mérite d’être souligné, car ces tickets avaient déjà été travaillés lors d’ateliers _tres amigos_. Malgré
ces ateliers moi et mes collègues avons à plusieurs reprises identifié des éléments de contexte manquants (comme des noms pour certains états par exemple).
Dans certains cas, où des éléments de contexte manquaient, le LLM générait des hypothèses et créaient du contexte de façon
autonome. Ces éléments étaient faux et ne correspondaient pas à la réalité métier de la fonctionnalité. La problématique étant que
ces éléments de contexte étaient plausibles, mais sans correspondre à la réalité. C'est cet aspect plausible qui pose problème
puisque sans une bonne compréhension du métier et une lecture attentive, on peut passer à côté.

Sur le moment, j’ai trouvé l’exercice utile, notamment pour identifier certains trous dans les spécifications ou pour expliciter
certains éléments. Avec un peu plus de recul, je me questionne sur l'utilité réelle des LLMs sur cet aspect du développement
logiciel. Une première réflexion est que ces clarifications sont arrivées relativement tard dans le cycle de développement,
c'est-à-dire au moment de commencer le développement. Personnellement, j'estime que démarrer le développement en ayant des
spécifications incomplètes, c'est prendre le risque de produire une solution qui ne répond pas au besoin initial. Cet exercice
de clarification doit avoir lieu plus tôt, car ce qu'on apprend peut influencer la priorisation des sujets et surtout le choix
de la solution. Un des risques avec cette approche, c'est qu'il est assez facile de poser des hypothèses ou de laisser les
LLMs les poser pour avancer alors que le contexte devrait être clarifié avec les experts métier. Il y a probablement
un intérêt à faire cet exercice pendant les ateliers _tres amigos_, puisque avoir les bonnes
hypothèses sera plus simple.
Ma seconde réflexion est qu'en réalité, il existe déjà des pratiques permettant de vérifier qu'un ticket est complet, par exemple,
on peut utiliser une Definition of Ready, ou une check-list d'éléments à vérifier. Ces alternatives ont l'avantage d'être
simples à mettre en œuvre, ont été éprouvées et elles questionnent le réel bénéfice à utiliser des LLMs pour clarifier les
spécifications.

Dans notre cas, les instructions données au LLM précisaient explicitement qu’en cas d’ambiguïté ou d’information manquante,
il devait poser des questions pour clarifier. Cette consigne sans surprise n'est pas suffisante pour garantir ce comportement.
À plusieurs reprises, le modèle a préféré compléter lui-même le contexte plutôt que signaler explicitement l’incertitude.

Cette observation rejoint celles que j’avais déjà faites dans des contextes plus simples, même avec davantage de cadre
et plus de contexte ou une approche itérative, on ne peut pas garantir les résultats d'un LLM. Il est possible de réduire
les dérives et hallucinations, sans pourtant réussir à aller jusqu'à les faire disparaître et c'est un paramètre à ne pas oublier.

Bien que les interactions avec le modèle aient parfois été utiles pour faire émerger certains angles morts, elles n’ont pas remplacé
la valeur des échanges entre développeurs, QA et PO. L'atelier _tres amigos_ ou même le BDD produisent une compréhension plus fine
des fonctionnalités. Ces pratiques permettent de construire progressivement une compréhension du besoin. Ce sont les échanges
dans ces pratiques qui permettent de construire cette compréhension partagée du contexte métier. Il arrive parfois qu'il y ait
des incompréhensions et c'est naturel, mais les échanges permettent d'apprendre et de partager.

Avec un LLM, la dynamique est différente, même si générer un document permettant de lister ce que l'on comprend d'un sujet est
intéressant, il ne produit pas de lui-même de compréhension partagée. Notre objectif avec ce document de spécifications était
avant tout d'enrichir le contexte disponible pour orienter le modèle vers certaines réponses plutôt que d’autres. Dans l'approche
avec LLMs, on essaye en réalité de formuler un contexte suffisamment précis pour augmenter les probabilités de faire produire
par le LLM un résultat cohérent. On cherche via le contexte à dominer l'aspect probabiliste des réponses et pas à construire
une compréhension partagée. Cette distinction dans l'intention me semble importante, puisque pour avoir une réponse acceptable,
il n'y a pas nécessité de construire une compréhension partagée. Tout comme il est possible d'avoir une réponse acceptable avec
une compréhension partielle d'un besoin.

Le dernier point que je tiens à souligner c'est l’usage du langage naturel par le LLM. À plusieurs reprises le LLM a reformulé
nos propos dans ses réponses, donnant une fausse impression de compréhension. Je me demande si ce mimétisme des échanges
humains n'a pas tendance à nous laisser croire qu'on construit cette compréhension mutuelle alors que ce n'est pas la mécanique
sur laquelle reposent les LLMs. L'utilisation de _skills_ et de phrases comme "Demande toujours avant",
"Ne fais pas X", ont tendance à me laisser penser que ça peut être le cas, et ont tendance à me faire baisser ma garde quant
au résultat produit par les LLMs.

Si à première vue, il peut sembler que les LLMs peuvent grandement faciliter cette étape du développement, c'est prendre
le risque d'appauvrir les échanges et perdre la compréhension partagée qu'on cherche à construire sans s'en rendre compte.
Contrairement à ce qu'on peut penser, dans ce contexte les LLMs ne font pas disparaitre le besoin d'échange entre les personnes
de l'équipe.

## Implémentations

Une fois satisfait des spécifications, nous nous sommes lancés dans la génération du code. La démarche de l'équipe était
de lancer la génération à partir des spécifications et ensuite d'itérer pour faire des corrections.

En plus du fichier de spécifications, nous avions des fichiers CLAUDE.md, ENGINEERING_RULES.md contenant respectivement
des règles pour guider les modifications comme respecter les ADR du projet et des informations sur les standards d'équipes.

### Premières tentatives

Le premier point est que ce soit au niveau de la qualité du code généré ou même sur le respect des spécifications, la génération n'a
jamais été satisfaisante du premier coup. Les itérations avaient pour objectif de corriger ou de compléter la génération
de la fonctionnalité. Ce n'était donc pas des itérations d'un point de vue "agile", puisque les itérations ne servaient pas
à construire de manière progressive la fonctionnalité. Les erreurs de génération et les dérives nous ont servi de signaux
pour corriger ou compléter les fichiers de contexte.

Lors de nos premières tentatives, nous avons constaté que le code généré ne faisait pas passer les tests générés. Étonnamment
c'est un point que nous n'avions pas pensé à formaliser dans le contexte ou dans les _skills_. Ce point qui nous paraissait évident
était implicite. Au-delà de ça, les tests n'étaient pas exactement ceux listés dans les spécifications, parfois certains manquaient et parfois des tests
qui n'étaient pas listés étaient ajoutés. Sans suite de tests fiable, les corrections se sont faites sans le filet de sécurité
que sont censés offrir les tests.

Du côté de l'implémentation, les résultats n'ont pas été plus probants, le code généré ne respectant que partiellement les standards
et pratiques de l'équipe malgré la présence d'instructions dans les différents fichiers de contexte.

Nous avons fait plusieurs itérations pour pousser le LLM dans la direction que nous voulions.
L'observation que je peux faire, c’est que les itérations n’ont pas forcément été un moyen de cadrer le LLM
pour l'amener là où nous voulions. Il y a eu des dérives à plusieurs reprises, parfois les corrections étaient incomplètes,
pas les bonnes et surtout pas toujours limitées aux fichiers que nous traitions. On a constaté ces comportements sur différentes
corrections, que ce soient des corrections de signature de fonctions, du _refactoring_ "pur", ou des tentatives de compléter des implémentations
partielles. Il a parfois été difficile, voire impossible, d'amener l'agent là où nous voulions aller. Il y avait une perte de
cohérence au fur et à mesure des différentes tentatives de correction. À plusieurs reprises, nous avons
essayé de nettoyer le contexte de génération de code en démarrant une nouvelle session avec l'agent. Cela n’a pas été significativement mieux.
Nous n’avons pas toujours réussi à atteindre le résultat attendu, malgré les reformulations des _prompts_ et
les multiples corrections apportées aux éléments de contexte. Toutes ces répétitions ont été particulièrement frustrantes et fatigantes.

Ces moments de frustration ont été le sujet d'un constat partagé avec un collègue: Tenter de décrire la correction en langage
naturel est fastidieux.
Le langage naturel étant parfois ambigu, décrire une implémentation n’est pas toujours évident, ce n’est pas un exercice que nous
faisons régulièrement. Faire une description en langage naturel était parfois plus complexe que l’écriture du code. Dans
certains cas écrire le code devient plus facile que de faire une description en langage naturel. Pour pallier ces difficultés,
nous avons essayé de faire les corrections à la main et de laisser l'agent analyser les corrections pour en tirer des règles.
On a eu cette approche à plusieurs reprises, personnellement, j'ai trouvé cette approche amusante et moins frustrante. J'ai apprécié
d'être moins passif dans la production de code. Malgré, ces points positifs, le contexte généré par Claude n'était pas toujours
pertinent et étaient quelquefois des généralisations de règles vraies localement, mais pas sur toute la base de code.

### Révision du workflow

Le bilan de nos premières générations n'était pas satisfaisant de notre point de vue. Lors des générations suivantes, nous avons essayé
de revoir notre _workflow_, premièrement nous avons décidé de découper un peu mieux le contexte fourni au LLM en ayant plusieurs
fichiers markdown dans le projet. Le fichier CLAUDE.md à la racine servant à lister les autres fichiers markdown.
Nous avons un fichier ARCHITECTURE-RULES.md dans lequel nous avons inscrit les règles d'architecture globales par exemple que le domaine
doit dépendre d'interfaces et pas d'implémentations pour les éléments d'infrastructure, ainsi que le découpage par couche d'architecture
des éléments pour traiter une requête, de la validation de la requête en passant par les use-case etc.

Nous avons aussi un fichier DOMAIN_LANGUAGE.md, pour définir les éléments de langage que l'on veut utiliser et renforcer dans le code
en définissant les concepts métier et le sens qu'on leur donne dans notre contexte.

Nous avons aussi un fichier PRINCIPLES.md définissant les règles à suivre par l'agent pour produire du code.

Notre architecture étant découpée en deux couches principales, (domain et infra) chaque dossier contient son propre CLAUDE.md
définissant les règles de nommage et les patterns utilisés dans cette couche.

Notre code étant découpé en sous-domaines, l'idée était de permettre d'avoir aussi des fichiers par sous-domaine pour
faire varier les pratiques et les patterns et avoir la représentation du métier la plus utile possible dans chaque
contexte. La mise en place de tous ces documents qui représentent l'ensemble de nos pratiques et notre compréhension du métier,
a été la source de beaucoup de discussions, notamment sur les éléments où l'équipe manquait d'alignement.

Nous avons aussi pris le temps de modifier et customiser les _skills_ utilisés par le LLM pour la génération, la revue et
la création des spécifications, et de les rajouter au projet pour les versionner.

On a aussi questionné notre approche, en découpant la génération en plus petit incrément. L'objectif était de découper la _user stories_
en plus petits cas d'utilisation et de générer le code de ces cas d'utilisation par étape. Le but étant de diminuer la complexité
de la tâche et la quantité de code généré pour revoir efficacement le code et détecter les dérives plus tôt.

### Deuxième bilan

Une fois notre nouveau _workflow_ défini, nous avons repris le développement de fonctionnalité en utilisant Claude Code. Malgré
tous les efforts pour rendre explicites beaucoup de nos pratiques et nos choix et l'approche avec des itérations plus
courtes et plus simples la génération ne s'est pas significativement améliorée. On a continué à observer des dérives et un
manque de cohérence sur la génération. Le modèle n'appliquant pas certaines pratiques tout le long des générations de code.

Le premier constat que je tire c'est que malgré nos tentatives de clarifier le contexte et faire des itérations pour mieux
contrôler et guider la génération nous ne sommes pas parvenus à obtenir une génération qui était cohérente et satisfaisante
vis-à-vis de nos standards et pratiques.

Le second point que je veux soulever, c'est que peu importe l'approche les tests, l'élément censé nous aider à vérifier
que le code généré est fonctionnel, n'était pas fiable. Ils étaient régulièrement incomplets et ne testaient pas toujours
correctement le code. Parfois, il manquait des vérifications, dans d'autres cas les tests vérifiaient plusieurs choses.
Cette particularité fait qu'utiliser un indicateur comme la couverture de test nous aurait induit en erreur, car le code était bien exécuté
dans les tests, mais il n'y avait pas les assertions permettant de vérifier le comportement du code.
Pendant une de ces petites itérations, nous avons ajouté l'utilisation d'un logger, le LLM en générant le code a ajouté
des tests sur l'utilisation du logger. Ce comportement est un bon exemple de pourquoi, les tests ne sont pas fiables. Le fait
que le logger ne soit appelé n'est pas une indication que le code fonctionne et tester les logger n'est pas en adéquation
avec les standards l'équipe. Tous ces comportements rendent la fiabilité des tests générés discutable et surtout ne permettent pas
de garantir que le code généré fonctionne.

Une observation complémentaire que nous avons partagée en équipe et que parfois, sur des problèmes assez simples et non critiques,
notre niveau de motivation pour les résoudre était assez bas. La capacité des LLM à produire des solutions moyennes (acceptables,
mais pas exemptes de défauts) ne donnait pas envie d’accorder du temps à ces problèmes. La facilité d'utilisation du LLMs
ne donnait pas la sensation de tirer la qualité vers le haut, mais nous poussait à accepter des solutions moins
"qualitative". Cette observation, me laisse penser que l'usage des LLMs, n'aura pas forcément été un élément moteur pour
améliorer la qualité de nos développements.

Nos tentatives de générer du code ont été la source d'énormément de discussions à propos de nos pratiques et nos standards.
L'aspect positif est que cela a servi de révélateur de notre manque d'alignement sur certains points. Par exemple les stratégies de
tests et la répartition entre les tests d'intégration et unitaires, ou la volonté de suivre la pyramide des tests ou le diamant.

### Cohérence et biais d’entraînement

Une génération de code a été particulièrement intéressante et le sujet de beaucoup de réflexions. Sur un des projets nous
avons la librairie `fp-ts`, et nous essayons d'avoir une approche fonctionnelle dans notre manière d'écrire du code.

Dans ce contexte, la génération n'a pas été cohérente sur la durée. À première vue, le code utilisait bien la librairie `fp-ts`.
Sur la fonction principale, les éléments de la librairie étaient présents (Pipe, Either), mais en explorant le code et notamment
les fonctions utilisées par notre fonction principale, l'utilisation de la librairie n'était pas constante et on trouvait des if/else
à la place d'une utilisation des Either.

Ces difficultés à avoir une génération cohérente sur la durée m'ont fait me questionner sur les entraînements des LLMs. Le premier constat est
que le modèle au début de la génération a utilisé `fp-ts`, donc il connaît cette librairie et est capable de générer du code
l'utilisant. Pourtant, la librairie n'a pas été utilisée sur toute la génération.

Mon hypothèse est que notre capacité à maîtriser la génération de code de façon précise est dépendante de la cohérence de contexte (code, _prompt_, _skills_, etc)
qui n'est pas facilement maîtrisable et qu'en plus le contexte n'est pas l'unique élément impactant la génération. Les entraînements et le code généré par exemple
vont aussi impacter la génération et faciliter ou non la production de certains patterns.

Une observation que j’ai faite au cours de ma relativement courte expérience est que le code des applications est généralement
hétérogène. On ne retrouve pas toujours les mêmes patterns sur toutes les parties du code. Parfois parce
qu’une décision prise à un instant T ne semble plus cohérente à un instant T+1, ou parce que dans un contexte
donné, une entorse aux règles a été acceptée pour diverses raisons.

Au-delà de cela, les équipes changent : des personnes arrivent, des personnes partent, ce qui fait évoluer les pratiques
et donc la manière dont le code est écrit. Il existe aussi des contextes où plusieurs équipes différentes partagent une même
base de code et en fonction des équipes les pratiques ne sont pas homogène. Si à l'origine les pratiques sont homogènes,
sur la durée les pratiques entre les équipes peuvent diverger accentuant ce phénomène.

Cette entropie, cette diversité est naturelle dans le cycle de vie d’un projet. On peut la ralentir (sans la stopper), mais
cela implique de passer beaucoup de temps à uniformiser le code et donc moins de temps à délivrer quelque
chose de valeur pour les utilisateurs.

Cette hétérogénéité a je pense un impact sur la cohérence globale du contexte de génération de code. Le code lu par l'agent peut être
contradictoire avec les instructions du _prompt_ et les standards d'équipe. Si ces incohérences augmentent la probabilité
que le modèle utilise des patterns différents de ceux suggérés dans le _prompt_, alors on augmente la probabilité de le faire en
utilisant les mauvais patterns. Dans notre contexte malgré une utilisation plutôt équilibrée entre les if/else et les Either
dans notre base de code - une recherche avec un grep donnait 281 occurrences de if contre 253 occurrences de Either - le code existant
n'a pas suffi à garder la cohérence dans l'utilisation de librairie.

Mon intuition est que la variété dans le code utilisé pour les entraînements a, d'un côté, permis au modèle de générer du code
utilisant `fp-ts` et de l'autre a probablement introduit un biais favorisant l'utilisation d'autres patterns. Les différentes
phases d'entraînement (pré-entraînement, apprentissage par renforcement humain, etc.) ont je pense renforcé la probabilité de générer l'utilisation de if/else
par rapport à l'utilisation du Either. Hypothèse qui me semble raisonnable dans la mesure où, dans les contextes où je ne spécifiais pas
le type d'implémentation pour les éléments conditionnels, ce sont des ifs qui ont été utilisés et c'est vers des if/else
que le modèle dérivait lors des expériences de mon équipe. Ce point peut soulever des questions sur la représentation des patterns dans les corpus d'entraînement, et
de comment les autres entraînements peuvent introduire des biais, notamment l'ajustement par retour humain.

Mon hypothèse me laisse entrevoir deux approches pour avoir une génération cohérente sur la durée. La première est d'utiliser les patterns les plus probables
d'être produits par le modèle pour qu'en cas de dilution du contexte ou de perte d'attention (pour reprendre des termes plus courants)
le modèle dérive vers les patterns les plus probables et je ne sais pas dans quelle mesure c'est quelque chose qu'on peut garantir.
Et même si c'était le cas, les patterns les plus probables ne sont pas forcément les plus adaptés à différents contextes fonctionnels et techniques.
On pourrait aussi utiliser un modèle ayant eu un entraînement visant à renforcer la probabilité d'utiliser les patterns qui nous intéressent.
Malheureusement ce n'est pas un niveau de détails qu'on peut trouver sur les entrainements des modèles pour le moment. On peut aussi envisager
de prendre le temps d'entraîner les modèles nous-mêmes, ou de les fine-tuner, mais j'ai du mal à estimer la complexité de la tâche.

La seconde approche serait d'avoir un mécanisme permettant de garder/rafraîchir certains éléments de contexte pour qu'ils ne soient pas "perdus"
au milieu du contexte (dans notre cas, l'utilisation de `fp-ts`) durant la génération. Pour le moment, nous n'avons pas trouvé de moyen de le faire,
et réduire la taille de nos itérations n'a pas été une solution suffisante, j'ai constaté des dérives sur des générations d'implémentation
d'une trentaine de lignes de code.

### Reprise de projet et génération

Une fonctionnalité que j'ai développée en _pair programming_ devait être implémentée dans un service ayant été initié par une autre équipe.
Ce développement a été l'occasion d'utiliser la génération de code en ayant une connaissance technique et fonctionnelle partielle du service
sur lequel nous devions travailler.

La principale difficulté dans ce contexte était de vérifier et de s'assurer que les changements étaient corrects. À chaque modification,
il fallait reconstruire le contexte, retrouver des connaissances implicites que nous n’avions pas initialement et vérifier la
cohérence globale dans le code. Cela impliquait beaucoup de relecture et d’exploration du code. En développant, en cherchant où
écrire le code et comment des choses similaires sont faites, on commence à construire une compréhension du projet. En générant le code,
ni moi ni mon collègue n'avons commencé à comprendre le code avant la génération.

Étant donné que nous n’avions pas une compréhension complète de l’application, nous nous
sommes souvent retrouvés à lancer l’application pour vérifier son comportement. Malheureusement, le code
n'était pas toujours fonctionnel. Il fallait à la fois comprendre ce qui avait été fait, pourquoi ça ne marchait pas et ce qui
différait du code existant. Il était plus difficile de détecter si le LLM avait omis certaines étapes importantes.

Ce que je retiens principalement de ce contexte, c'est que la génération ne m'a pas donné le sentiment d'aller plus vite.
Ce serait assez difficile à démontrer, mais je pense que j'aurais été plus vite sans l'IA, notamment parce que je me serais
inspiré de code existant pour m'assurer de la cohérence du code plus tôt. La grande différence que je constate c'est que la revue
a été plus dure que d'accoutumé, puisque c'est à ce moment que l'on a "découvert" le code.

Malgré les itérations et les corrections de contexte, la génération a toujours demandé des rattrapages.
Ces corrections ne m'ont pas donné le sentiment d'être véritablement productif. Essayer d'utiliser les LLMs pour générer
les tests me semble un peu optimiste dans la mesure où c'est le même outil avec les mêmes limites qui produit puis évalue la
production. L'aspect que j'ai trouvé constant pour la génération est la perte d'appropriation du code. Ce qui m'a frappé,
c'est qu'après avoir utilisé les LLMs sur un projet que je connais mal, je n'avais pas le sentiment de mieux connaître le projet.
Je me demande si sur un projet que je connais, je peux finir par ne plus connaître le code, mais aussi à quelle vitesse ça peut arriver.
Le risque que j'identifie pour le moment, c'est que la facilité à générer du code rende la perte d'appropriation insidieuse.

## Analyse statique

Lors de l’expérimentation, nous avons été confrontés à une fuite de mémoire sur une application en production. La fuite
n’était pas importante et les déploiements réguliers nous ont empêché de détecter la fuite rapidement. C’est
surtout son accumulation progressive dans le temps qui a conduit à une consommation mémoire excessive et qui a fini par
produire des erreurs _out of memory_.

De manière assez classique, nous avons choisi d'analyser les déploiements effectués au moment où la fuite est apparue
pour identifier la modification responsable de la fuite. Nous avons identifié plusieurs éléments suspects et c'est l’introduction
d’une nouvelle librairie qui nous a semblé la piste la plus intéressante. Nous avons essayé de reproduire le problème en local,
sans succès. La librairie étant développée en interne et relativement petite, nous avons décidé de lire son code afin
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
Après quelques jours, nous avons réussi à établir la corrélation avec la fuite et les personnes maintenant la librairie ont
corrigé la fuite.

Ce contexte montre une utilisation des LLM comme outil d’analyse intéressante. Il a été utile pour limiter notre espace
d’exploration, sans forcément avoir des attentes fortes sur la fiabilité. L’interprétation restant humaine, cette approche
permet de réduire la nécessité d’avoir une réponse exhaustive ou parfaitement fiable et c’est ce qui rend l’utilisation
du LLM intéressante pour moi.

Ce fonctionnement est intéressant à mettre en contraste avec la génération de code. Les limites que je soulignais comme la nature
probabiliste des LLM, les biais dans les entrainements qui rendent précaire la génération de code ne sont pas forcément
problématique dans cet exercice. Dans le cas de l’analyse statique, mon intuition est que les LLMs et peut-être plus
spécifiquement les réseaux de neurones, sont particulièrement efficaces pour reconnaître des patterns. Avec ce prisme,
un corpus d’entraînement large et varié va augmenter la capacité du modèle à reconnaître un pattern dans des situations différentes
et donc augmenter sa capacité à les identifier. Les limites liées à un corpus hétérogène et à la nature probabiliste dans
le cadre de la génération deviennent un atout dans un contexte d’analyse et de reconnaissance de patterns.

Personnellement, je trouve que c’est une manière intéressante d’aborder l’usage de ces outils en comprenant ce qui fait
leur force et en essayant de les utiliser dans un contexte adapté. Les mêmes caractéristiques peuvent produire des effets
opposés selon le contexte.

## Revues de code

Si à l'origine, je ne suis pas particulièrement convaincu par l'utilisation des LLMs pour faire les revues de code, les résultats
sur la détection de la fuite mémoire m'ont poussé à tester une nouvelle fois les LLMs sur les revues de code.

Notre fonctionnement pour les revues était, quand le document était présent d'utiliser le fichier de spécifications construit
en première étape du _workflow_ et de lancer la revue de code sur la branche git contenant les modifications.
Si effectivement l'agent a produit des revues en détectant des défauts, les résultats sont restés discutables. Le LLM a détecté
des erreurs de type qui n'étaient pas attrapées par le langage (mais non cassantes), des incohérences de nommage, et certains
bugs. Les revues sont restées assez superficielles. Parfois, malgré le fichier de spécifications encadrant les modifications
et spécifiant que l'implémentation serait partielle, l'analyse du LLM donnait comme retour que l'implémentation était incomplète.
Il n'y a pas eu de retours structurants sur les défauts de design existants ou introduits, ni sur les tests qui n'étaient pas
toujours complets ou corrects. Les revues ont été assez insatisfaisantes. Le point que je retiens, c'est qu'en se concentrant uniquement
sur les éléments remontés par le LLM, le code n'aurait pas été acceptable par rapport aux standards de l'équipe.

Pour éprouver un peu plus cet usage, j'ai décidé de les tester les revues sur du code ayant des défauts de design que j'avais déjà identifiés.
Pour une fonctionnalité, nous avons dû faire évoluer la gestion des rôles et des permissions de notre application. Le code de notre application
avait plusieurs défauts, notamment plusieurs niveaux d'indirection qui rendaient complexe la compréhension des rôles, ainsi qu'un couplage fort dans la création des rôles
reposant sur l'hypothèse que le même rôle dans plusieurs filiales aurait toujours les mêmes permissions. Cette hypothèse s'est
révélée fausse et les évolutions demandaient de faire évoluer la manière de construire les rôles. Pour tester les revues, j'ai fait deux implémentations de cette petite
fonctionnalité : la première, simpliste, introduisait une nouvelle manière de créer un rôle, mais ne s'attaquait pas au problème de couplage et d'indirections.
La seconde définissait les rôles comme une configuration par filiale en limitant les indirections et en permettant de faire évoluer
les configurations des rôles indépendamment les unes par rapport aux autres. Dans les deux cas, mon objectif était de ne pas
capitaliser sur le couplage existant.

L'idée était de lancer les revues sur les deux branches, de comparer les résultats et de voir ce que remontait le LLM.
Dans les deux cas, ce qui a été remonté par le LLM était que les implémentations introduisaient une incohérence dans la manière de
gérer les rôles (le reste des retours restant encore une fois superficiel). Ce qui est objectivement vrai. C'est intéressant de noter que le LLM
n'a pas analysé ces modifications comme des tentatives de gérer des erreurs de design, qui rendaient les
évolutions du code plus complexes en créant du couplage. L'analyse n'a pas déterminé que ces modifications étaient volontaires.

Le code n'est pas toujours suffisant pour exprimer l'intention de certaines modifications. Que ce soit pour un LLM ou une personne, comprendre
l'intention du développeur n'est jamais évident en se basant uniquement sur le code. Généralement, quand je me lance sur ce genre de sujet,
j'ai tendance à discuter d'abord avec des collègues pour voir ce qu'ils pensent de la solution et s'il y a bien un problème.
Les revues sont donc plus une occasion de challenger l'implémentation que la direction prise pour l'implémentation.
La revue du LLM n'a pas été aussi intéressante, puisque le LLM s'est contenté de labelliser ces modifications avec un niveau de criticité important.

Cette introduction d'une forme de duplication n'a pas été détectée comme une tentative d'adresser un problème de design.
Le LLM a privilégié la cohérence par rapport aux corrections apportées, ce qui peut être une position acceptable quand c'est
un choix conscient. La seconde observation que je fais, c'est que le LLM a soulevé des défauts, mais pas tous et cette revue est incomplète.
Elle n'est donc pas suffisante pour prendre la décision à laquelle une revue est censée répondre : « Est-ce que je suis d'accord pour maintenir
cette version du code en production ? »

C'est, selon moi, le problème le plus important, dans ce contexte, je ne veux pas réduire un espace de recherche, je veux détecter tous les défauts
potentiels, pas nécessairement tous les adresser, mais en avoir conscience. Faire uniquement une revue via un LLM ne me permet pas d'avoir ce niveau
de compréhension du code. Il y a un parallèle intéressant à faire avec les revues faites sur GitHub ou GitLab, qui mettent en évidence
uniquement les changements (**diff-changes**). En se concentrant uniquement sur le changement, on peut ne pas voir comment les changements
impactent le code globalement et c'est pour ça que régulièrement en revue, on affiche un peu plus de code que ce qui est montré par les **diff-changes**.
C'est le même problème ici, en se concentrant uniquement sur les éléments remontés par le LLM on peut rater des choses importantes.

Le dernier point que j'aborderais, c'est qu'en fonction de la maturité technique des personnes, elles pourraient être amenées
à appliquer les modifications suggérées par le LLM sans se poser de questions, notamment avec la facilité qu'on a à demander
à un LLM de faire des modifications et comme je l'ai évoqué plus tôt, toutes les suggestions du LLM ne sont pas pertinentes.

Pour moi, la revue de code est un processus assez subjectif, dépendant des pratiques d’équipe et du contexte technique et métier.
Il n’existe pas toujours de réponse objectivement meilleure. Bien qu’on puisse être d'accord sur certains
principes de qualité, l’interprétation de ces principes varie en fonction des personnes et des équipes. Un exemple que je
trouve parlant est la tension entre les notions de couplage et de duplication. S'il y a plus ou moins un consensus pour
dire que le couplage est risqué, la duplication (DRY) n'est pas toujours vue comme un moyen de réduire le couplage. On peut
aussi accepter des choses contradictoires dans le code en fonction des modules et des intentions. Tous ces éléments peuvent
amener du bruit dans l’analyse d’un LLM et le bruit peut nuire à notre capacité à relire le code et devenir contre-productif.

La revue a aussi d’autres objectifs. Revoir le code, c’est aussi se l’approprier, automatiser la revue, c'est augmenter la dette
cognitive. Les revues sont aussi l’opportunité de pointer des sujets sur lesquels l’équipe n’est pas alignée. En prenant en
compte tous ces paramètres, automatiser les revues ne me semble pas forcément une approche intéressante.

Une autre question intéressante est l’intégration des LLMs dans les pipelines CI/CD. L’utilisation dans les pipelines soulève
deux problèmes : le coût et la stabilité. La tarification des LLMs ne me semble pas permettre de lancer des pipelines de manière
régulière en s’appuyant sur un modèle fonctionnant avec un cloud. Même dans le cas où ce serait possible, le réseau et le non-déterminisme
des résultats rendraient la pipeline peu fiable.

On peut se demander si faire tourner un modèle localement dans la pipeline est intéressant,
mais généralement les machines qui font tourner les pipelines ne sont pas très performantes, pour des raisons de coût. Ces machines
ne permettraient probablement pas de faire tourner un modèle localement et cela ne réglerait pas les problèmes de déterminisme.

En revanche, une alternative plus réaliste serait l’utilisation de modèles spécialisés, entraînés sur des tâches précises comme la
détection de fuites mémoire ou d’anomalies. Ces modèles seraient plus légers, potentiellement exécutables localement, sans forcément
nécessiter une exécution à chaque pipeline.

## Conclusion

Ces quelques semaines de tests ont été riches d’enseignement sur l’utilisation des LLM. Ce que je constate, c’est qu’en fonction
de l’exercice et surtout de l’exigence attendue, l’utilisation d’un LLM peut passer de pratique à contre-productive. Ces expériences
m’ont permis de formaliser ces cas d’utilisation. Les tâches d’analyse statique pour de la recherche sur des éléments spécifiques
(fuites mémoire, etc.) peuvent bénéficier de l’utilisation d’un LLM, puisqu’il est possible d’orienter les recherches.
Le LLM indique et les humains vérifient, c’est une dynamique qui permet de garder le contrôle sur ce qui est fait, et c’est ce qui
rend l’usage acceptable. Utiliser un LLM pour explorer des solutions reste intéressant tant qu’on a conscience que les pistes proposées
seront incomplètes et parfois fausses et dans certains cas génératrices de bruit. Si ces contraintes sont acceptables alors l’utilisation
est envisageable.

Sur les étapes de génération de code, je dresserai un constat moins positif. Que ce soit pour le code ou les tests, je suis rarement
parvenu à obtenir des implémentations ou des tests acceptables rapidement. La génération a été la source de beaucoup de rattrapage pas toujours
facile et parfois assez frustrant. Les implémentations incomplètes, incohérentes, les mauvais tests et la duplication sont pour moi des critères
rendant la génération de code pas suffisamment fiable pour être véritablement industrialisée.
Ces limitations rendent absolument indispensables les relectures et la compréhension du code, sauf que l’utilisation des LLM sur la génération
réduit la compréhension et l’appropriation du code. Plus l’utilisation des LLM est importante, moins l’appropriation du code est simple,
mais plus elle devient indispensable. Plus on génère de code, plus on augmente le besoin d’appropriation du code et surtout
la quantité de code à s’approprier, la problématique étant que plus on retarde l’appropriation, plus elle devient difficile.

Pour la partie spécification, pour vérifier que les informations sont complètes, l’utilisation des LLM n’est pas forcément d’un grand secours, car il existe déjà
des pratiques et des outils permettant de s’assurer d’avoir des spécifications. Ces solutions ont l’avantage de ne pas compléter
les spécifications de façon autonome. Il est possible que d’autres usages soient possibles, mais je ne les ai pas identifiés pour le moment.

L’utilisation des LLM ne fait pas disparaître les besoins de discussions et d’alignement ; au contraire, elle les rend plus indispensables,
sans forcément le rendre visible puisque parfois les éléments ambigus ou manquants sont rajoutés sans consultation par le LLM.
Le langage naturel fournit un faux sentiment de compréhension mutuelle qui est déroutant et qui peut être trompeur, ce qui m’empêche
de véritablement avoir envie de l’intégrer pleinement à cette étape du développement.

Le bilan que je tire est assez mesuré et ne reflète pas nécessairement la révolution promise par l’utilisation des LLM.
Ce sont surtout les gains de productivité que je n’ai pas observés. Globalement, pour garder la même compréhension du projet,
j’ai eu le sentiment de devoir fournir plus d’efforts sans pour autant avoir produit des solutions plus intéressantes ou plus qualitatives.

Bien qu’aujourd’hui j’aie une vision plus claire d’où et quand je peux utiliser des agents IA, les hallucinations, les erreurs,
les incohérences et surtout la diminution de ma capacité à m’approprier le code me poussent à cantonner leur utilisation
à des tâches ponctuelles ou n’ayant pas d’impact sur ma compréhension du code.

Ces expériences m’amènent à me demander si les LLM généralistes sont réellement les outils les plus adaptés au développement logiciel.
L’usage du langage naturel est plus impressionnant qu’utile dans ce contexte, et les cas où j’ai trouvé les LLM pertinents étaient des
tâches d’analyse précises, proches de la reconnaissance de patterns. Des modèles spécialisés, entraînés sur des tâches spécifiques
comme la détection d’anomalies ou de fuites mémoire, seraient peut-être plus fiables et plus abordables pour ces usages.
C’est en tout cas une direction que je serais curieux d’explorer.
