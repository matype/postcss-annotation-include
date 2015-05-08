# postcss-include [![Build Status](https://travis-ci.org/morishitter/postcss-include.svg)](https://travis-ci.org/morishitter/postcss-include)

PostCSS plugin for annotations based including properties in other rule sets.

Using this plugin, can use inline expanding property declarations of other rules by `@include`.

## Installation

```shell
$ npm install postcss-include
```

## Example

```js
var fs = require('fs')
var postcss = require('postcss')
var include = require('postcss-include')

var css = fs.readFileSync('input.css', 'utf-8')

var output = postcss(css)
  .use(include())
  .process(css)
  .css
```

Using this `input.css`:

```css
.base-1 {
  /*
   * @base
   */
  color: red;
}

.base-2 {
  /*
   * @base
   */
  padding: 10px;
}

.foo {
  /*
   * @include .base-1, .base-2
   */
  font-size: 12px;
}
```

You will get:

```css
.foo {
  /*
   * @include .base-1, .base-2
   */
  font-size: 12px;
  color: red;
  padding: 10px;
}
```


## License

The MIT License (MIT)

Copyright (c) 2014 Masaaki Morishita
