# SeaSide JS

SeaSide JS 是一个简单方便的响应式框架，旨在为普通网页提供响应式交互功能。

<p align="center"><a href="README.md">English</a> | 中文</p>

## 特性

SeaSide JS 提供了以下功能：

- 数据驱动视图
- 响应式更新
- 模板语法
- 事件绑定
- 条件渲染

## 使用方法

使用 SeaSide JS 要求：

- 下载 SeaSide JS 的压缩包。
- 根据的你的项目的需要，选择 SeaSide JS 的版本。
- 把 SeaSide JS 和其依赖项导入项目中。

```html
<script type="module" src="path/to/SeaSideJs.js"></script>
```

```js
import { createApp } from "../dist/sjs.esm.js";
const app = createApp({
  // your options...
});
app.mount("#app");
```

## 安装

你目前可以通过使用下载 zip 包的方式进行安装。

### ZIP 包

你可以在 GitHub 上下载 SeaSide JS 的压缩包，解压后将 dist 目录下的文件导入项目中。

## 感谢

SeaSide JS 的灵感来自于 Vue.js 和《Vue.js的设计与实现》这本书。

同时，SeaSide，来自我家乡“泰兴”的古称——襟江带海。

## 许可证

SeaSide JS 使用 MIT 许可证进行许可。