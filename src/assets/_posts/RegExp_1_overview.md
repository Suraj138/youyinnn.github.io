---
title: RegExp_1_overview
tags:
  - regular-expression
categories:
  - booknotes
  - Mastering Regular Expression
comments: true
date: 2017-11-17 00:00:56
series: 《Mastering Regular Expression(Third Edition)》
---

*自接触计算机编程以来，无数次碰到过这个名词“正则表达式”，刚开始肯定是不懂，但是听到“表达式”三个字就发现事情并不简单。*

<!-- more -->

第一次接触到它还是在我进NTJ2EE的招新机试的时候，机试题有一道题：“有一个字符串，其中包含中文字符、英文字符和数字字符，请统计和打印出各个字符的个数。”，当时只会用取字符对照ascii的方法来做这道题，然后正好学长看了我的做法，他说还有种东西叫做“正则表达式”，然后他给我打开了在线的JDK-1.6的API，找到了里面介绍正则表达式的页，然后还百度了一篇正则表达式的教程给我看（对，就是那个通篇斜杠写反的那盘），然后我就头皮发麻了。

在之后无论是正式学习还是运用到实际当中，我的处理都是：百度——ctrl+c——ctrl+v，然后下次碰到另一个字符串处理问题的时候还是这样做，毫无意义，甚至还不能完全匹配我的应用场景。然后这次的工程中心项目，我负责写前端，对输入框需要用到字符串过滤的需求，就这么简单的一个功能我都实现不了，感觉非常丢人，我不想再复制粘贴了，所以开始以blog的形式记录我学习`regular-expression`的过程。

**所有笔记的学习都基于：《Mastering Regular Expression(Third Edition)》——Jeffrey E. F. Friedl一书的中文版**

- - -

### 释义与场景

#### 释义
首先我们来看看`Regular Expression`这两个单词

Regular：
> *adj.* 定期的；有规律的；合格的；整齐的；普通的
>
> *n.* 常客；正式队员；中坚分子
>
> *adv.* 定期地；经常地

Expression：
> *n.* 表现，表示，表达；表情，脸色，态度，强调，声调；式，符号；语句，措辞，说法

毫无疑问，在编程领域里面`Regular Expression`的含义肯定不会是“整齐的脸色”或者“中坚分子措辞”这样的翻译了，从字面意义上去翻译的话应该是“有规律的表达式”，因为起码听上去像个数学公式，和计算机有点关联- -。这可比“正则表达式”这样的翻译明了多了，但是后者更有逼格一点。

#### 场景

搞清楚公式的定义，那么接下来我们就可以开始解题了:smile:。

我们为什么会用到正则表达式？需求源于我们需要在一大段不规则的文本中找出是否含有符合我们规律的表达式的句子，这就叫做使用正则表达式去匹配我们的文本。比如一般editor所具有的find功能，就是一种文本匹配功能。

但是在我们写程序的过程中，你的程序代码是不可能给一个find按钮给你去匹配文本的，而且你可能会需要更复杂的文本匹配功能，比如说“匹配所有xxx-xxxxxxxxxxx这种格式的手机号码”这样的精准匹配就需要你构建表述清晰的正则表达式去完成匹配功能。

一旦你精准的find到你想要匹配的子文本之后，你想干嘛都行，提取、删除、替换、添加等等。这就是正则表达式的应用场景。

- - -