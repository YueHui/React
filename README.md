# react 实践

## 知识点总结

* 节点内的内容可以看做是`TEXT_ELEMENT`的`nodeValue`
* 用[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) 来处理`render`循环避免阻塞浏览器进程(react实际上用的是[scheduler](https://github.com/facebook/react/tree/master/packages/scheduler)包)
* 构建`fiber`树,首先渲染子节点,如果没有子节点,然后检查子节点的父节点的兄弟节点,依次循环直到`root`节点,则认为循环完毕
* 通过对比新旧dom树来确定操作类型
    * 如果`dom`名称一样则只更新`props`
    * 类型不一样,则新增节点
    * 类型不一样,并且有旧的节点,则为删除操作
* 处理事件用`addEventListener`/`removeEventListener`来处理
* `function Component` 通过运行该`function`来获得