## Vue

### Vue 技巧

1. [用了很多动效，介绍 4 个很 Nice 的 Vue 路由过渡动效！](https://juejin.cn/post/6951540864787152927)

   t ransition 得用这样的状态

   ```html
   <transition name="slide-fade" mode="out-in">
     <keep-alive>
       <router-view></router-view>
     </keep-alive>
   </transition>
   ```

   css 得用 enter

   ```css
   .fade-enter-active,
   .fade-leave-active {
     transition: opacity 0.3s;
   }

   .fade-enter,
   .fade-leave-to {
     opacity: 0;
   }

   .slide-fade-enter-active {
     transition: all 0.3s ease;
   }
   .slide-fade-leave-active {
     transition: all 0.3s ease;
   }
   .slide-fade-enter, .slide-fade-leave-to
   /* .slide-fade-leave-active for below version 2.1.8 */ {
     transform: translateX(10px);
     opacity: 0;
   }
   ```

#### Vue3 Troubleshoot

1. [where to find or how to set htmlWebpackPlugin.options.title in project created with vue cli 3?](https://stackoverflow.com/questions/62023604/where-to-find-or-how-to-set-htmlwebpackplugin-options-title-in-project-created-w)
1. [webpack-chain 示例](https://github.com/Yatoo2018/webpack-chain/tree/zh-cmn-Hans)

### Vue3 动态渲染

```js
<script>
/* eslint-disable no-unused-vars */
import imgRouter from "@/plugins/img-router.js";
import { h, createApp } from "vue";
import { NImage } from "naive-ui";

export default {
  components: {},
  render() {
    return h("div", {
      id: "md",
      class: this.mdClass,
      key: this.key,
    });
  },
  props: ["content", "class", "key"],
  mounted: function () {
    this.renderMd(this.content);
  },
  watch: {
    // when the content is load
    content: function (nV) {
      this.renderMd(nV);
    },
  },
  computed: {
    mdClass: function () {
      if (this.class !== null && this.class !== undefined) {
        return this.class;
      }
      return "article markdown-body editormd-html-preview animate__animated animate__fadeIn";
    },
  },
  methods: {
    imgReplacement(innerHTML) {
      innerHTML = innerHTML.replaceAll("<img", "<n-image");
      var unhandleImageTagStart = innerHTML.indexOf("<n-image");
      const unhandleImageTagStringList = [];
      while (unhandleImageTagStart !== -1) {
        var unhandleImageTagEnd = innerHTML.indexOf(
          '">',
          unhandleImageTagStart + 8
        );
        unhandleImageTagStringList.push(
          innerHTML.substring(unhandleImageTagStart, unhandleImageTagEnd + 2)
        );
        unhandleImageTagStart = innerHTML.indexOf(
          "<n-image",
          unhandleImageTagEnd + 2
        );
      }
      for (let item of unhandleImageTagStringList) {
        innerHTML = innerHTML.replaceAll(
          item,
          item.substring(0, item.length - 1) + "/>"
        );
      }
      return innerHTML;
    },
    renderMd(c) {
      if (c === null) {
        return;
      }
      // pre route the img src before they actually render into the real dom
      const node = new DOMParser().parseFromString(c, "text/html");
      imgRouter.routeElements(node.getElementsByTagName("img"));
      var innerHTML = node.children[0].children[1].innerHTML;

      // replace img with n-image
      innerHTML = this.imgReplacement(innerHTML);

      // render it
      const body = {
        template: innerHTML,
        components: {
          NImage,
        },
      };
      createApp(body).mount("#md");
    },
  },
};
</script>
```

使用这个组件：

```html
<template>
  <markdown-body :content="content" :key="$route.params.articleId" />
</template>
```

### Vue 监听窗口大小变化

```js
mounted: function () {
  this.winHeight = this.getWinHeight();
  this.winWidth = this.getWinWidth();
  window.onresize = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.winHeight = this.getWinHeight();
      this.winWidth = this.getWinWidth();
    }, 300);
  };
},
```

### Vue 打包体积优化方案和 CDN

https://juejin.cn/post/6844904163327868941

### Vue SPA 和 GithubPages 的配合

---

2021 Solution for vue3 & vue-cli:

Follow this with "Basic instructions":

https://github.com/rafgraph/spa-github-pages#usage-instructions

no need to change `var pathSegmentsToKeep = 0;` the 404.html.

and then in the `vue.config.js`:

```javascript
  // do not use "./dist/"
  publicPath: "/dist/",
  // make the index.html file place at the root of the repo
  indexPath: "../index.html",
```

then the spa is good to go~

---

在[stackoverflow](https://stackoverflow.com/a/70299225/17094075)上的回答
