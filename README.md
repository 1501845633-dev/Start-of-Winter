# 冬日便签 · VS Code 本地项目

## 打开方法

1. 将整个 ZIP 解压，不要直接在压缩包里打开文件。
2. 在 VS Code 中选择「文件 → 打开文件夹」，选中 winter-notes 文件夹。
3. 直接双击文件夹中的 index.html 即可在浏览器运行，无须安装 Node.js 或 npm。
4. 也可以在 VS Code 装好 Live Server 后，右键 index.html → Open with Live Server。
5. 修改文件并保存，然后刷新浏览器查看变化。

## 最常修改的内容：config.js

| 配置项 | 用途 | 示例 |
| --- | --- | --- |
| pageTitle | 浏览器标题与开场弹窗标题 | "写给你的信" |
| introMessage | 开场提示语 | "有些话，想慢慢说给你听" |
| startButton | 开场按钮文字 | "打开这份心意" |
| cardTitle | 每张便签顶部的小标题 | "给你的小纸条" |
| messages | 便签文字，每条占一项 | ["今天也要开心", "记得好好吃饭"] |
| colors | 便签随机颜色 | ["#e5d7ff", "#d4b8ef", "#f3e8ff"] |
| accentColor | 开场标题和按钮颜色 | "#a779ce" |
| backgroundImage | 背景图片路径；空字符串显示方格底纹 | "assets/background.jpg" |
| backgroundOpacity | 背景透明度，0 到 1 | 0.7 |
| music | 音乐相对路径；默认为空，不播放 | "assets/music.mp3" |
| spawnInterval | 便签出现间隔，毫秒；越小越快 | 1000 |
| initialCardCount | 开场逐个生成数量 | 18 |
| maxCards | 最多保留便签数量，旧便签自动移除 | 100 |

文字保留英文引号，每项之间用英文逗号分隔。文字中需要双引号时可以换成中文“引号”。修改 config.js 后刷新网页，不必修改 app.js。
每条便签祝福语在一次打开页面期间只显示一次；全部显示后便签停止生成。

例如，改为紫色主题：

```js
"colors": ["#e5d7ff", "#d4b8ef", "#f3e8ff", "#dcd6f7"],
"accentColor": "#a779ce",
```

## 图片与音乐

原页面公开引用的背景图片已保存在 assets/background.jpg。
替换背景时把自己的图片放进 assets，再修改 backgroundImage。
音乐没有打包，默认静音；放入自己的 assets/music.mp3 并设置 music 即可。
浏览器需要用户点击才能播放音乐，点击开场按钮时会尝试播放，也可以用右下角按钮控制。

## 操作

- 红点：关闭便签。
- 黄点：缩小淡出并移除便签，和原效果相同；没有任务栏恢复功能。
- 绿点：放大或恢复便签。
- 电脑鼠标拖动顶部标题栏：移动便签。
- 双击标题栏：放大或恢复；Esc：退出放大。
- 手机支持点击按钮；拖拽和原模板一样仅用于鼠标等非触摸输入。

## 文件说明

- index.html：页面入口与开场弹窗。
- config.js：中文文案、配色、背景、音乐、速度等常用配置。
- style.css：原效果样式及本地版启动弹窗；便签大小、字体等外观在这里修改。
- app.js：从原页面整理、适配后的便签动画与交互逻辑。
- assets/：背景图片，以及你自己添加的图片、音乐。

来源：https://a11292.w.wan55.cn/s/3208TH
核心模板：https://cdnweb.pp5.top/template/barrage/alert/memo/index.html
这是一份基于网页公开前端整理的独立本地版，不含服务端源码。
保留核心便签视觉与交互，已取消平台嵌套传值、自动复制、统计和跳转依赖。素材来源及使用权不因整理而改变。
