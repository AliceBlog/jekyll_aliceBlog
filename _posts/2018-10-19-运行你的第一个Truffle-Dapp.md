---
layout: post
title: '运行你的第一个Truffle-Dapp'
subtitle: '开发DAPP需要用到一些工具，这些工具会帮助我们更好的开发出自己想要的DAPP。'
date: 2018-08-02
categories: 技术
cover: 'http://blog.res.witdor.com/cover/blog_20181019_1.jpg'
tags: 技术 Truffle Node
---
### 操作系统：macOS

### 安装node.js
安装node后查看node版本号，打开终端，输入命令：
```bash
node -v 
```
```bash
npm -v
```
### 安装 Truffle
Truffle是针对基于以太坊的Solidity语言的一套开发框架。本身基于Javascript。

* 官方文档：http://truffleframework.com/docs/

安装命令：
```bash
sudo npm install -g truffle
```

### 创建一个项目
```bash
$ mkdir dapp
```
```bash
$ cd dapp
```
```bash
$ truffle unbox webpack
```
