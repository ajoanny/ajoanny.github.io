---
title: Use-cases et gestion des droits.
pubDatetime: 2024-01-30
featured: false
draft: false
tags:
  - design
description: Savoir où mettre la gestion des droits dans une architecture utilisant des use-case n'est pas toujours évident. Une des piste est de ne pas la mettre dans les use-cases.
---

Dans les architectures basées sur l’utilisation des use cases nous sommes poussés à mettre toute la logique métier dans
ceux-ci. Parfois on y retrouve la gestion des droits d’accès, mais est-ce le bon endroit pour la mettre ? Parfois cette
logique peut se retrouver
dans différente partie du code, au niveau des routes d’API ou des contrôleur par exemple.

Je ne pense qu’il n’existe pas de réponse absolue sur l’endroit où mettre cette logique. Je vous propose à travers
un exemple de réinitialisation de mot de passe de voir l'intérêt qu’il peut y avoir à faire exister la gestion des droits
en dehors d’un use case.

Tous les exemples de code seront disponible sur ce [repository github](https://github.com/ajoanny/usecase-et-droits).

## Table of contents

## Les droits d’accès sont-ils des règles métier ?

L’utilisation de use-case est souvent un indicateur qu’une architecture mettant l’accent sur la logique métier est en place
dans une application. Ce genre d’architecture à pour objectif de faire exister la logique métier dans une seule partie de
l’application qui sera indépendante des contraintes techniques.

Ce sont les experts métiers ou les product owners qui vont définir et aider à définir les droits des utilisateurs. Est-ce
que le fait que ces règles soient définies par les personnes du métier impose de faire exister ces règles dans les use-cases ?
Eh bien pas forcément !

Je m’explique, un use-case doit être indépendant du contexte dans lequel il est utilisé. Il ne doit pas avoir conscience
d’être appelé depuis un script, un contrôleur ou une d’interface en ligne de commande. Cependant, une partie de ces droits
vont dépendre des choix faits pour mettre l’application à disposition des utilisateurs.

Prenons l’exemple de réinitialisation d’un mot de passe. Pour une application web classique, un utilisateur peut redéfinir
son mot de passe en cliquant sur un bouton mot de passe oublié.
Imaginons maintenant que sur cette même application une personne avec des droits administrateur puisse réinitialiser le mot de passe d’un utilisateur.
Dans ce contexte, il faut vérifier les droits de l’utilisateur qui tente de réinitialiser le mot de passe. Supposons
maintenant qu’en raison d’une roadmap chargée, on ne souhaite pas trop investir sur cette fonctionnalité. Le métier décide
qu’un script sera suffisant et que l’équipe de développement lancera ce script pour les administrateurs pour le moment.
Cette fois ce sont les choix des outils et plateformes utilisés qui auront une influence sur qui peut lancer le script.

En prenant cet exemple de fonctionnalité, il y a une gestion des droits différente en fonction du contexte. Il est possible
de se dire qu’on est face à trois fonctionnalités différentes et faire des use-cases différents avec leur propre gestion
de droits. Cette solution implique de rajouter un nouveau use-case dans le cas où on voudrait avoir cette fonctionnalité
dans un autre contexte.
On peut aussi faire coexister les trois règles de droits dans un seul use-case. Cette fois c'est le couplage entre les
contextes qui devient problématique. Faire évoluer les droits d’un contexte implique de faire évoluer du code qui est
mutualisé entre tous les contextes.

Ces deux solutions qui apportent leur problématique considèrent la logique de droits d’accès comme de la logique métier. En prenant du recul on peut se demander si cette logique n’est pas plus dépendante du contexte d'exécution que de la logique métier. En adoptant ce point vue et en s’autorisant à sortir cette logique des use-cases il est possible de les rendre indépendants du contexte d'exécution.

## Use Case et Model

Essayons de développer la fonctionnalité de réinitialisation de mot de passe dont je parlais plus haut.

Voici les besoins que nous donne notre product owner :

> C’est un besoin urgent, mais en même temps on ne veut pas encore ouvrir la fonctionnalité aux utilisateurs.
> Pour l’instant c’est les développeurs qui vont le faire, normalement ça ne devrait pas arriver souvent peut-être une ou
> deux fois dans le mois, donc on fait un script et vous le lancez quand on en a besoin. On verra pour faire une feature
> pour les admins plus tard.

C’est un scénario que j’ai déjà vécu pas avec cette fonctionnalité, mais les arguments étaient similaires. Commençons par
écrire un use-case permettant de réinitialiser un mot de passe et utilisant un model avec un peu de logique. Prenons le
parti de ne pas mettre de gestion de droit dans le use-case pour voir où cela mène.

```typescript
export default class ResetPassword {
  private accounts: AccountsPort;

  constructor(accounts: AccountsPort) {
    this.accounts = accounts;
  }

  async execute(email: string, password: string): Promise<void> {
    const account: Account = await this.accounts.get(email);
    account.resetPassword(password);
    this.accounts.save(account);
  }
}
```

```typescript
export default class Account {
  private _email: string;
  private _password: string;

  constructor(email: string, password: string) {
    this._email = email;
    this._password = password;
  }

  resetPassword(password: string): void {
    if (password.length < 8) {
      throw new PasswordTooSmall();
    }
    this._password = password;
  }
}
```

On peut constater que le modèle et le use-case ont peu de responsabilités. On retrouve le use-case qui fait la liaison
entre les règles métier et les besoins techniques. En parallèle on a un objet simple qui encapsule de la logique (ici
juste une vérification de la taille du mot de passe).

Passons à l’utilisation de use-case dans notre script.

## Le script

Je vais poser quelques hypothèses :
- L’application est déployée sur Scalingo et le CLI permet d’ouvrir une console Bash pour lancer notre script en étant authentifié.
- Il n’y a que les développeurs qui ont accès à l’application sur scalingo

Dans ce contexte, on peut laisser au CLI et à Scalingo la responsabilité de l'authentification, on s’enlève le besoin de
vérifier et donner des droits en passant par l’application.

```typescript
async function main(email: string, password: string) {
  const accountRepository: AccountRepository = new AccountRepository(
    new EncryptionService()
  );
  const resetPassword: ResetPassword = new ResetPassword(accountRepository);
  await resetPassword.execute(email, password);
}

(async function () {
  if (process.argv[1].match(__filename)) {
    const email: string = process.argv[2];
    const password: string = process.argv[3];
    await main(email, password);
  }
})();
```

Notre script va simplement appeler correctement notre use-case en récupérant les paramètres du script et en passant les
éventuelles dépendances.
On se retrouve avec un script permettant aux développeurs ayant accès à l’application sur scalingo de réinitialiser un
mot de passe et un use-case n’ayant aucune conscience de la gestion de droit de ce contexte.

## Contrôleur - Admin

Plus tard notre product owner revient nous voir :

> Bon réinitialiser un mot passe c’est pas vraiment le rôle des développeurs, donc on va faire une fonctionnalité dans le
> back office pour que les administrateurs le fasse.

Très bien cette fois on va ajouter une route à notre application pour permettre à des utilisateurs avec des droits
administrateurs de réinitialiser un mot de passe. On va rajouter à notre application un contrôleur et une route.

```typescript
export default class AdminAccountController extends Context {
  async resetPassword(
    request: Request,
    h: ResponseToolkit
  ): Promise<ResponseObject> {
    const payload: ResetPasswordPayload = <ResetPasswordPayload>request.payload;

    await this.resetPasswordUseCase.execute(
      request.params.email,
      payload.password
    );

    return h.response().code(200);
  }
}
```

```typescript
{
   method: "POST",
   path: "/admin/accounts/{email}",
   options: {
       pre: [{ method: AccessManager.isAdmin }]
   },
   handler: adminAccountController.resetPassword
}
```

C’est au niveau de la route qu'on va définir notre vérification de droits, pour le moment rien de surprenant. En mettant
la logique de gestion de droit au niveau de la route on se donne la possibilité de réutiliser notre use-case dans nos deux
contextes. Le use-case reste indépendant des contextes dans lesquels il est appelé.

## Contrôleur - Utilisateur

Notre product owner vient nous voir une dernière fois :

> C’est bon on est prêt à ouvrir la feature aux utilisateurs et pas uniquement aux admins.

Prenons l'hypothèse suivante : 
- Pour réinitialiser son mot de passe, l'utilisateur va recevoir un mail avec un lien pour définir un nouveau mot de passe.
- L’application va générer un token qui sera envoyé à l’application via un formulaire permettant de définir le nouveau mot de passe.
- On part du principe que cette partie de l’application existe déjà et ce qui nous intéresse c’est le traitement de cette requête avec un nouveau mot de passe et un token.

On va définir un controller qui va appeler notre use-case et qui va vérifier la validité du token.
Une fois le mot de passe réinitialisé, le token sera supprimé.

```typescript
export default class AccountController extends Context {
  async resetPassword(
    request: Request,
    h: ResponseToolkit
  ): Promise<ResponseObject> {
    const payload: ResetPasswordPayload = <ResetPasswordPayload>request.payload;
    const email: string = request.params.email;
    const password: string = payload.password;
    const token: string = payload.resetPasswordToken;

    await this.resetPasswordTokenService.checkToken(email, token);
    await this.resetPasswordUseCase.execute(email, password);
    await this.resetPasswordTokenService.removeToken(email);

    return h.response().code(200);
  }
}
```

Tout cette mécanique de gestion de token n’existe que dans ce contexte, en laissant cette responsabilité au contrôleur
le use-case reste encore fois complètement indépendant du contexte.

Ce découpage des responsabilités permet de lier les droits d'accès au contexte dans lequel ils doivent exister. On a
mutualisé le comportement via le use-case, tout en l’isolant le code des besoins lié au contexte d’exécution. En choisissant
cette approche se met dans une situation ou faire évoluer les droits d’accès dans un contexte n’implique pas de faire
évoluer du code mutualisé. En limitant le couplage on facilite le travail en cas d’évolution. Grâce à ça, faire évoluer
un contexte ne peut pas introduire de bug ou dans un autre contexte. On limite aussi la quantité de travail en voulant
exposer une fonctionnalité déjà existante d’une nouvelle manière. On peut développer une fonctionnalité dans un contexte
simple avec peu de contraintes comme le script. Une fois développée on peut mettre à disposition cette fonctionnalité d’une
autre manière comme on l’a fait avec le contrôleur en se concentrant uniquement sur le contexte de la fonctionnalité.

## Conclusion

Le domaine métier ce n’est pas toutes les demandes venant des experts métiers. Certaines
demandes ou besoins émergent à cause de choix techniques et faire exister ces règles le use-case n’est pas forcément la meilleure approche à prendre.
La gestion des droits n’a pas toujours vocation à exister dans les use case, tout comme la logique de présentation ne doit
pas être présente dans les use-cases ou les objets métier.
Le domaine métier du point de vue de l’architecture logicielle ce n’est pas l’ensemble de ce que demandent les experts
métier. Ce sont l’ensemble des règles qui seront vraies peu importe le contexte d'exécution (Appli web, Script, CLI, …).

Avant de décider de mettre du code dans un use-case il est intéressant de se demander si en utilisant le use-case dans
un contexte différent le code devrait changer.
