---
title: Utiliser les mocks et éviter le couplage avec l'implémentation
pubDatetime: 2023-12-18
featured: false
draft: false
tags:
  - design
  - test
description:
  Quelques conseils pour utiliser les mocks en évitant de créer du couplage
  entre les tests et l'implémentation.
---

Lorsque l'on cherche à tester du code on finit à un moment ou à un autre par utiliser des doublures de tests. Il existe
plusieurs types de doublure de tests : les dummies, les fakes, les stubs, les mocks et les spies. Ces doublures permettent
de remplacer des parties de l’application dont on voudrait s’isoler, mais ces doublures ne sont pas toutes équivalentes.
Il y a dans la famille des doublures de tests un élément qui est sujet à débat sur son utilité et son utilisation :
le mock. Je n'aborderai que les mocks dans cet article et je vous invite à lire les très intéressants articles [Test
Double](https://martinfowler.com/bliki/TestDouble.html) et
[Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) de Martin Fowler pour saisir les nuances
entre les différents types de doublures.

Les mocks sont utilisés pour faire des vérifications d’intéractions et c’est sur ce point qu’ils font débat. La
spécification d’intéractions dans les tests est considérée (parfois à raison) comme un couplage entre tests et
implémentation. Ce couplage pouvant mener à des difficultés à faire évoluer le code sans casser les tests, l’utilisation
des mocks est mise de côté. On privilégie dans certains cas l’utilisation de tests d’intégrations ou l’utilisation de
fausses implémentations pour éviter ces problèmes de couplage.

C'est à mon sens une incompréhension de ce qu'ils apportent. La présence de couplage entre tests et implémentation est
la manifestation de problèmes plus profonds qui existent indépendamment de l'utilisation des mocks. Pour mitiger les
difficultés à faire évoluer le code il faut comprendre l’origine de ces difficultés. Nous allons parler de quelques
principes : “Stub query, mock command”, “Don’t mock what you don’t own”, “Only mock what you directly depend on” qui
peuvent nous aider à surmonter ces difficultés.

## Table of contents

## Comment les mocks révèlent la présence de problématiques liées au code ?

Au cours de sessions de pair, de mob programming ou de revue de codes les mocks ont été pour moi la source de conversations et de débats récurrents
où ils étaitent associés à des difficultés à faire évoluer le code et à un couplage fort entre les tests et
l'implémentation. Étrangement ces inconforts et ces douleurs sont des feedbacks sur les choix de design conscients et inconscients qui sont
faits dans le code. Ces douleurs sont des symptômes liés à la présence de problèmes de design. Il faut comprendre
qu'éviter d'utiliser les mocks (en faisant des tests d'intégrations par exemple) pour ne pas avoir ces douleurs n'est
pas une solution en soit. Tout comme l'utilisation des mocks n’est pas une solution suffisante pour avoir un bon design.

## Dans quel contexte les utiliser ?

### “Stub query, mock command”

Le premier principe sur lequel on peut s'appuyer pour utiliser les mocks au bon moment est de faire une distinction entre les _queries_ et
les _commands_.
On va considérer les méthodes et les fonctions qui retournent des valeurs comme des _queries_. Par exemple, une méthode
d’un _repository_ users qui permet de récupérer la liste des utilisateurs.

En opposition on trouve les _commands_ qui sont les méthodes et les fonctions qui vont permettre de modifier des états
sans avoir de valeur de retour. On parle dans ce cas d’effet de bords. Par exemple, une méthode de “repository” qui
permet de persister en base de données les changements fait sur un modèle.

Les mocks permettant de vérifier des interactions il est assez naturel de les utiliser dans le cadre des _commands_. On
peut les utiliser lorsque l’on dépend de quelque chose qui a un effet de bord.
Les effets de bords peuvent être difficiles à vérifier, il n’est pas toujours possible d’avoir accès au système qui
subit l’effet de bord. L’utilisation des mocks dans ce contexte permet de vérifier l'interaction avec le système qui
subit l’effet de bord. On supprime le besoin d’avoir accès au système externe ce qui augmente notre capacité à tester
notre code.

#### Exemple de commande : Réserver un billet de train

```ruby
it 'book a seat' do
  train = instance_double(Train)
  expect(train).to receive(:book).with('1A')
  allow(trains_port).to receive(:get).with(12).and_return(train)

  BookSeatPort.new(trains_port).execute(12, '1A')
end
```

Dans cet exemple on voit plusieurs classes qui vont interagir. La classe `BookSeatPort` est notre point d'entrée vers la
logique métier (on pourrait parler de use-case). L'objet `trains_port` est une fausse implémentation de l'abstraction
dont dépend `BookSeatPort` pour récupérer les trains dans la couche de persistence. La classe `Train` quant à elle,
encapsule la logique métier. La notion de port dans mes exemples vient de l'architecture Hexagonal, ce sont des
classes ou des interfaces (en fonction du sens des dépendances) qui vont définir les interactions entre deux éléments
(ici le code métier et la base de données).
Pour comprendre un peu plus la notion de port je vous conseille ces deux articles [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/) d' Alistair Cockburn et [Architecture Hexagonale : trois principes et un exemple d'implémentation](https://blog.octo.com/architecture-hexagonale-trois-principes-et-un-exemple-dimplementation) de
Sébastien Roccaserra.
On utilise un mock pour s'assurer qu’on a correctement interagit avec l’objet `Train`. On vérifie l’appel à une méthode
qui va avoir un effet de bord, peu importe les effets de la méthode `book` de sur l’objet `Train`.
Ce test masque l’implémentation de la classe `Train`, on ne sait pas comment observer les effets de la méthode `book`.
Ce qui est acceptable dans la mesure où ce test ne veut pas mettre en évidence le comportement de la classe `Train`,
mais les interactions entre le `BookSeatPort`, le port `TrainsPort` et la classe `Train`.

On peut questionner l'utilisation d'un double dans ce cas, est-ce que l'utilisation d'un double crée un couplage entre le
test et l'implémentation ?
Pour répondre à cette question regardons le même test avec une véritable implémentation.

```ruby
 it 'book a seat' do
      train = Train.new 12, ['1A'], [], Train::ON_TIME
      allow(trains_port).to receive(:get).with(12).and_return(train)

      BookSeatPort.new(trains_port).execute(12, '1A')

      expect(train.booked_seats).to eq ['1A']
    end
```

Cette fois on vérifie qu'on a bien modifié l'état de notre instance. Est-ce que ce test crée moins de couplage avec l'implémentation ?

À mon sens non, dans ce cas on dévoile d'autres informations sur la classe `Train`. On voit que cette classe à une méthode
`booked_seats`. On ne sait pas comment on a modifié l'instance, mais on sait comment observer les modifications. Il y a
toujours une friction entre le test et l'implémentation, mais ce n'est pas la même partie de l'API de la classe `Train`
qui est mise en évidence. Dans ce test on vérifie qu'un siège est réservé (implémentation - le siège est présent dans la liste) et
pas qu'on informe le train de notre intention de réserver un siège (intention - appel de la fonction `book`). Dans les deux cas
il y a une forme d'adhérence entre le tests et l'implémentation.

Ce qu'il faut noter dans les deux précédents exemples c'est pour que pour récupérer les instances de “Train” on a utilisé des fausses
implémentations (les fausses implémentations permettent de récupérer une instance de train - queries). Dans les deux cas, il n'y a pas d'assertion pour vérifier que ces appels sont faits correctement.
À chaque fois le `trains_port` permet de faire des _queries_ et la bonne execution du test se base sur notre capacité
à récupérer l'instance de `Train` correctement. Ajouter une vérification sur le fait que la méthode `get` est correctement appelé
n'apporterait pas de vérification intéressante. Cette vérification supplémentaire va sur-spécifier les interactions dans le
code et rendre plus difficile les futurs évolutions. Il faut essayer de spécifier les interactions uniquement lorsque
c'est utile et nécessaire. C'est à dire quand c'est l'intéraction qui est importante est pas sa valeur de retour.

#### Exemple avec une query: Récupérer l'état d'un train.

```ruby
class GetTrainStatusPort
  def initialize trains_port
    @trains_port = trains_port
  end

  def execute train_id
    train = @trains_port.get(train_id)
    train.status
  end
end

it 'returns the train status' do
  train = instance_double(Train, status: Train::ON_TIME)
  allow(trains_port).to receive(:get).with(12).and_return(train)

  status = GetTrainStatusPort.new(trains_port).execute(12)

  expect(status).to eq Train::ON_TIME
end
```

Dans ce test on ne vérifie pas que l’appel à la fonction `get` a bien été fait. On se contente de faire une vérification
de dénouement. L’utilisation du `allow` permet de spécifier une valeur de retour lors de l’appel à la fonction `get`, mais
si la fonction n’est pas appelée le test ne sera pas en échec. On peut se demander si dans ce cas rajouter une assertion
sur l’appel à la fonction `get` est intéressant pour s’assurer que le code est correct.

```ruby
 it 'returns the train status' do
  train = instance_double(Train, status: Train::ON_TIME)
  expect(trains_port).to receive(:get).with(12).and_return(train)

  status = GetTrainStatusPort.new(trains_port).execute(12)

  expect(status).to eq Train::ON_TIME
end
```

En remplaçant le `allow` par un `expect` une assertion va être faite sur l'appel de la fonction `get`. Cette nouvelle
assertion crée une plus grande adhérence entre le test et le code et ne garantit pas que le comportement est correct. On
pourrait tout de même trouver des implémentations incorrectes qui ferait passer les tests.

```ruby
class GetTrainStatusPort
  def initialize(trains_port)
    @trains_port = trains_port
  end

  def execute train_id
    @trains_port.get(train_id)
    Train::ON_TIME
  end
end
```

Pour s’assurer que le code est correct, la solution la plus sûre serait d’avoir plusieurs tests et faire varier les
valeurs de `train_id` et de `status`.

```ruby
context 'when the train status is ON_TIME' do
  it 'returns ON_TIME' do
    train = instance_double(Train, status: Train::ON_TIME)
    allow(trains_port).to receive(:get).with(12).and_return(train)

    status = GetTrainStatusPort.new(trains_port).execute(12)

    expect(status).to eq Train::ON_TIME
  end
end

context 'when the train status is LATE' do
  it 'returns LATE' do
    train = instance_double(Train, status: Train::LATE)
    allow(trains_port).to receive(:get).with(12).and_return(train)

    status = GetTrainStatusPort.new(trains_port).execute(12)

    expect(status).to eq Train::LATE
  end
end

context 'when the train status is AHEAD_OF_TIME' do
  it 'returns AHEAD_OF_TIME' do
    train = instance_double(Train, status: Train::AHEAD_OF_TIME)
    allow(trains_port).to receive(:get).with(12).and_return(train)

    status = GetTrainStatusPort.new(trains_port).execute(12)

    expect(status).to eq Train::AHEAD_OF_TIME
  end
end

context 'for any train' do
  it 'returns the train status' do
    train = instance_double(Train, status: Train::AHEAD_OF_TIME)
    allow(trains_port).to receive(:get).with(13).and_return(train)

    status = GetTrainStatusPort.new(trains_port).execute(13)

    expect(status).to eq Train::AHEAD_OF_TIME
  end
end
```

Bien que plus fiable, même avec cette suite de tests il serait possible de trouver de mauvaises implémentations qui
feraient passer les tests. Le point important est de se sentir en sécurité avec ses tests, sans sur-spécifier les
éléments de design. Ici plusieurs tests vont spécifier les interactions entre les différents éléments du code. Il faut
un équilibre entre la quantité de tests nécessaires pour spécifier le comportement attendu et celle permettant de limiter
les régressions. Peut-être que dans notre cas moins de tests seraient suffisant.

Utiliser les tests pour spécifier (et non vérifier) et ne pas sur-spécifier pas les interactions entre les différentes
parties du code permet d'éviter de trop coupler les tests et l'implémentation.

Je vous invite à lire l’article [Mocks for Commands, Stubs for Queries](https://blog.ploeh.dk/2013/10/23/mocks-for-commands-stubs-for-queries/)
de Mark Seemann qui présente ce principe de manière plus concrète.

### “Don’t mock what you don’t own”

Ce principe permet de savoir sur quelles parties du code utiliser les mocks. Pour utiliser les mocks le plus
sainement possible il ne faut pas les utiliser sur des classes dont nous n'avons pas la responsabilité.
Les APIs des librairies dont notre code dépend ne sont pas toujours stables et ne sont pas toujours pensées pour être
testable.
Il arrive que pour tester le code il faille multiplier les doublures de tests ce qui rend les tests rigides et difficiles
à faire évoluer. Dans le pire des cas, on ne teste plus du tout le code, mais simplement des chaînes d'appels sur des
librairies externes. Utiliser les mocks dans ces contextes c'est accepter de devoir faire évoluer les tests en même
temps que les évolutions de la librairie ou les changements de librairies. Ce qui n'est pas forcément un choix pérenne.

#### Exemple : Un appel HTTP

Voici deux exemples qui permettent de faire une requête HTTP avec deux librairies différentes.

##### <u>Gem HTTP</u>

```ruby
class NotifyTrainStatusHttpPort
  def initialize trains_port
    @trains_port = trains_port
  end

  def execute train_id
    train = @trains_port.get(train_id)
    HTTP
      .headers('X-Custom-Header' => "mock")
      .post('https:/www.ewample.net/trains', params: { status: train.status })
  end
end

it 'send the train status' do
  httpObject = FakeHttpObject.new
  train = instance_double(Train, status: Train::ON_TIME)
  allow(trains_port).to receive(:get).with(1).and_return(train)
  allow(HTTP).to receive(:headers)
                 .with({ "X-Custom-Header" => 'mock'})
                 .and_return(httpObject)
  expect(httpObject).to receive(:post)
                  .with('https:/www.ewample.net/trains', params: { status: Train::ON_TIME})

  NotifyTrainStatusHttpPort.new(trains_port).execute(1)
end
```

Quand on utilise la librairie HTTP on doit appeler deux méthodes pour faire la requête :

- La 1er pour passer les headers
- La 2nd pour passer l’url et les paramètres

##### <u>Gem HttParty</u>

```ruby
# GEM HTTP
class NotifyTrainStatusHttPartyPort
  def initialize trains_port
    @trains_port = trains_port
  end

  def execute train_id
    train = @trains_port.get(train_id)
    HTTParty.post(
      'https:/www.ewample.net/trains',
      body: { status: train.status }.to_json,
      headers: { 'X-Custom-Header' => 'Mock' }
    )
  end
end

it 'send the train status' do
  train = instance_double(Train, status: Train::ON_TIME)
  allow(trains_port).to receive(:get).with(1).and_return(train)
  expect(HTTParty).to receive(:post)
                      .with(
                        'https:/www.ewample.net/trains',
                        body: '{"status":"ON-TIME"}',
                        headers: { 'X-Custom-Header' => 'Mock' }
                      )


  NotifyTrainStatusHttPartyPort.new(trains_port).execute(1)
end
```

Quand on utilise la librairie HttParty il n’y a qu’un appel :

- On passe l’url, le header et les paramètres en une seule fois.

On peut constater qu’en fonction de la librairie les tests ne sont pas les mêmes. Pour passer d’un libraire à une autre
il faudrait faire évoluer les tests. Dépendre directement d’une librairie va coupler les tests à l’API de la librairie.
En acceptant de faire ça, on accepte de devoir faire évoluer nos tests au rythme des évolutions de la librairie.
Il est possible assez facilement de pallier ce problème en créant nos propres abstractions que l’on va placer entre la
librairie et notre code. En faisant ça, notre code dépend d’une abstraction dont nous avons la responsabilité et dont
nous maîtrisons les évolutions.

```ruby
class TrainStatusNotificationPort
  def notify train
    raise StandardError.new('Not Implemented')
  end
end

class NotifyTrainStatusPort

  def initialize trains_port, train_status_notification_port
    @trains_port = trains_port
    @train_status_notification_port = train_status_notification_port
  end

  def execute id
    train = @trains_port.get(id)
    @train_status_notification_port.notify train
  end
end

it 'send a notification' do
  train = instance_double(Train, status: Train::ON_TIME)
  allow(trains_port).to receive(:get).with(1).and_return(train)
  expect(train_status_notification_port).to receive(:notify).with(train)

  NotifyTrainStatusPort.new(trains_port, train_status_notification_port).execute(1)
end
```

Le simple fait de passer par une abstraction permet de faire dépendre le code de quelque chose de plus stable que la
librairie. En cas de changement de librairies les tests de `NotifyTrainStatusPort` ne changeront pas, ce qui est un énorme bénéfice. Le couplage ne
se fait pas avec une implémentation particulière, mais avec le besoin de faire cette requête. Peu importe notre librairie,
l'abstraction ne devrait pas changer. De cette manière on crée de l'indépendance entre l'abstraction et son implémentation.
L’abstraction nous permet de mettre en évidence le besoin de faire une notification, mais cache la manière de le faire.

Est-ce qu'il faut tester les implémentations des abstractions ? Oui dans la mesure où c'est possible. Si c'est une
abstraction sur une base de données alors il est possible d'avoir une base de données pour les tests. Par contre, avec un
serveur externe c'est plus complexe. Il faut que ce serveur fonctionne pendant les tests, il faut connaître les
données utilisées par le serveur, il faut pouvoir relancer les tests plusieurs fois. Toutes ces contraintes ne rendent pas
évident le fait de tester de systèmes externes. En fonction du contexte il est acceptable de ne pas tester les
implémentations des abstractions ou alors de les tester, mais de ne pas inclure ces tests dans la CI.

Pour creuser un peu plus ce principe je vous conseille de lire l'article
[How I learned to love mocks](https://medium.com/@xpmatteo/how-i-learned-to-love-mocks-1-fb341b71328) de Matteo Vaccari.

### “Only mock what you directly depend on”

Ce dernier principe conseille de ne pas mocker l'implémentation interne d’une dépendance. Ce principe s'appuie le D
de [SOLID](<https://fr.wikipedia.org/wiki/SOLID_(informatique)>): L'inversion de dépendance.

En prenant l’exemple du code suivant avec une dépendance ”TrainsSQLAdapter” qui a pour responsabilité d’écrire dans la base de données.

#### Exemple : Création d'un train

```ruby
class CreateTrainPort
  def initialize trains_port
    @trains_port = trains_port
  end

  def execute reference
    train = Train.new(reference,[], [], Train::ON_TIME)
    @trains_port.create train
  end
end


class TrainsSqlAdapter
  def create train
    ORM::Train.create! train
  end
end
```

En ne respectant pas ce principe pour tester le code précédant, on testerait l'appel à la classe `ORM::Train` et pas celui
sur le `trains_port`.

```ruby
describe CreateTrainPort do
  it 'creates the train' do
    train = Train.new('ABCD', [], [], Train::ON_TIME)
    trains_port = TrainsSqlAdapter.new
    expect(ORM::Train).to receive(:create!).with(train)

    CreateTrainPort.new(trains_port).execute('ABCD')
  end
end
```

On va coupler les tests de notre `CreateTrainUseCase` à une implémentation particulière de notre `trains_port`. On spécifie
le comportement du code dans le cas où il utilise une implémentation particulière : celle qui utilise la classe `ORM::Train`.
Cette approche peut avoir un certain attrait, car elle masque les interactions avec la dépendance et tant que l'interaction
avec l'objet `ORM::Train` a lieu le test va passer. Cependant, on rend notre code dépendant de cette implémentation
particulière. Par exemple, si pour des raisons de performance on souhaitait se passer de l'ORM il faudrait changer ces tests.
Cette approche fait perdre à mon sens l'intérêt de faire une architecture en couches et d’utiliser des abstractions afin
de pouvoir remplacer des parties de l’application. Les tests vont dévoiler les détails d’implémentation des dépendances on perd le
principe d’inversion de dépendances : on ne dépend plus d'abstrations, mais de détails d'implémentation.

Un autre problème de cette approche est qu'elle augmente la quantité de tests à écrire.
Tester d'un bloc la classe principale et ses dependances oblige à tester le comportement de la classe principale combiné à celui
des dépendances. Le nombre de tests à écrire devient combinatoire. Faire la séparation entre la classe testée et les
dépendances permet de rendre les tests composable. Avoir des tests composable permet d'avoir significativement moins de
tests à écrire.

Je vous invite à regarder [cette petite vidéo](https://youtu.be/Wf3WXYaMt8E?si=eseOyJJ4TfRtAjIf) de Kent Beck qui
explique ce principe que je ne vais pas détailler dans cet article.

### Conclusion

Les mocks sont un outil permettant d’avoir un feedback intéressant sur les choix de design. Couplés au TDD (London School)
ils permettent de cadencer les réflexions sur le design et d’avoir un feedback régulier sur les choix de design. Cependant ils ne
sont pas à utiliser dans tous les cas pour éviter les difficultés à faire évoluer le code. Pour être utile il
faut utiliser les mocks comme un déclencheur de réflexion et pas uniquement comme une manière d’isoler du code.

Ils créent effectivement une adhérence entre le design et le code, il faut donc limiter leur utilisation aux endroits où
ils peuvent être la source d’un feedback intéressant et là où les interactions entre la classe testée et les mocks seront stables.
Ce sont des outils exigeants dont l'utilisation implique de prendre en compte les feedbacks de design. Les mocks vont mettre en évidence les problèmes
de design dans les tests et c'est lorsque l'on ne prend pas en compte ces feedbacks que l'utilisation des mocks devient douloureuse. Pour s’en servir
efficacement il faut prendre en compte ces feedbacks et adapter le design.

Vous pouvez trouver les exemples de tests de cette article sur ce le repository : [Article Mock Principes](https://github.com/ajoanny/article_mock_principes)

### Références

[Test Double](https://martinfowler.com/bliki/TestDouble.html) - Martin Fowler

[Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) - Martin Fowler

[Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/) - Alistair Cockburn

[Architecture Hexagonale : trois principes et un exemple d'implémentation](https://blog.octo.com/architecture-hexagonale-trois-principes-et-un-exemple-dimplementation) - Sébastien Roccaserra.

[Mocks for Commands, Stubs for Queries](https://blog.ploeh.dk/2013/10/23/mocks-for-commands-stubs-for-queries/) - Mark Seemann

[How I learned to love mocks](https://medium.com/@xpmatteo/how-i-learned-to-love-mocks-1-fb341b71328) - Matteo Vaccari

[The Magic Tricks of Testing](https://youtu.be/URSWYvyc42M?si=KWecyoHSQyLxoSg-) - Sandi Metz

[Integrated Tests Are A Scam](https://youtu.be/fhFa4tkFUFw?si=hrkPzv7LMhptiKYD) - J.B Rainsberger

[Test Desiderata 9/12 Tests Should Be Composable](https://youtu.be/Wf3WXYaMt8E?si=eseOyJJ4TfRtAjIf) - Kent Beck

[🚀 Does TDD Really Lead to Good Design? (Sandro Mancuso)](https://youtu.be/KyFVA4Spcgg?si=OAKSxLW12x64cEZo) - Sandro Mancuso
