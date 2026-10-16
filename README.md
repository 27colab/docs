# docs.27colab.com

Documentation hub for the 27 Colab open-source packages: `voice-engine`, `sms-consent`, `instagram-dm`, `email-kit`, `quickbooks-online-kit` and `fl-parcel-lookup`. Built with [Astro Starlight](https://starlight.astro.build) as a static site for Cloudflare Pages. Search (Pagefind), dark mode, sitemap and edit-on-GitHub links come from Starlight.

## Run locally

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/, also validates internal links
npm run preview    # serve dist/
```

Node 20.3 or newer (22 recommended).

## Layout

| Path | What |
|---|---|
| `src/content/docs/` | The pages (MDX). One page per package, the assembly guide, About |
| `samples/` | Every code sample shown on the site, typechecked against the packages; keyless ones are run and their output recorded in `samples/out/` |
| `src/components/` | `Architecture.astro` (the diagram, inline SVG) and the footer |
| `site.config.mjs` | Site title, URLs, the `portfolioUrl` TODO, the docs repo used for edit links |
| `wrangler.toml`, `public/_headers` | Cloudflare Pages config |
| `.github/workflows/ci.yml` | Build, link check, sample typecheck and run |

## Samples

Pages embed code from `samples/src/*.ts` and recorded output from `samples/out/*.txt`, so docs cannot drift from the packages without CI failing.

```sh
npm run samples:install     # links the six packages from ../<package> (build them first: npm run build in each)
npm run samples:typecheck
npm run samples:run         # runs keyless samples, rewrites samples/out/
```

After a package changes, re-run `samples:run` and commit the updated `samples/out/`.

## Deploying

See [DEPLOY.md](DEPLOY.md).

## License

MIT, see [LICENSE](LICENSE).
