// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import { siteConfig } from './site.config.mjs';

export default defineConfig({
  site: siteConfig.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: siteConfig.title,
      description: siteConfig.description,
      logo: { src: './src/assets/logo.svg', alt: '27 Colab' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: siteConfig.githubOrg }],
      editLink: {
        baseUrl: `https://github.com/${siteConfig.docsRepo}/edit/${siteConfig.docsBranch}/`,
      },
      lastUpdated: true,
      customCss: ['./src/styles/custom.css'],
      components: { Footer: './src/components/Footer.astro' },
      head: [
        { tag: 'meta', attrs: { property: 'og:site_name', content: siteConfig.title } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${siteConfig.url}/og.png` } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${siteConfig.url}/og.png` } },
        { tag: 'meta', attrs: { name: 'author', content: siteConfig.author } },
      ],
      sidebar: [
        { label: 'Start here', items: [{ slug: 'index' }, { slug: 'guides/choosing' }] },
        {
          label: 'Voice and messaging',
          items: [
            { slug: 'packages/voice-engine' },
            { slug: 'packages/sms-consent' },
            { slug: 'packages/instagram-dm' },
            { slug: 'packages/email-kit' },
          ],
        },
        { label: 'Assemble your own assistant', items: [{ slug: 'guides/assemble' }] },
        {
          label: 'Business integrations',
          items: [{ slug: 'integrations/quickbooks-online-kit' }, { slug: 'integrations/fl-parcel-lookup' }],
        },
        { label: 'About', items: [{ slug: 'about' }, { slug: 'guides/verified-samples' }] },
      ],
      plugins: [
        starlightLinksValidator({
          // Package repos are pushed separately; external links are checked in CI by lychee instead.
          errorOnRelativeLinks: false,
        }),
      ],
    }),
  ],
});
