---
title: Quelques heuristiques pour s'aider à poser des tests
pubDatetime: 2025-11-24
featured: false
draft: false
tags:
  - testing
description: Quelques conseils pour aider à poser des tests
---

## Table of contents

## Pour qui ?

projets partageaient les mêmes défauts : Les tests étaient incomplets, .

Cet article a pour but de donner quelques questions à se poser pour s'aider à tester du code.
L'idée est de partager les questions que je me pose quand j'écris des tests automatisés, seul ou
en pair/mob programming. Ces questions me permettent de vérifier régulièrement si je construis
une suite de tests que je vais être en capacité de maintenir dans quelques semaines ou quelques
mois.

Ces questions fonctionnent pour moi et j'espère qu'elles fonctionneront pour vous, mais attention
ce ne sont que quelques guides pour aider et pas des règles absolues. Je vous conseille en fonction
de votre contexte d'adapter ces règles, de les faire évoluer pour trouver ceux qui vous aideront le
plus. Peut-être qu'avec le temps certaines de ces règles vous paraîtrons naïves voir contre productive,
mais personnellement après quelques années je les trouve toujours assez pertinentes. Ça ne garanti
pas d'avoir de bons tests, mais je pense que de bons tests ont les caractéristiques que je vais aborder
dans cet article.

Pour des personnes qui écrivent des tests automatisés depuis quelque temps, je ne suis pas sûr
que le contenu de cet article vous apporte énormément de choses. À vous de décider si accorder
quelques minutes à cet article vous semble pertinent.

## Est-ce que je comprends mon test ? / Avoir un contexte et une intention claire

Une des difficultés quand on teste du code c'est que l'on est régulièrement amené à les lires pour les modifier les
corriger ou les compléter. Pour faire tout ça il faut lire les tests et les comprendre.
Il faut comprendre :

- L'intention : Que cherche-t-on à montrer.
- Le context : Pourquoi nous obtenons ces résultats.

### L'intention

L'intention c'est ce que met en évidence le test, le comportement qu'il montre. On pourrait simplifier en disant que
l'intention d'un test est claire quand il n'a qu'une seule raison d'échouer.
Quand les tests ont une intention permet de savoir quels sont les comportements couverent par des tests. On va plus facilement
se savoir ce qui est testé et ce qui ne l'est pas. Ce qui nous aidera à limiter la duplication de test. En cas d'évolution
du comportement, on peut rapidement identifier quels tests doivent être modifié pour vérifier la nouvelle implémentation.
On essaye de se concenter sur un seul comportement à la fois, pour rendre le test compréhensible. Une intention claie

Exemple simpliste : FizzBuzz

Créons une fonction qui suit ces règles :

- Pour les multiples de 3, on renvoie 'Fizz' à la place du nombre.
- Pour les multiples de 5, on renvoie 'Buzz' à la place du nombre.
- Pour les multiples de 3 et 5, on renvoie 'FizzBuzz' à la place du nombre.
- Sinon, on renvoie le nombre reçu

//Un test avec tous les cas

Dans ce cas, on voit que le test peut casser si la règle des multiples de 3, 5 ou 3 et 5 change.
On a plusieurs raisons de faire casser le test. En cas d'évolution, il faut chercher dans les assertions les valeurs à changer.
Dans ce context, il n'y a qu'un seul test et la logique du code est très simple. Dans un contexte avec une logique plus complexe et plus
tests, il est possible de rapidement perdre de vue l'intention dans les tests.

Avec cet exemple, il est possible de découper plus ou moins finement les cas de tests. On peut faire un cas de test avec
les differents multiple ou alors valeur par valeur jusqu'à dégager une règle plus générale.

//Un test groupé par multiple
//Un test une valeur

J'ai personnellement tendance découper le plus possible avant de faire un cas de test avec la règle générale par habitude et parce que je suis
à l'aise avec cette pratique, mais à vous de trouver la granularité qui vous permet de vous sentir protéger grace aux tests
sans rendre trop fastidieuse la correction des tests en cas d'évolution.

Exemple plus complexe : Bowling

Voici un exemple un peu plus complexe avec le règles de calcul du score du bowling (simplifiées).

- En cas de spare le lancer suivant est ajouté au score en tant que lancé bonus
- En cas de strike les deux lancers suivants sont ajoutés au score en tant que lancés bonus

//Un test i on arrive à ce resultat.

//Un test pour le spare un test pour le strike

Plus les tests sont claire plus nous somme en capacité de savoir s'ils sont pertient. Plus les tests vont tester de choses
plus il va devenir difficile de savoir si tout est testé si certains cas ont été oublié. Mon avis est qu'avoir des petits tests permet de
plus facilement de savoir ce qui est couvert par un test ou pas. Plus le test est gros et couvre de cas différents plus on
a de chance de ne pas couvrir tous les comportements du code.

### Le context

Par contexte je parle de tous les éléments qui vont permettre au tests d'obtenir le résultat attendu. Cela englobe les paramètres,
d'entre de fonctions ou méthode, dans le cadre de test d'integration avec une base de données les données injecté dans la
base de donnée avant le test. En gros tout les éléments ayant une influance sur le vérification faite par le test.

L'interêt et de comprendre rapidment pourquoi le test à ce résultat sans avoir à chercher dans tout le fichier où sont instanciées
les différentes structures de données utilisées dans le test. L'idée est de mettre en évidence ce qui a une influance direct sur
le résultat du test et de cacher le reste. En faisant ça on se facilite la lecture du test, quand on lit le test on ne voit
que les éléments pertients qui vont nous permettre de changer le résultat attendu.

Pour faire ça il y a plusieurs choses que l'on peut faire :

#### Donner du sens aux variables

//Exemple : User minor majeur

#### Ne pas trop factoriser le context des tests

// beforeEach exemple
La factorisation peut être intéressante mais attention à ne pas complètement perdre le contexte du test,

#### Utiliser des builders avec des valeurs par défaut pour construire les données de tests

// builder qui masque le valeur inutile

## Combien de temps j'ai pris pour écrire ce test ? / Facilité à tester

En prenant en compte mon expérience personnel, les projets auxquels j'ai contribués où tester était long et complexe partageait
une caractéristique : les suites de tests n'étaient pas complètes. Il peut y avoir beaucoup de raison qui rendent l'écrite
des tests difficile et je vous propose d'aborder celle que j'observe régulièrement.

### Les tests trop ambitieux

Il m'est arrivé plusieurs fois de partir sur des cas de tests qui me semblait simple, mais qui ne l'était pas tant que ça.

### Le design du code

- Dependances

### L'infrastructure

- Test qui embarque top de composants DB/Serveur/Cache/FS/Reseau ?
- Setup long
-

## En plus de celui la combien de test je dois changer si je fait évoluer le comportement du code ? / Eviter la duplication de tests

Lorsque que l'écriture de tests fait partie des pratiques d'équipe, on se retrouve généralement avec une suite de tests conséquente.
L'inconveniant des tests est qu'en cas de changement il faut les corriger. Parfois malheureusement, on se rend compte lors
d'une petite évolution qu'il faut changer un grand nombre de tests. Ces situations ont tendance à décourager l'écriture
des tests. On veut que les tests protègent des régressions sans empêcher les évolutions. Avoir beaucoup de tests à changer
en cas de changement de comportement peut être assez décourageant. Dans ce cas de figure les tests rendent rigide l'implémentation
en complexifiant les évolutions. Plus le code est difficile à faire évoluer moins il évolue.
Avoir beaucoup de test ce n'est pas avoir de bon tests, il faut avoir les tests qui permettent de sentir protégé des
régressions.
Avoir beaucoup de test != d'avoir de bon tests
Avoir les tests qui donne confiance
Quand plusieurs niveaux de tests, éviter les assertions redondante
eviter les assertions trop technique.

=> mene a l'abandon des tests ou a faire le minimum de test parce que effort trop grand pour la plus value.

## Conclusion

//Conclusion
La difficulté à écrire un test est pour moi un des feedbacks les plus intéressants pour les tests. Je pense que les tests
automatisés sont un excellent outil pour construire des applications qui fonctionnent et éviter d'introduire des régressions.
xTester une classe une fonction ne doit pas demander de démarer toutes l'application (EéE/ Integ), la majorité des tests
ne doit pas le demandé en tout cas. Plus la pratique sera simple plus l'habitude de tester sera facile à prendre.
S'outiller builder etc.

INvestissment sur le longterm, éviter introduire des régression mettre en évidence le comportement.

- PLus les test seront facile à comprendre, écrire et faire évoluer plus vous en écrirez.
- Le pair / mob bon outil pour se faire challenger et s'ameliorer quand fait correctement
- Un par d'experimentation sur la ménière de les ecrires, pas hésiter à ne pas respecter certaines règles. (mais d'autre si isolation)
- Ecrire des mauvais tests fait parti de l'apprentissage
- La douleur un bon feedback sur votre pratique des tests, avoir mal ça pas dire que les tests c'est pas bon dans votre contexte,
- mais peut-être que l'approche utilisée est la bonne.

Comment tester plein de possibilité avec leur avantages et inconveniant
Classique Pyramide
Diaman
cadrant

Plus écrire des tests est simple plus les équipes écrivait de test. Il n'y a pas que la quantité des tests qui s'ameliorait,
mais aussi leur pertinence. Les suites de tests étaient plus complète et étaient complétée/corrigée plus facilement et
régulièrement.

Une fois ce constat fait, une des questions que je me pose systématique quand j'écris des tests : Combien de temps j'ai mis
pour écrire ce test. L'idée n'est pas de définir une durée maximale, mais d'avoir un ressenti sur le temps que j'ai
consacré à écrire mes tests. Dans l'idée, j'essaie au doigt mouillé d'avoir un rapport équilibré entre le temps
que je passe à écrire les implémentations et le temps passé à tester.
C'est
