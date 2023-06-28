# SeaSide JS

SeaSide JS is a simple and convenient responsive framework designed to provide responsive interaction for ordinary web pages.

<p align="center">English | <a href="README.zh-CN.md">中文</a></p>

## Features

SeaSide JS offers the following features:

- Data-driven view
- Responsive updates
- Template syntax
- Event binding
- Conditional rendering

## Usage

To use SeaSide JS, you need to:

- Download the SeaSide JS zip package.
- Choose the version of SeaSide JS according to your project needs.
- Import SeaSide JS and its dependencies into your project.

```html
<div id="app">
    <!-- You can insert anything -->
</div>

<template id="template">
    <div>
        <h1>Count: {{ count }}</h1>
        <button @click="increment">Increment</button>
    </div>
</template>
<script type="module" src="yourapp.js"></script>
```

```js
import SeaSideJS, { getTemplate } from "/path/sjs.js";
const app = SeaSideJS.createApp({
    template: getTemplate("#template"), // or createTemplate even just a string
}).mount("#app")
```

## Installation

You can currently install SeaSide JS by downloading the releases package.

### Releases Package

You can download the SeaSide JS releases package on GitHub, and import the files under the dist directory into your project.

## Acknowledgments

The inspiration for SeaSide JS came from Vue.js and the book "Design and Implementation of Vue.js".

At the same time, SeaSide comes from the ancient name of my hometown "Taixing" - Jinchuan and Hai.

## License

SeaSide JS is licensed under the MIT License.