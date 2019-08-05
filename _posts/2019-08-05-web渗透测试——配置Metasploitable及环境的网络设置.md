---
layout: post
title: 'web渗透测试——配置Metasploitable及环境的网络设置'
subtitle: '配置Metasploitable及环境的网络设置'
date: 2019-08-05
categories: 技术
tags: 网络安全 渗透测试 环境搭建
---
## VirtualBox网络设置
### 添加一个网络
选中VirtualBox => 偏好设置
![](https://blog.res.witdor.com/article/kali3_1.png)
### 将所有的虚拟机每个都设置到添加的网络中
![](https://blog.res.witdor.com/article/kali3_2.png)
### 查看Metasploitable的IP地址
```bash
ifconfig
```
### 在Kali Linux中访问Metasploitable的IP的IP
浏览器打开Metasploitable的IP
![](https://blog.res.witdor.com/article/network1_1.png)
网也上面的列表是Metasploitable的服务器

### 修复Metasploitable的Mutillhadae网站
nano是编辑配置文件的程序
```bash
sudo nano /var/www/mutillidae/config.inc
```
修改
```bash
$dbname="owasp10"
```
修改完成后ctrl+x退出，然后Y保存