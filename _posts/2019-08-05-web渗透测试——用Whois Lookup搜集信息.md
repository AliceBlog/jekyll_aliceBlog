---
layout: post
title: 'web渗透测试——搜集信息'
subtitle: 'Whois Lookup、Netcraft Site Report搜集信息'
date: 2019-08-05
categories: 技术
tags: 网络安全 渗透测试
---
## 信息搜集方法
1、 IP地址

2、 域名信息

3、 技术使用

4、 在同一台服务器上的其他网站

5、 DNS记录

6、 未列出的文件、子域、目录

## 信息搜集的工具
1、 [Whois Lookup](http://whois.domaintools.com)-查找网站所有者的信息
    比如服务器、IP地址、domain（检索信息）

2、 [Netcraft Site Report](https://toolbar.netcraft.com/site_report?url=) 显示了目标网站上使用的技术

3、[Robtex DNS](https://www.robtex.com/)显示关于目标网站的全面的DNS信息
![](https://blog.res.witdor.com/article/shareDns1_1.png)

## Robtex DNS的sharing IP numbers
- 一个服务器上可以服务多个网站
- 获得一个站点的权限可以帮助获得另一个站点的权限
- 有一些目标网站很安全，但是服务器并不安全

sharing IP numbers指的是这些网站指向同一个IP，如果攻破这些网站，对目标网站的攻击也是有帮助的

## 子域
Subdomain.target.com的形式,扫描到一些admin.xxx或者cms.xxx可能就是内部的登录系统
- 例如：beta.facebook.com

Knock可以用来找到目标的子域
```bash
git clone https://github.com/guelfoweb/knock.git
cd knock/knockpy
python knock.py xxxx.com(xxx.com为目标网站域名)
```

## 搜集文件+目录
在目标网站找文件和目录
- 比如扫描metasploitable上的mutillidae中的目录，可以发现有robots.txt文件（包含不愿被浏览器发现的文件的配置文件），打开robots.txt可以看到password文件夹，进入后能看到一些账号密码的信息，还有config.inc，打开后是数据库的链接信息
用工具dirb
```bash
dirb [target] [wordlist] [opitions]
```
- dirb http://10.0.2.4/mutillidae/(默认的WORDLIST_FILES: /usr/share/dirb/wordlists/common.txt)
- dirb http://10.0.2.4/mutillidae/ /root/wordlist.txt（指定）

运行
```bash
man dirb
```
