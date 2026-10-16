# Deploying docs.27colab.com

Everything here is for Jesus to do by hand. Nothing has been pushed, created or deployed by the scaffolding.

## 0. Before the first deploy

1. **Push the six package repos** to `github.com/27colab/<name>` (they already have the remote configured): `voice-engine`, `sms-consent`, `instagram-dm`, `email-kit`, `quickbooks-online-kit`, `fl-parcel-lookup`. The docs link to them, and the CI `samples` job clones them.
2. **Publish them to npm** (or decide not to yet). The pages say `npm install @27colab/<name>`; until each package is published that command fails for readers. If you hold off, soften the install sections first.
3. **Create the docs repo.** The edit links assume `github.com/27colab/docs` (set in `site.config.mjs` as `docsRepo`). If you pick another name, change `docsRepo` there and in the CI/README references, then rebuild.

   ```sh
   cd /Users/jesusvasquez/Projects/open-source/oss-docs
   gh repo create 27colab/docs --public --source=. --remote=origin --push
   ```

   Review that the first commit's author identity is the one you want public (`git log -1 --format='%an <%ae>'`; fix with `git commit --amend --reset-author` before pushing if not).
4. **Fill the TODO** in `site.config.mjs`: `portfolioUrl: ''`. While empty, the footer and About page omit the portfolio link. Rebuild and redeploy after setting it.
5. Confirm the first CI run on GitHub is green (Actions tab). The `samples` job needs the package repos from step 1 to exist.

## 1. Create the Cloudflare Pages project

Choose one route.

### Route A: Git-connected (recommended; deploys on every push to `main`)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize the Cloudflare GitHub app for `27colab/docs` and select it.
3. Project name: **`docs-27colab`** (this gives `docs-27colab.pages.dev`; it must match `name` in `wrangler.toml`).
4. Production branch: `main`.
5. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave empty
6. Environment variables (production and preview): none are required. The Node version is read from `.node-version` (22). If the build image rejects it, add `NODE_VERSION` = `22`.
7. **Save and Deploy.** Open `https://docs-27colab.pages.dev` and check the home page, `/guides/assemble/` (the diagram), search (press `/`), and the dark-mode toggle.

### Route B: Direct upload from your machine

```sh
cd /Users/jesusvasquez/Projects/open-source/oss-docs
npm install
npx wrangler login
npx wrangler pages project create docs-27colab --production-branch main
npm run deploy        # builds, then: wrangler pages deploy dist --project-name docs-27colab
```

Route B does not redeploy on push; run `npm run deploy` each time.

## 2. Custom domain `docs.27colab.com`

1. Pages project `docs-27colab` → **Custom domains** → **Set up a custom domain** → enter `docs.27colab.com` → Continue.
2. Cloudflare shows the DNS record it needs:

   | Type | Name | Target | Proxy |
   |---|---|---|---|
   | `CNAME` | `docs` | `docs-27colab.pages.dev` | Proxied (orange cloud) |

   - **If `27colab.com` DNS is on Cloudflare** (same account): confirm; the record is created for you. Check DNS → Records for `docs`.
   - **If DNS is elsewhere** (registrar or another DNS host): add that exact `CNAME` there (`docs` → `docs-27colab.pages.dev`; for a registrar that wants a full name, `docs.27colab.com.`). Do not add an `A` record. Cloudflare validates the CNAME and issues the certificate automatically; the domain shows **Active** once it does (usually minutes, occasionally up to a few hours).
3. Verify:

   ```sh
   dig +short docs.27colab.com CNAME
   curl -sI https://docs.27colab.com/ | head -5
   curl -s https://docs.27colab.com/sitemap-index.xml | head
   ```

4. Optional: in Pages → Settings → Builds & deployments, disable **Preview deployments** if you do not want public `*.pages.dev` previews of branches.

## 3. After it is live

- Submit `https://docs.27colab.com/sitemap-index.xml` in Google Search Console (add `docs.27colab.com` as a property; the DNS TXT verification record goes in the same DNS zone as above).
- Add the docs link to each package README and to 27colab.com.
- The weekly CI schedule re-checks external links; fix or remove anything it reports.

## 4. Updating

- **Content:** edit `src/content/docs/**`, commit, push (Route A deploys itself).
- **After a package changes its API:** rebuild the package, run `npm run samples:install && npm run samples:typecheck && npm run samples:run` in this repo, fix any page the type errors point at, commit the refreshed `samples/out/`.
- **When packages are published to npm**, change the `file:` dependencies in `samples/package.json` to the published versions (pin exactly; 0.x minors can break) and drop the sibling checkouts from the `samples` CI job.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Build fails with a Node error | Pages used an old Node. Set `NODE_VERSION=22`. |
| Domain stuck on "Pending" | The `CNAME` is missing, mistyped, or has a conflicting `A`/`AAAA` record for `docs`. |
| CI `samples` job fails to clone | A package repo is not pushed yet or is private. |
| CI link check fails on the edit links | The docs repo name differs from `docsRepo` in `site.config.mjs`. |
| `samples/out` diff fails in CI | Run `npm run samples:run` locally and commit the result. |
