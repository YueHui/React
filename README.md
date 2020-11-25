# react 实践

## 知识点总结

* 节点内的内容可以看做是`TEXT_ELEMENT`的`nodeValue`
* 用[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) 来处理`render`循环避免阻塞浏览器进程(react实际上用的是[scheduler](https://github.com/facebook/react/tree/master/packages/scheduler)包)
* 构建`fiber`树，首先渲染子节点,如果没有子节点，然后检查子节点的父节点的兄弟节点，依次循环直到`root`节点，则认为循环完毕