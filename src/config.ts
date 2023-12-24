import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://ajoanny.github.io/", // replace this with your deployed domain
  author: "Arthur Joanny",
  desc: "Blog sur le développement logiciel, les pratiques de dev et les pratiques agiles.",
  title: "Software Insights",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = ["fr-Fr"]; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/ajoanny",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/arthur-joanny-944058a4/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:arthur.joanny@software-insights.io",
    linkTitle: `Send an email to ${SITE.title}`,
    active: false,
  },
];
