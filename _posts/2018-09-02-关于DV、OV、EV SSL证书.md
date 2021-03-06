---
layout: post
title: '关于DV、OV、EV SSL证书'
subtitle: 'SSL证书的介绍和选择'
date: 2019-08-02
categories: 技术
tags: 网络安全 SSL
---
## DV型和OV型证书的区别

DV和OV型证书最大的差别是：DV型证书不包含企业名称信息；而OV型证书包含企业名称信息，以下是两者差别对比表：

 | DV |  OV  
-|-|-
包含企业名称信息 | 否 | 是 |
验证公司名称合法性 | 否 | 是 |
通过第三方查询电话验证 | 否 | 是 |
域名验证方式 | 管理员邮箱批准 | 查询whois信息是否一致
验证时间 | 最快10分钟签发 | 一般2-3天完成签发
证书可信度 | 低 | 较高

## OV型和EV型证书的区别

 OV型和EV型证书，都包含了企业名称等信息，但EV证书因为其采用了更加严格的认证标准，浏览器对EV证书更加“信任”，当浏览器访问到EV证书时，可以在地址栏显示出公司名称，并将地址栏变成绿色。
![](https://blog.res.witdor.com/article/aboutssl.png)

## 如何挑选适合我的证书类型
### DV型证书
- 仅需要通过在线加密实现数据安全
- 主要用于电子邮件、IM，CDN加速等
- 用户内部的OA，CRM，VPN系统
- 还是一个初创公司，业务刚刚起步。

### OV型证书
- 面向公众提供服务
- 有用户账户登录，在线应用等
- 有多个应用需求，多个域名需要部署
- 公司已经拥有一定的规模

### EV型证书
- 需要实现在线交易，在线支付功能
- 有高价值的数据保密需求
- 需要防止可能遇到的钓鱼网站攻击
- 属于大型企业或者金融机构

## 三种证书的申请区别
一.域名型SSL证书（DVSSL）：

在线申请地址：https://ssl.22.cn

　　这种证书属于最初级的证书，仅仅需要验证一下域名管理权限便可申请（这个很好理解，只有拥有对某域名的管理权限才能为该域名申请证书）。

验证方式：

　　每一个域名在注册的时候均填写了一个管理员邮箱，这个邮箱通常情况下是可以公开查询到的（除非您设置了whois 信息保护），我们在验证您是否对域名拥有管理权限的时候会向这个管理员邮箱发一封邮件，您需要登陆该邮箱点击确认连接完成验证。

但偶尔会有这几种情况：

1、whois信息设置了隐私保护，我们无法读取该域名的管理员邮箱，则需要您暂停隐私保护，直至完成证书颁发；

2、whois信息木有设置隐私保护，但whois信息中查询到的管理员邮箱无法登陆或者不方便登陆，则您可以在管理域名的地方将邮箱修改为您可以登录的邮箱，我们向新的邮箱发送验证邮件；

3、whois信息中的邮箱无法登陆，而且也不能去修改这个邮箱，则您需要提供前缀为admin、administrator、postmaster、webmaster 的邮箱来完成管理权限的验证；

4、当以上方式您都无法满足时，请和我们联系寻找其他的验证方式。例如我们还可以提供CNAME 解析、验证文本等方式来实现域名管理权限的验证。

二.企业型SSL证书（OVSSL）：

在线申请地址：https://ssl.22.cn

 　　这类证书需要验证企业的真实性和域名的管理权限。

 域名管理权限验证方式： 

1、如果域名注册信息（whois信息）中，域名所有者的名称和您申请证书时公司名称一致，通常无需做任何操作； 

2、如果您申请证书的域名所有者信息并不是您申请证书的公司名称时则您需要用以上域名型SSL证书中邮件验证的方式来验证您的域名管理权限。

企业真实性验证方式：

1、在工商网站上可以查询到贵公司的注册信息； 

2、在电话平台114上，或者其他平台，例如邓白氏、百度地图等可以查询到贵公司登记的电话，并且这个电话申请证书的工作人员能够接听到；

3、如果以上第2项不能满足，则需要律师出具一份律师证明文件证明公司信息的真实性；

 

三。增强型SSL证书（EVSSL）

申请地址：https://ssl.22.cn

　　需要验证域名管理权限和企业真实性（这两项验证方式同以上企业型SSL证书的验证方式一样）

　　另外，申请增强型SSL证书的企业需要提供银行的开户许可证商的开户行名称。

