---
title: MySQL InnoDB锁概述
categories:
  - db
  - mysql
  - lock
tags:
  - mysql-lock
series: 《MySQL技术内幕：InnoDB存储引擎》笔记
date: 2020-6-17 10:8:55
---

### 概述

本篇主要介绍 InnoDB 中的锁，以及它与隔离级别之间的关系。从锁的算法、锁的等级、锁解决的问题来为 MySQL 的 InnoDB 锁做一个概述

我们能够轻易地想到，对数据库的数据进行操作的时候，为了保证数据一致性和持久性，我们会对这些操作上锁，但数据库中并不只有这些情况会上锁，其他地方也会有锁，比如缓冲池中页的增删改查的时候

而不同引擎、不同数据库对锁的实现和支持都是不一样的，比如 MyISAM 只支持表锁，在并发情况下的随机写操作性能就会差点，除非是插入到数据页的底部，那稍微并发性能高点

而 InnoDB 的并发效率会好很多，它提供了非锁定读，行锁等锁粒度细的支持

### InnoDB 中的锁

#### 表锁与行锁

InnoDB 支持行级的读写锁：

- 共享锁（S Lock）：允许事务读取一行数据；
- 排他锁（X Lock）：允许事务删除或更新一行数据；

而 InnoDB 是支持**多粒度锁定**的，即这种机制允许事务同时持有行锁和表锁，为了实现这个机制，引擎提供了一种叫意向锁的锁，我们把库、表、页、行想象成一棵自顶向下的树，我们若要对某行上**写锁 X Lock**，那我们就得先对其所属的库、表、页处也上**写意向锁 IX Lock**，最后再对该行上**X Lock**

在有意向锁的行为下，加入一个事务要对行上**写锁 X Lock**，但这时候该行所属的表上有**读意向锁 IS Lock**，那么事务需要等待表上的读意向锁释放之后，才能再加上读意向锁

于是我们发现，意向锁就是 InnoDB 的**表级锁**，也是读写锁的形式：

- 意向共享锁（IS Lock）：事务要获取一张表中某几行的共享锁；
- 意向排他锁（IX Lock）：事务要获取一张表中某几行的排他锁；

行锁表锁之间的兼容性：

|     |             IS             |             IX             |             S              |             X              |
| :-: | :------------------------: | :------------------------: | :------------------------: | :------------------------: |
| IS  |     :heavy_check_mark:     |     :heavy_check_mark:     |     :heavy_check_mark:     |  :heavy_multiplication_x:  |
| IX  |     :heavy_check_mark:     |     :heavy_check_mark:     | ​:heavy_multiplication_x:​ | ​:heavy_multiplication_x:​ |
|  S  |     :heavy_check_mark:     | ​:heavy_multiplication_x:​ |     :heavy_check_mark:     | ​:heavy_multiplication_x:​ |
|  X  | ​:heavy_multiplication_x:​ | ​:heavy_multiplication_x:​ | ​:heavy_multiplication_x:​ | ​:heavy_multiplication_x:​ |

#### 一致性非锁定读

在理论模型中，读锁会在写锁被持有的时候阻塞而写锁会在读锁被持有的时候阻塞，但是为了提高并发效率，InnoDB 还是实现了**MVCC**的机制来规避读写互斥带来的的并发性能下将：**通过恒读取数据之前的版本来避免阻塞**

在上篇[《MySQL InnoDB 事务概述》](./tx6g0p.html)里说到，事务过程中的 undo 会提供**_MVCC_**支持，而且在默认的隔离级别下也会有这个特性，在读取数据的时候会读取快照而不会因为写锁被占用而阻塞

#### 一致性锁定读

虽然有了 MVCC 让我们在读取上不会阻塞，但我们有时候还是想强制使用理论模型的标准来强制读写互斥，这时候可以**显式地（强制地）**对读取操作加锁而保证逻辑一致性

InnoDB 支持以下两种加锁：

- `select ... for update`

  对读取的行记录加一个 X 锁，其他事务不能对该行上任何锁；

- `select ... lock in share mode`

  对读取的行记录加一个 S 锁，而其他读事务可以执行，其他写事务阻塞；

### InnoDB 行锁算法

InnoDB 有 3 种行锁算法：

- **Record Lock**：锁单行；
- **Gap Lock**：间隙锁，锁一个范围，但是不包括记录本身；
- **Next-Key Lock**：Gap Lock + Record Lock，锁记录本身的同时还锁一个范围；而且这个锁是根据索引记录来执行的，如果表没有设置任何的索引，那么引擎会使用隐式的主键来进行锁定；

在隔离级别为**READ COMMITTED**下，仅采用**_Record Lock_**算法；

而在隔离级别为**REPEATABLE READ**下，InnoDB 对于行的查询都使用的是**_Next-Key Lock_**算法，假如一个索引有 10，11，13，20 四个值，那么 Next-Key Lock 可能会锁住：`(-∞, 10]`，`(10, 11]`，`(11, 13]`，`(13, 20]`，`(20, +∞)`等区间；这种技术被称为**Next-Key Locking**，

对应的，还会有**Previous-Key Locking**，其对应会锁住的区间为`(-∞, 10)`，`[10, 11)`，`[11, 13)`，`[13, 20)`，`[20, +∞)`

#### 锁降级

虽然对于所有查询，使用的都是范围锁，但当查询索引含有**唯一索引**的时候，范围锁会**降级**为 Record Lock，只锁住单行，比如有数据：

```sql
create table t ( a int primary key );
insert into t select 1;
insert into t select 2;
insert into t select 5;
```

再执行：

| 时间 |                  会话 A                  |            会话 B             |
| :--: | :--------------------------------------: | :---------------------------: |
|  1   |                  begin;                  |                               |
|  2   | select \* from t where a = 5 for update; |                               |
|  3   |                                          |            begin;             |
|  4   |                                          |    insert into t select 4;    |
|  5   |                                          | commit; #直接成功而不需要等待 |
|  6   |                 commit;                  |                               |

我们看到，虽然再会话 A 我们请求了一个 X 锁，但是索引是等等值的 5，于是它锁**降级**，它只会锁住这一行记录，所以会话 B 的插入等值 4 这一操作不会被阻塞；

但是，如果是非唯一索引，比如辅助索引，那么就不会发生降级，比如有

```sql
create table t ( a int , b int, primary key(a), key(b) );
insert into t select 1,1;
insert into t select 3,1;
insert into t select 5,3;
insert into t select 7,6;
insert into t select 10,8;
```

对于查询：

```sql
select * from t where b = 3 for update;
```

上述要使用列 b 进行索引，但因为有两个索引，索引需要分别进行锁定；

- 对于聚集索引，仅对于列`a=5`的索引加上 Record Lock，锁降级；
- 对于辅助索引，应用的是 Next-Key Lock，锁住键值区间`(1, 3)`和`(3, 6)`；

#### 锁升级

锁升级是指将**当前锁的粒度降低**，比如可以把一个表的 1000 个行锁升级为一个页锁，或者页锁升级为表锁，这在各个数据库或者引擎里都有实现

但是**InnoDB 并不实现这一特性**，因为它不是通过记录本身去产生行锁的，而是采用**位图**的方式，对**每个事务**访问的**每个页**进行锁管理，因此：一个事务不管是锁住页中的**一个记录**还是**多个记录**，其开销通常都是**一样的**；

#### 行锁的细节

留心以下就能发现，其实 InnoDB 的行锁是完全依赖域索引的，所以 InnoDB 的这一行锁特点意味着：**只有通过"索引条件"去检索数据，InnoDB 才使用行级锁，否则引擎会使用表锁！**

这一特点可以回答*“InnoDB 什么时候用表锁什么时候用行锁呢？”*这个问题

### 锁相关问题与解决

#### Phantom Problem（幻读问题）

在默认隔离级别下，InnoDB 使用 Next-Key Locking 机制来避免幻读，之前提到过很多幻读这一词，幻读的真正定义如下：

> **Phantom Problem 是指在同一事务下，连续执行两次同样的 SQL 可能会导致不同的结果，第二次的 SQL 可能会返回之前不存在的行。**

#### Dirty Read（脏读问题）

脏数据是指事物对缓冲页的数据进行修改，但是还没有被提交，所以我们并不希望脏数据能够被读取到

脏读一般已经很少发生了，除非你非要把隔离级别设置为**READ UNCOMMITTED**

#### Nonrepeatable Read（不可重复读）

指一个事务内多次读取同一数据集合，在事务还没有结束的时候，另一个事务对该数据集合进行了更新，因此在第一个事务执行过程中的两次读取之间造成数据差异

该问题和脏读的区别是，脏读是读到了未提交的数据，不可重复度是读到了已提交的数据，都违反了数据库事务的**一致性**要求

某种程度上说，**不可重复读也是幻读问题**，这在 MySQL 官方文档中明确了这一点，它也能够通过**_Next-Key Lock_**算法来避免这一问题

> 上篇里有提到过，MVCC 也是用来解决不可重复读和幻读问题，而这里的**_Next-Key Lock_**算法也是用来解决这个的，到底是谁来解决问题的呢？答案其实很简单，就是看你语句本身请不请求锁的问题：
>
> - 在查询**加**`for update`时，会用**_Next-Key Lock_**解决幻读问题，新的 insert 和 update 会阻塞；
> - 在查询**不加**`for update`时，会用**_MVCC_**解决幻读问题，新的 insert 和 update 不会阻塞；

#### Dead Lock（死锁）

事务在等待锁的时候会造成阻塞，如果出现了循环阻塞，那么就会造成死锁，而死锁有两种解决方式

一般的做法是超时，但是对于长事务的作业如果应用超时后再回滚，那么会浪费掉很多性能以及时间，甚至是 undo log；

所以当前数据库包括 InnoDB 引擎采用的普遍的做法是**_wait-for graph_**，这是一种主动的死锁检测机制：**通过将事务构造成节点，然后多个事务根据等待关系链成链表，然后检测是否有回路的这么一种方式来检测是否出现死锁；**

如果出现回路，**通常来说**引擎会回滚 undo 量小的事务，也会有回滚 undo 量大的事务的情况；

### 锁的设计：乐观锁与悲观锁

摘自：https://www.hollischuang.com/archives/934

#### 悲观地想

在对任意记录进行修改前，先尝试为该记录加上排他锁

如果加锁失败，说明该记录正在被修改，那么当前查询可能要等待或者抛出异常。 具体响应方式由开发者根据实际需要决定

如果成功加锁，那么就可以对记录做修改，事务完成后就会解锁了

其间如果有其他对该记录做修改或加排他锁的操作，都会等待我们解锁或直接抛出异常

在 MySQL 的 InnoDB 引擎中我们需要：

1. 开启手动提交；
2. 用`select ... for update`加排他锁；
3. 修改记录；
4. 提交；

#### 乐观地想

乐观锁（ Optimistic Locking ） 相对悲观锁而言，乐观锁假设认为数据一般情况下不会造成冲突，所以在数据进行提交更新的时候，才会正式对数据的冲突与否进行检测，如果发现冲突了，则让返回用户错误的信息，让用户决定如何去做。

相对于悲观锁，在对数据库进行处理的时候，乐观锁并不会使用数据库提供的锁机制。一般的实现乐观锁的方式就是记录数据版本。

> 数据版本,为数据增加的一个版本标识。当读取数据时，将版本标识的值一同读出，数据每更新一次，同时对版本标识进行更新。当我们提交更新的时候，判断数据库表对应记录的当前版本信息与第一次取出来的版本标识进行比对，如果数据库表当前版本号与第一次取出来的版本标识值相等，则予以更新，否则认为是过期数据。

实现数据版本有两种方式，第一种是使用版本号，第二种是使用时间戳。
