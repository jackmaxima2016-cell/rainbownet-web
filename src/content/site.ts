export const SITE = {
  name: 'RAINBOWNET',
  legalName: 'RAINBOWNET',
  domain: 'https://rainbownet.ch',
  city: 'Genève',
  country: 'Suisse',
  signature: {
    fr: 'La discrétion est notre signature.',
    en: 'Discretion Is Our Signature.',
  },
  secondary: {
    fr: 'Basée à Genève. Présence européenne. Intelligence.',
    en: 'Geneva-Based. Europe-Wide. Intelligence-Driven.',
  },
  email: null as string | null, // à compléter avant mise en ligne
  phone: null as string | null, // à compléter avant mise en ligne
  publisher: {
    fr: 'RAINBOWNET — [raison sociale, adresse et IDE à compléter avant mise en ligne]',
    en: 'RAINBOWNET — [legal name, address and registration number to be completed before launch]',
  },
};

export type Lang = 'fr' | 'en';

export const LANGS: Lang[] = ['fr', 'en'];

export const NAV: Record<Lang, { label: string; href: string }[]> = {
  fr: [
    { label: 'Accueil', href: '/' },
    { label: 'À propos', href: '/about/' },
    { label: 'Services', href: '/services/' },
    { label: 'Notre méthode', href: '/approach/' },
    { label: 'Couverture européenne', href: '/coverage/' },
    { label: 'Confidentialité', href: '/confidentiality/' },
    { label: 'Ressources', href: '/insights/' },
    { label: 'Contact', href: '/contact/' },
  ],
  en: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Services', href: '/services/' },
    { label: 'Our Approach', href: '/approach/' },
    { label: 'European Coverage', href: '/coverage/' },
    { label: 'Confidentiality', href: '/confidentiality/' },
    { label: 'Insights', href: '/insights/' },
    { label: 'Contact', href: '/contact/' },
  ],
};

export const UI: Record<Lang, Record<string, string>> = {
  fr: {
    cta: 'Consultation confidentielle',
    ctaShort: 'Consultation',
    menu: 'Menu',
    close: 'Fermer',
    langLabel: 'Langue',
    skip: 'Aller au contenu principal',
    readMore: 'Lire',
    allInsights: 'Toutes les ressources',
    breadcrumbHome: 'Accueil',
    faqTitle: 'Questions fréquentes',
    relatedServices: 'Services associés',
    coverageTitle: 'Couverture européenne',
    coverageIntro: 'Coordination depuis Genève, interventions dans les capitales européennes dans le respect du droit local.',
    rights: 'Tous droits réservés.',
    legal: 'Mentions légales',
    privacy: 'Politique de confidentialité',
    cookies: 'Cookies',
    credits: 'Crédits photographiques',
    contactOnly: 'Contact exclusivement via le formulaire confidentiel.',
    backTo: 'Retour',
    published: 'Publié le',
    readingTime: 'min de lecture',
    formNote: 'Vos informations sont transmises de manière sécurisée et ne sont utilisées que pour l’examen de votre demande.',
  },
  en: {
    cta: 'Confidential Consultation',
    ctaShort: 'Consultation',
    menu: 'Menu',
    close: 'Close',
    langLabel: 'Language',
    skip: 'Skip to main content',
    readMore: 'Read',
    allInsights: 'All insights',
    breadcrumbHome: 'Home',
    faqTitle: 'Frequently asked questions',
    relatedServices: 'Related services',
    coverageTitle: 'European coverage',
    coverageIntro: 'Coordinated from Geneva, delivered in European capitals in compliance with local law.',
    rights: 'All rights reserved.',
    legal: 'Legal notice',
    privacy: 'Privacy policy',
    cookies: 'Cookies',
    credits: 'Photo credits',
    contactOnly: 'Contact exclusively through the confidential form.',
    backTo: 'Back',
    published: 'Published on',
    readingTime: 'min read',
    formNote: 'Your information is transmitted securely and used only to assess your request.',
  },
};

export const SERVICE_SUMMARIES: Record<Lang, { slug: string; title: string; text: string; image: string }[]> = {
  fr: [
    { slug: 'individuals', title: 'Particuliers', text: 'Vérifications factuelles, recherches licites et accompagnement documentaire, dans un cadre strictement légal.', image: 'service-individuals' },
    { slug: 'corporates', title: 'Entreprises', text: 'Investigations corporate, due diligence, fraude et conflits d’intérêts, avec une méthode documentée.', image: 'service-corporate' },
    { slug: 'legal-professionals', title: 'Professionnels du droit', text: 'Appui à l’investigation, recherche de faits et vérifications pour dossiers juridiques.', image: 'service-legal' },
    { slug: 'international', title: 'International', text: 'Coordination européenne, vérifications transfrontalières et due diligence multijuridictionnelle.', image: 'service-international' },
  ],
  en: [
    { slug: 'individuals', title: 'Individuals', text: 'Factual verification, lawful enquiries and documentary support, within a strictly legal framework.', image: 'service-individuals' },
    { slug: 'corporates', title: 'Businesses', text: 'Corporate investigations, due diligence, fraud and conflicts of interest, with a documented method.', image: 'service-corporate' },
    { slug: 'legal-professionals', title: 'Legal professionals', text: 'Investigative support, fact-finding and verification for legal files.', image: 'service-legal' },
    { slug: 'international', title: 'International', text: 'European coordination, cross-border verification and multi-jurisdiction due diligence.', image: 'service-international' },
  ],
};

export const PILLARS: Record<Lang, { title: string; text: string }[]> = {
  fr: [
    { title: 'Discrétion', text: 'Une relation de travail confidentielle, sans exposition inutile de votre dossier.' },
    { title: 'Rigueur', text: 'Des faits vérifiés, des sources tracées, des conclusions mesurées.' },
    { title: 'Cadre légal', text: 'Chaque mandat est examiné au regard du droit applicable avant toute acceptation.' },
    { title: 'Coordination internationale', text: 'Un interlocuteur unique à Genève, des interventions structurées en Europe.' },
  ],
  en: [
    { title: 'Discretion', text: 'A confidential working relationship, with no unnecessary exposure of your matter.' },
    { title: 'Rigour', text: 'Verified facts, traceable sources and measured conclusions.' },
    { title: 'Legal framework', text: 'Every mandate is assessed against applicable law before acceptance.' },
    { title: 'International coordination', text: 'A single point of contact in Geneva, structured work across Europe.' },
  ],
};

export const CLIENTELE: Record<Lang, string[]> = {
  fr: ['Particuliers', 'Entreprises', 'Cabinets d’avocats', 'Family offices', 'Dirigeants', 'Institutions', 'Organisations internationales', 'Professionnels de la finance', 'Clients internationaux'],
  en: ['Individuals', 'Businesses', 'Law firms', 'Family offices', 'Executives', 'Institutions', 'International organisations', 'Finance professionals', 'International clients'],
};

export const PROCESS: Record<Lang, { n: string; title: string; text: string }[]> = {
  fr: [
    { n: '01', title: 'Premier échange', text: 'Un contact confidentiel permet de comprendre votre situation et de vérifier la faisabilité.' },
    { n: '02', title: 'Cadre et conformité', text: 'Nous examinons le fondement légal, la juridiction et les limites applicables avant tout engagement.' },
    { n: '03', title: 'Mandat structuré', text: 'Périmètre, méthode, calendrier et livrables sont définis par écrit.' },
    { n: '04', title: 'Restitution', text: 'Un rapport factuel, sourcé et mesuré, présenté de manière confidentielle.' },
  ],
  en: [
    { n: '01', title: 'First contact', text: 'A confidential conversation to understand your situation and assess feasibility.' },
    { n: '02', title: 'Scope and compliance', text: 'We examine the legal basis, jurisdiction and applicable limits before any engagement.' },
    { n: '03', title: 'Structured mandate', text: 'Scope, method, timeline and deliverables are set out in writing.' },
    { n: '04', title: 'Reporting', text: 'A factual, sourced and measured report, presented confidentially.' },
  ],
};

export const HOME_FAQ: Record<Lang, { q: string; a: string }[]> = {
  fr: [
    { q: 'Comment se déroule un premier contact ?', a: 'Vous utilisez le formulaire confidentiel. Nous revenons vers vous par le moyen de contact choisi afin de préciser votre besoin, vérifier la faisabilité et le cadre légal, puis vous proposer une méthode de travail.' },
    { q: 'Vos services sont-ils confidentiels ?', a: 'La confidentialité structure l’ensemble de notre travail : échanges restreints, accès limité aux dossiers, collecte minimale d’informations et restitution réservée à votre destination.' },
    { q: 'Intervenez-vous en dehors de la Suisse ?', a: 'Oui. Les mandats sont coordonnés depuis Genève et structurés selon la réglementation de chaque pays concerné. Nous n’acceptons que les missions conformes au droit local.' },
    { q: 'Quels sont vos tarifs ?', a: 'Chaque mission fait l’objet d’un devis après examen du périmètre. Les honoraires dépendent de la complexité, des juridictions concernées et des vérifications nécessaires.' },
    { q: 'Quels documents fournir au premier contact ?', a: 'Aucun document sensible n’est nécessaire. Nous vous déconseillons de transmettre des pièces confidentielles avant qu’un cadre sécurisé et un mandat aient été convenus.' },
    { q: 'Refusez-vous certains mandats ?', a: 'Oui. Toute demande dont l’objet ou les méthodes envisagées ne seraient pas licites est refusée. Cette exigence protège nos clients comme nos équipes.' },
  ],
  en: [
    { q: 'How does a first contact work?', a: 'You use the confidential form. We reply through your preferred channel to clarify your need, assess feasibility and the legal framework, then propose a method of work.' },
    { q: 'Are your services confidential?', a: 'Confidentiality structures our entire work: restricted communications, limited access to files, minimal collection of information and reporting reserved for you.' },
    { q: 'Do you work outside Switzerland?', a: 'Yes. Mandates are coordinated from Geneva and structured under the regulations of each country concerned. We only accept assignments that comply with local law.' },
    { q: 'What are your fees?', a: 'Each mandate is quoted after the scope has been reviewed. Fees depend on complexity, the jurisdictions involved and the verification required.' },
    { q: 'Which documents should I provide first?', a: 'No sensitive document is needed at first. We advise against sending confidential material before a secure framework and a mandate have been agreed.' },
    { q: 'Do you decline certain mandates?', a: 'Yes. Any request whose purpose or intended methods would be unlawful is declined. This requirement protects our clients as well as our teams.' },
  ],
};

export const HOME = {
  fr: {
    hero: {
      eyebrow: 'Genève · Investigations privées & intelligence corporate',
      title: 'Vos intérêts. Notre discrétion. Votre tranquillité.',
      text: 'Basée à Genève, RAINBOWNET accompagne particuliers, entreprises et professionnels dans leurs besoins d’investigation privée en Suisse et à travers l’Europe.',
      cta1: 'Demander une consultation confidentielle',
      cta2: 'Découvrir nos services',
      image: 'hero-geneva',
      alt: 'Vue du lac Léman et du Jet d’Eau à Genève, Suisse',
    },
    intro: {
      eyebrow: 'Le cabinet',
      title: 'Une approche suisse de l’investigation privée',
      text: [
        'RAINBOWNET est une agence d’investigation privée et d’intelligence corporate établie à Genève. Nous accompagnons des clients qui ont besoin de faits vérifiés, d’une compréhension claire d’une situation et d’une discrétion sans compromis.',
        'Notre travail repose sur une méthode documentée, une lecture stricte du cadre légal et une coordination internationale maîtrisée. Nous privilégions la précision à l’effet, la retenue à la visibilité.',
      ],
      link: 'En savoir plus sur le cabinet',
    },
    services: {
      eyebrow: 'Services',
      title: 'Des mandats structurés, selon votre position',
      text: 'Quatre domaines d’intervention, une même exigence de rigueur et de confidentialité.',
    },
    confidentiality: {
      eyebrow: 'Confidentialité',
      title: 'La discrétion n’est pas un argument commercial. C’est une méthode.',
      text: [
        'Chaque échange, chaque source et chaque document sont traités avec retenue. Les informations collectées sont limitées à ce qui est nécessaire au mandat, et l’accès aux dossiers est restreint.',
        'Nous ne publions ni clients, ni résultats, ni références. Votre dossier ne devient jamais un cas d’usage.',
      ],
      points: ['Échanges confidentiels dès le premier contact', 'Accès restreint aux dossiers', 'Collecte minimale et conservation maîtrisée', 'Restitution réservée à votre destination'],
      link: 'Notre engagement de confidentialité',
    },
    coverage: {
      eyebrow: 'Couverture européenne',
      title: 'Genève comme centre de coordination',
      text: 'Nous structurons des mandats transfrontaliers depuis Genève, en tenant compte de la réglementation propre à chaque juridiction. Une interlocution unique, une méthode constante.',
      link: 'Voir la couverture européenne',
    },
    approach: {
      eyebrow: 'Notre méthode',
      title: 'Un déroulement lisible, de la demande à la restitution',
      link: 'Comprendre notre méthode',
    },
    clients: {
      eyebrow: 'Clientèles',
      title: 'Des interlocuteurs différents, une même exigence',
      text: 'Nous adaptons le périmètre, le vocabulaire et la restitution à la nature de votre besoin — sans jamais transiger sur la méthode.',
    },
    faq: { eyebrow: 'Questions fréquentes', title: 'Ce que nos clients demandent avant de commencer' },
    cta: {
      title: 'Exposez-nous votre situation en toute confidentialité.',
      text: 'Un premier échange permet de vérifier la faisabilité, le cadre légal et la méthode adaptée. Aucun document sensible n’est requis à ce stade.',
      button: 'Demander une consultation confidentielle',
      secondary: 'Demander un rappel confidentiel',
    },
  },
  en: {
    hero: {
      eyebrow: 'Geneva · Private investigations & corporate intelligence',
      title: 'Your Interests. Our Discretion. Your Peace of Mind.',
      text: 'Based in Geneva, RAINBOWNET provides discreet private investigation services for individuals, businesses and professionals across Switzerland and Europe.',
      cta1: 'Request a confidential consultation',
      cta2: 'Explore our services',
      image: 'hero-geneva',
      alt: 'Lake Geneva and the Jet d’Eau in Geneva, Switzerland',
    },
    intro: {
      eyebrow: 'The firm',
      title: 'A Swiss approach to private investigation',
      text: [
        'RAINBOWNET is a private investigation and corporate intelligence firm based in Geneva. We support clients who need verified facts, a clear understanding of a situation and uncompromising discretion.',
        'Our work rests on a documented method, a strict reading of the legal framework and controlled international coordination. We favour precision over effect and restraint over visibility.',
      ],
      link: 'More about the firm',
    },
    services: {
      eyebrow: 'Services',
      title: 'Structured mandates, according to your position',
      text: 'Four areas of work, one standard of rigour and confidentiality.',
    },
    confidentiality: {
      eyebrow: 'Confidentiality',
      title: 'Discretion is not a sales argument. It is a method.',
      text: [
        'Every exchange, source and document is handled with restraint. Information collected is limited to what the mandate requires, and access to files is restricted.',
        'We publish no clients, no results and no references. Your matter never becomes a case study.',
      ],
      points: ['Confidential exchanges from the first contact', 'Restricted access to files', 'Minimal collection and controlled retention', 'Reporting reserved for you'],
      link: 'Our confidentiality commitment',
    },
    coverage: {
      eyebrow: 'European coverage',
      title: 'Geneva as the coordination hub',
      text: 'We structure cross-border mandates from Geneva, taking into account the regulations of each jurisdiction. One point of contact, one consistent method.',
      link: 'View European coverage',
    },
    approach: {
      eyebrow: 'Our approach',
      title: 'A clear process, from first request to final report',
      link: 'Understand our approach',
    },
    clients: {
      eyebrow: 'Clients',
      title: 'Different counterparts, one standard',
      text: 'We adapt scope, language and reporting to the nature of your need — without ever compromising on method.',
    },
    faq: { eyebrow: 'Frequently asked questions', title: 'What clients ask before starting' },
    cta: {
      title: 'Set out your situation in complete confidence.',
      text: 'A first conversation establishes feasibility, the legal framework and the right method. No sensitive document is required at this stage.',
      button: 'Request a confidential consultation',
      secondary: 'Request a confidential call back',
    },
  },
};
