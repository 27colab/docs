// Single place for values Jesus may want to change. Imported by astro.config.mjs and src/components/Footer.astro.
export const siteConfig = {
  title: '27 Colab Open Source',
  url: 'https://docs.27colab.com',
  description:
    'Documentation for small, tested TypeScript reference implementations: voice-engine, sms-consent, instagram-dm, email-kit, quickbooks-online-kit and fl-parcel-lookup.',
  author: 'Jesus Vasquez',
  company: '27 Colab',
  companyUrl: 'https://27colab.com',
  // TODO(jesus): set to your portfolio URL. While empty, the footer and About page omit the link.
  portfolioUrl: '',
  githubOrg: 'https://github.com/27colab',
  // Repo that holds THIS site; drives the "Edit page" links. TODO(jesus): confirm the repo name when you create it.
  docsRepo: '27colab/docs',
  docsBranch: 'main',
};
