# CLAUDE.md

This file gives Claude Code project-specific guidance for working in this repository.

## Project Overview

This is Alice's personal Jekyll static blog, based on `jekyll-theme-H2O` and customized with Chinese copy, personal pages, animated visual effects, tags, search, night mode, social links, and Netlify/GitHub Pages deployment config.

Primary content language is Chinese. Preserve the author's warm, personal, direct tone when editing posts or profile copy.

## Tech Stack

- Static site generator: Jekyll 4.x
- Ruby dependencies: `Gemfile`, `jekyll`, `jekyll-paginate`
- Frontend assets: plain HTML/Liquid, Sass, vanilla JavaScript, jQuery-style legacy scripts
- Asset pipeline: legacy Gulp 3 tasks for Sass/JS minification
- Deployment:
  - Netlify via `netlify.toml`
  - GitHub Pages via `.github/workflows/jekyll.yml`

## Important Directories

- `_posts/` — blog posts. File format: `YYYY-MM-DD-title.md`.
- `_layouts/` — page and post templates.
- `_includes/` — reusable Liquid partials.
- `dev/sass/` — source Sass files. Edit these for style changes.
- `dev/js/` — source JavaScript. Edit these for script changes.
- `assets/css/` — generated/minified CSS used by the site.
- `assets/js/` — generated/minified JavaScript used by the site.
- `_site/` — generated output. Do not edit by hand.
- `screenshot/` — theme screenshots used by README.

## Common Commands

Use Ruby/Jekyll for site generation:

```bash
bundle install
bundle exec jekyll serve
bundle exec jekyll build
```

The configured Netlify production build is:

```bash
bundle exec jekyll build
```

The GitHub Pages workflow builds with:

```bash
bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"
```

Legacy asset pipeline:

```bash
npm install
npx gulp
```

Note: the Gulp setup uses old dependencies (`gulp@3`, `gulp-sass@3`). Avoid upgrading or replacing the asset pipeline unless the user explicitly asks, because that can create compatibility churn.

## Content Conventions

New posts should live in `_posts/` and include front matter like:

```yaml
---
layout: post
title: '文章标题'
subtitle: '可选副标题'
date: YYYY-MM-DD
categories: 技术
tags: 标签1 标签2
---
```

Guidelines:

- Keep Chinese punctuation and phrasing natural.
- Preserve existing mixed Chinese/English technical style when editing old posts.
- Prefer practical, example-driven explanations for technical posts.
- Do not rewrite personal voice into generic marketing copy.
- Security-related posts may be educational, CTF, lab, or defensive context; do not add instructions for real-world abuse, persistence, evasion, credential theft, or unauthorized exploitation.

## Template and Styling Guidance

- Prefer semantic HTML in `_layouts`, `_includes`, and root pages.
- Keep Liquid expressions compatible with Jekyll/Kramdown.
- For CSS changes, edit `dev/sass/*.scss` first, then regenerate `assets/css/app.min.css` when the legacy Gulp pipeline is available.
- For JavaScript changes, edit `dev/js/index.js` first, then regenerate `assets/js/index.min.js` when needed.
- Avoid hand-editing generated minified assets unless the source pipeline cannot run and the change is intentionally small.
- Do not edit `_site/`; rebuild it instead.

## Validation Checklist

Before reporting changes complete:

1. Run `bundle exec jekyll build` when Ruby dependencies are available.
2. If frontend behavior or layout changed, run the site locally with `bundle exec jekyll serve` and inspect the affected page in a browser.
3. For visual changes, check desktop and mobile widths at minimum.
4. Confirm no changes were made only inside `_site/`.
5. Check `git status --short` so generated or unrelated files are not accidentally included.

## Deployment Notes

- Netlify publishes `_site` and sets `JEKYLL_ENV=production` with Ruby 3.1.
- GitHub Pages deploys from pushes to `master`.
- `CNAME` and `_config.yml` define the production domain behavior; do not change these casually.

## Git Hygiene

- The repository currently uses `master` as the main branch.
- Do not commit unless the user explicitly asks.
- Do not use destructive git commands without explicit user confirmation.
- Keep generated dependency or build artifacts out of commits unless they are intentionally part of the deployment workflow.
