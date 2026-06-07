# Alice Blog

Alice 的个人静态博客，用来记录技术学习、生活思考和个人创作。

线上地址：[https://alice.vdo.pub/](https://alice.vdo.pub/)

## 项目简介

本项目基于 Jekyll 和 `jekyll-theme-H2O` 定制，保留了轻量、响应式、标签归档、文章搜索、代码高亮、夜间模式等能力，并加入了 Alice 自己的站点信息、个人简介、社交链接和视觉动画。

博客当前主要内容为中文，文章主题包含：

- 前端开发与 Node.js 学习笔记
- Jekyll 博客搭建与部署记录
- Web 安全与渗透测试学习笔记
- 区块链、Truffle、DApp 等技术实践
- 个人介绍与生活记录

## 技术栈

- 静态站点生成：Jekyll 4.x
- Markdown 渲染：Kramdown + GFM
- 代码高亮：Rouge / Prism.js
- 分页插件：jekyll-paginate
- 样式开发：Sass
- 前端脚本：Vanilla JavaScript
- 资源构建：Gulp 3
- 部署平台：Netlify / GitHub Pages

## 目录结构

```text
.
├── _config.yml              # Jekyll 站点配置
├── _includes/               # 页面公共片段
├── _layouts/                # 页面布局模板
├── _posts/                  # 博客文章
├── assets/                  # 线上使用的 CSS、JS、图片、字体和图标
├── dev/                     # Sass 和 JS 源码
├── screenshot/              # README 和主题截图资源
├── index.html               # 首页
├── aboutme.html             # 关于我页面
├── tags.html                # 标签页
├── search.json              # 搜索索引模板
├── netlify.toml             # Netlify 构建配置
├── Gemfile                  # Ruby / Jekyll 依赖
├── gulpfile.js              # 旧版前端资源构建脚本
└── CLAUDE.md                # Claude Code 项目协作说明
```

注意：`_site/` 是 Jekyll 生成目录，不要手动修改。

## 本地开发

### 安装 Ruby 依赖

```bash
bundle install
```

### 启动本地预览

```bash
bundle exec jekyll serve
```

默认访问：`http://127.0.0.1:4000/`

### 构建静态站点

```bash
bundle exec jekyll build
```

构建结果会输出到 `_site/`。

## 前端资源构建

样式和脚本源码位于 `dev/`：

- `dev/sass/`：Sass 源码
- `dev/js/`：JavaScript 源码

生成后的线上资源位于：

- `assets/css/`
- `assets/js/`

旧版构建命令：

```bash
npm install
npx gulp
```

说明：当前 Gulp 依赖较旧，包含 `gulp@3` 和 `gulp-sass@3`。除非确实要升级构建链，否则优先保持现有方式，避免引入不必要的兼容性问题。

## 写一篇新文章

文章放在 `_posts/` 目录，文件名格式为：

```text
YYYY-MM-DD-文章标题.md
```

示例：

```markdown
---
layout: post
title: '文章标题'
subtitle: '可选副标题'
date: 2026-06-07
categories: 技术
tags: Jekyll 博客 前端
---

这里开始写正文。
```

常用字段：

| 字段 | 说明 |
| --- | --- |
| `layout` | 通常使用 `post` |
| `title` | 文章标题 |
| `subtitle` | 文章副标题，可选 |
| `date` | 发布时间 |
| `categories` | 分类 |
| `tags` | 标签，多个标签用空格分隔 |
| `cover` | 文章封面图，可选 |

## 站点配置

主要配置集中在 `_config.yml`：

```yaml
title: 'Alice Blog'
description: '很高兴能在这里与你分享我对技术和生活的思考。'
url: 'https://alice.vdo.pub'
baseurl: ''
```

导航配置：

```yaml
nav:
  主页: '/'
  分类: '/tags.html'
  关于我: '/aboutme.html'
```

作者信息：

```yaml
author: 'Alice'
nickname: '竹'
bio: '热爱技术，简单乐观爱创造'
avatar: '/assets/img/alicesmall.jpg'
```

## 已启用功能

- 首页文章分页
- 标签归档
- 文章搜索
- 代码高亮
- 夜间模式
- 社交分享
- 社交链接
- 响应式布局
- 自定义头图底纹
- 首页和文章页动画效果

## 部署

### Netlify

`netlify.toml` 中配置了构建命令和发布目录：

```toml
[build]
  command = "bundle exec jekyll build"
  publish = "_site"
```

生产环境变量：

```toml
[build.environment]
  RUBY_VERSION = "3.1"
  JEKYLL_ENV = "production"
```

### GitHub Pages

`.github/workflows/jekyll.yml` 会在 `master` 分支 push 后自动构建并部署。

## 维护建议

- 修改文章：优先编辑 `_posts/`。
- 修改页面结构：编辑 `_layouts/` 或 `_includes/`。
- 修改样式：优先编辑 `dev/sass/`，再生成 `assets/css/`。
- 修改脚本：优先编辑 `dev/js/`，再生成 `assets/js/`。
- 不要直接编辑 `_site/`，它会在下一次构建时被覆盖。
- 提交前建议运行 `bundle exec jekyll build` 确认站点可以正常生成。

## 原主题说明

本博客基于 [jekyll-theme-H2O](https://github.com/kaeyleo/jekyll-theme-H2O) 定制。

原主题特性包括代码高亮、夜间模式、Disqus 评论、主题色、头图底纹、响应式设计、社交图标、SEO 标题优化、标签系统和搜索等。

## License

原主题 `jekyll-theme-H2O` 使用 MIT License。当前博客内容版权归作者 Alice 所有。