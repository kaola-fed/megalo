<p align="center">
  <a href="https://travis-ci.org/kaola-fed/megalo">
    <img src="https://img.shields.io/travis-ci/kaola-fed/megalo.svg?branch=feature_megalo&style=for-the-badge">
  </a>

  <a href="https://codecov.io/gh/kaola-fed/megalo">
    <img src="https://img.shields.io/codecov/c/github/kaola-fed/megalo.svg?style=for-the-badge" />
  </a>
</p>

## Megalo

**Megalo** 是基于 Vue（`Vue@2.5.16`） 的小程序开发框架，让开发者可以用 Vue 的开发方式开发小程序应用。**Megalo** 是为了跨 H5 和小程序两端的应用提供一个高效的解决方案，只需要少量改动即可完成 H5 和小程序之间的代码迁移。

**Megalo** 目前支持微信小程序，未来的版本将支持支付宝、百度小程序。

## 快速开始

### Page 入口

声明 `mpType` 为 `page` 作为小程序页面入口，在小程序创建 `Page` 实例时（`onLoad` 阶段），同时会创建一个于这个实例绑定的 Vue 实例作为一个页面的根实例，并将各生命周期进行绑定。

主要生命周期的顺序为：`created`(`onLoad`) => `mounted`(`onReady`) => `beforeDestroyed`(`onUnload`)。同时 `onShow`、`onHide`、`onShareAppMessage`、`onReachBottom`、`onPullDownRefresh` 也会与小程序 `Page` 对应的声明周期钩子绑定。

在每一个 Vue 实例中，都可以通过 `this.$mp` 方法小程序相关的数据，例如可以通过 `this.$mp.options` 访问 `onLoad` 时传入的参数，例如 `query` 字段。

```html
<template>
  <div>
    <h1>{{ title | greeting }}</h1>
  </div>
</template>
<script>
  export default {
    mpType: 'page',
    filters: {
      greeting(t) {
        return `Hello ${t} !`;
      }
    },
    data() {
      return {
        title: 'Megalo'
      };
    },
    create() {
      // 获取 onLoad 中的 options
      console.log(this.$mp.options);
    }
  }
</script>
```

### App 入口

与 `Page` 入口相似，mpType 设置为 `app`，以此绑定小程序 `App` 和 Vue 实例的声明周期。

主要生命周期的顺序为：`created` => `mounted`(`onLaunch`)。同时 `onShow`、`onHide`、`onError`、`onPageNotFound` 也会与小程序 `App` 对应的声明周期钩子绑定。

```html
<template></template>
<script>
  export default {
    mpType: 'app',
    created() {
      console.log('launch');
    }
  }
</script>
```

## 支持特性

### 基本语法

支持 Vue 的基本模版语法，包括 v-for、v-if 等。

```html
<!-- v-if & v-for -->
<div v-for="(item, i) in list">
  <div v-if="isEven(i)">{{ i }} - {{ item }}</div>
</div>

<!-- style & class -->
<div :class="classObject"></div>
<div :class="{ active: true }"></div>
<div :class="[activeClass, errorClass]"></div>
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
<div :style="styleObject"></div>
<div :style="[baseStyles, overridingStyles]"></div>
```

注：class 暂时不能用在组件上

### 复杂表达式、方法调用

支持在模版中写复杂的表达式、和调用 methods 上的方法。

```html
<div>
  <div>{{ message.toUpperCase() }}</div>
  <div>{{ toUpperCase(message) }}</div>
</div>
```

### filter

支持 filter

```html
<div>
  <div>{{ message | toUpperCase }}</div>
  <div>{{ date | dateFormatter('yyyy-MM-dd') }}</div>
</div>
```

### slot

支持基本 slot 功能，包括具名 slot。

```html
<div>
  <Container>
    <Card>
      <div slot="head"> {{ title }} </div>
      <div> I'm body </div>
      <div slot="foot"> I'm footer </div>
    </Card>
  </Container>
<div>
```

注：暂不支持将 slot 一层层传递下去，例如

CompA template:

```html
<div>
  <CompB>
    <slot></slot>
  </CompB>
</div>
```

CompB template:

```html
<div>
  <slot></slot>
</div>
```

page template:

```html
<div>
  <CompA>
    page title: {{ title }}
  </CompA>
</div>
```

目前 CompA 无法将从 page 接收到的 slot 片段传递给它的子组件 CompB。

### slot-scope

支持 slot-scope。

page template:

```html
<div>
  <CompA>
    <span slot-scope="scopeProps">{{ scopeProps.item }}</span>
  </CompA>
</div>
```

CompA template:

```html
<div v-for="(item, i) in list">
  {{ i }} - <slot :item="item"></slot>
</div>
```

### 事件

除了支持事件绑定以外，还支持部分修饰符

```html
<button @click="onClick"></button>
```

支持修饰符：

- stop，用小程序 catch 绑定事件实现，例如 `@tap.stop` => `catchtap`
- capture，用小程序的 capture 绑定事件实现，例如 `@tap.capture` => `capture-bind`
- self（实验），目前利用特定的 data-set 标记元素实现
- once，模拟 removeListener 实现

## 不支持特性

#### 动态 component、slot、template

因为需要在构建阶段将所有的模版编译成小程序所需要的模版，因此动态的组件、模版、slot，目前都是不支持的。

#### v-html

正在开发中，敬请期待。

#### v-once

暂不支持。

## 配套设施

- [magalo-aot](https://github.com/kaola-fed/megalo-aot)
- [demo](https://github.com/kaola-fed/megalo-demo)

## 灵感来源

名字来源于动画 `Megalo Box`。项目启发自 `mpvue`。

<p align="center"><img src="https://haitao.nos.netease.com/222d2a49-b9fe-4d95-aa61-074d910f0087.jpg"></p>
