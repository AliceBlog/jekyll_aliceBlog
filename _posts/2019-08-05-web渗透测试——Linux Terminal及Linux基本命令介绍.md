---
layout: post
title: 'web渗透测试——初探Linux Terminal及Linux基本命令介绍'
subtitle: 'Linux Terminal及Linux基本命令'
date: 2019-08-05
categories: 技术
tags: 网络安全 渗透测试
---
## 了解Linux Terminal
![](https://blog.res.witdor.com/article/kali2_1.png)

### ls：列出当前目录下的所有的文件和目录和windows中的dir类似
```bash
root@kali:~# ls是lie
```
输出
```bash
Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos
```
### man ls:列出ls的帮助信息，Q退出文档
```bash
root@kali:~# man ls
```
输出：
```bash
LS(1)                                                                    User Commands                                                                    LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List information about the FILEs (the current directory by default).  Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

       Mandatory arguments to long options are mandatory for short options too.

       -a, --all
              do not ignore entries starting with .

       -A, --almost-all
              do not list implied . and ..

       --author
              with -l, print the author of each file

       -b, --escape
              print C-style escapes for nongraphic characters

       --block-size=SIZE
              with -l, scale sizes by SIZE when printing them; e.g., '--block-size=M'; see SIZE format below

       -B, --ignore-backups
              do not list implied entries ending with ~

       -c     with  -lt: sort by, and show, ctime (time of last modification of file status information); with -l: show ctime and sort by name; otherwise: sort
              by ctime, newest first

       -C     list entries by columns
 Manual page ls(1) line 1 (press h for help or q to quit)

```

### 尝试下 -l：use a long listing format（列出了更多的文件信息）
```bash
root@kali:~# ls -l
```
输出
```bahs 
total 32 //总数
//权限        所有者 所属组    最后修改日期   文件名
drwxr-xr-x 2 root root 4096 May 17 09:07 Desktop
drwxr-xr-x 2 root root 4096 May 17 09:07 Documents
drwxr-xr-x 2 root root 4096 May 17 09:07 Downloads
drwxr-xr-x 2 root root 4096 May 17 09:07 Music
drwxr-xr-x 2 root root 4096 May 17 09:07 Pictures
drwxr-xr-x 2 root root 4096 May 17 09:07 Public
drwxr-xr-x 2 root root 4096 May 17 09:07 Templates
drwxr-xr-x 2 root root 4096 May 17 09:07 Videos

```
尝试一下 --help 帮助文档
```bash
root@kali:~# ls --help
```
输出
```bash
Usage: ls [OPTION]... [FILE]...
List information about the FILEs (the current directory by default).
Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

Mandatory arguments to long options are mandatory for short options too.
  -a, --all                  do not ignore entries starting with .
  -A, --almost-all           do not list implied . and ..
      --author               with -l, print the author of each file
  -b, --escape               print C-style escapes for nongraphic characters
      --block-size=SIZE      with -l, scale sizes by SIZE when printing them;
                               e.g., '--block-size=M'; see SIZE format below
  -B, --ignore-backups       do not list implied entries ending with ~
  -c                         with -lt: sort by, and show, ctime (time of last
                               modification of file status information);
                               with -l: show ctime and sort by name;
                               otherwise: sort by ctime, newest first
  -C                         list entries by columns
      --color[=WHEN]         colorize the output; WHEN can be 'always' (default
                               if omitted), 'auto', or 'never'; more info below
  -d, --directory            list directories themselves, not their contents
  -D, --dired                generate output designed for Emacs' dired mode
  -f                         do not sort, enable -aU, disable -ls --color
  -F, --classify             append indicator (one of */=>@|) to entries
      --file-type            likewise, except do not append '*'
      --format=WORD          across -x, commas -m, horizontal -x, long -l,
                               single-column -1, verbose -l, vertical -C
      --full-time            like -l --time-style=full-iso
  -g                         like -l, but do not list owner
      --group-directories-first
                             group directories before files;
                               can be augmented with a --sort option, but any
                               use of --sort=none (-U) disables grouping
  -G, --no-group             in a long listing, don't print group names
·
·
·
```

（注：按键盘的上或者下键，可以查看之前使用的命令，tab键可以联想文件名）

### 试试 cd 进入文件目录
```bash
root@kali:~# cd test/
```
输出
```bash
root@kali:~/test# 
```

### pwd显示当前工作的目录
```bash
root@kali:~/test# pwd
/root/test
```

### cd ..返回上一层目录
```bash
root@kali:~/test# cd ..
root@kali:~# 
``` 

### clear清空屏幕上的所有信息
```bash
root@kali:~# clear
``` 