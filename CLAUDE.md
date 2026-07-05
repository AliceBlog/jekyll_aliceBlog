# CLAUDE.md

This file gives Claude Code project-specific guidance for working in this repository.

## Project Overview

This is Alice's personal Hugo static blog. It was migrated from the original Jekyll / `jekyll-theme-H2O` site while preserving Chinese copy, personal pages, animated visual effects, tags, search, night mode, social links, and Netlify/GitHub Pages deployment config.

Primary content language is Chinese. Preserve the author's warm, personal, direct tone when editing posts or profile copy.

## Tech Stack

- Static site generator: Hugo 0.92.1 extended
- Markdown renderer: Goldmark
- Frontend assets: Hugo templates, static assets, vanilla JavaScript, legacy jQuery-style scripts
- Compatibility script: `scripts/hugo-page-compat.js` copies `/page/N/` output to old `/pageN/` paths
- Deployment:
  - Netlify via `netlify.toml`
  - GitHub Pages via `.github/workflows/hugo.yml`

## Important Directories

- `content/posts/` — Hugo blog posts. File format: `YYYY-MM-DD-title.md`.
- `content/aboutme.md`, `content/tags.md`, `content/_index.md` — top-level Hugo content pages.
- `layouts/` — Hugo templates and partials.
- `static/` — static files copied directly to `public/`.
- `scripts/hugo-page-compat.js` — compatibility step for legacy pagination URLs.
- `public/` — Hugo generated output. Do not edit by hand.

## Common Commands

Use Hugo for site generation:

```bash
hugo server
hugo --gc --minify && node scripts/hugo-page-compat.js
```

The configured Netlify production build is:

```bash
hugo --gc --minify && node scripts/hugo-page-compat.js
```

The GitHub Pages workflow installs Hugo 0.92.1 extended and Node 20, then builds with:

```bash
hugo --gc --minify --baseURL "${{ steps.pages.outputs.base_url }}/" && node scripts/hugo-page-compat.js
```

Legacy Jekyll/Gulp files have been removed from this branch. Keep new work in the Hugo structure.

## Content Conventions

New posts should live in `content/posts/` and include front matter like:

```yaml
---
title: '文章标题'
subtitle: '可选副标题'
date: YYYY-MM-DD
categories: ['技术']
tags: ['标签1', '标签2']
---
```

Guidelines:

- Keep Chinese punctuation and phrasing natural.
- Preserve existing mixed Chinese/English technical style when editing old posts.
- Prefer practical, example-driven explanations for technical posts.
- Do not rewrite personal voice into generic marketing copy.
- Security-related posts may be educational, CTF, lab, or defensive context; do not add instructions for real-world abuse, persistence, evasion, credential theft, or unauthorized exploitation.

## Template and Styling Guidance

- Prefer semantic HTML in `layouts/` templates and partials.
- Keep template expressions compatible with Hugo 0.92.1.
- Static CSS/JS currently lives under `static/assets/` for Hugo output.
- Avoid hand-editing generated output in `public/`.
- Do not edit `public/`; rebuild instead.

## Validation Checklist

Before reporting changes complete:

1. Run `hugo --gc --minify && node scripts/hugo-page-compat.js`.
2. If frontend behavior or layout changed, run `hugo server` and inspect the affected page in a browser.
3. For visual changes, check desktop and mobile widths at minimum.
4. Confirm no changes were made only inside `public/`.
5. Check `git status --short` so generated or unrelated files are not accidentally included.

## Deployment Notes

- Netlify publishes `public/` and sets `HUGO_VERSION=0.92.1`, `HUGO_ENV=production`, and `NODE_VERSION=20`.
- GitHub Pages deploys from pushes to `master` via `.github/workflows/hugo.yml`.
- `static/CNAME` and `config.yaml` define the production domain behavior; do not change these casually.

## Git Hygiene

- The repository currently uses `master` as the main branch.
- Do not commit unless the user explicitly asks.
- Do not use destructive git commands without explicit user confirmation.
- Keep generated dependency or build artifacts out of commits unless they are intentionally part of the deployment workflow.
