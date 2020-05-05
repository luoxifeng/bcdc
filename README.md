# bcdc
一个超小的状态共享，跨任意层级的模块通信库

## 特性  
- Use es decorator grammar
- Without any dependence
- Not managing any state
- Bridge connect any modules

## 做什么

- 任务两个模块或者组件通信
- 跨任意层级，动态获取数据
- 一次注册，多处映射
- 作为状态管理库的补充

## api
import bcdc from 'bcdc'

const [add,map,remove] = bcdc();

## 使用
- 基本
common.js
import bcdc from bcdc
const [add, map,remove] = bcdc();

module1.js

module2.js


- 分组
