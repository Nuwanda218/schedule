# Schedule Studio 项目说明

Schedule Studio 是一个用于学习前端开发的日程管理应用。项目没有使用 React、Vue 这类框架，而是使用原生 HTML、CSS 和 JavaScript 构建。这样做的好处是：可以直接看清楚浏览器页面、样式、DOM、事件、数据存储之间的关系。

当前项目已经完成第一轮拆分：CSS 从单文件拆成基础样式、组件样式和视图样式；JavaScript 从一个大型 `app.js` 中抽出了常量、日期工具、数据加载、任务格式化、主题、语言和存储模块。

## 项目功能

- 年视图、月视图、周视图、日视图
- 添加、编辑、删除任务
- 按标签和完成状态筛选任务
- 今日任务面板
- 今日语录
- 年度进度展示
- JSON 导入导出
- localStorage 本地持久化
- 中英文双语界面
- 季节主题和明暗模式
- 响应式布局

## 如何运行项目

第一次拿到项目时，先安装依赖：

```bash
npm install
```

启动本地开发服务器：

```bash
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:5173
```

常用检查命令：

```bash
npm run check
npm run build
```

命令含义：

```text
npm install   安装项目依赖，比如 Vite
npm run dev   启动开发服务器
npm run check 检查 HTML 引用的资源文件是否存在
npm run build 使用 Vite 打包，检查模块导入和构建是否正常
```

## 当前目录结构

```text
Schedule/
├── index.html
├── README.md
├── package.json
├── package-lock.json
├── schedule-template.json
├── scripts/
│   └── check-assets.mjs
├── docs/
│   └── superpowers/
│       └── plans/
│           └── 2026-05-27-schedule-project-split.md
└── assets/
    ├── css/
    │   ├── styles.css
    │   ├── base/
    │   │   ├── reset.css
    │   │   ├── responsive.css
    │   │   └── variables.css
    │   ├── components/
    │   │   ├── buttons.css
    │   │   ├── header.css
    │   │   ├── modal.css
    │   │   └── sidebar.css
    │   └── views/
    │       ├── day-view.css
    │       ├── month-view.css
    │       ├── week-view.css
    │       └── year-view.css
    ├── js/
    │   ├── app.js
    │   ├── button.js
    │   ├── components/
    │   │   └── settingsPanel.js
    │   ├── core/
    │   │   ├── constants.js
    │   │   └── storage.js
    │   └── modules/
    │       ├── dates.js
    │       ├── i18n.js
    │       ├── scheduleData.js
    │       ├── tasks.js
    │       └── theme.js
    └── data/
        ├── quotes/
        ├── schedule/
        └── theme/
```

## 入口文件说明

### `index.html`

项目的页面入口。它负责声明页面结构，包括：

- 顶部 header
- 视图切换按钮
- 侧边栏
- 年/月/周/日视图面板
- 添加或编辑任务的弹窗表单
- CSS 和 JS 文件引用

在这个项目中，`index.html` 不是简单的静态页面，它更像是应用骨架。JavaScript 会通过 `id`、`class`、`data-*` 属性找到页面节点，然后更新内容或绑定事件。

常见标记含义：

```text
id          给 JS 精确查找单个元素
class       给 CSS 设置样式，也可给 JS 批量查找元素
data-*      给 JS 表示行为、类型、状态
is-active   表示当前激活状态
hidden      表示当前隐藏状态
```

### `package.json`

项目命令和依赖声明文件。

当前脚本：

```json
{
  "dev": "vite --host 127.0.0.1",
  "build": "vite build",
  "preview": "vite preview --host 127.0.0.1",
  "check": "node scripts/check-assets.mjs"
}
```

### `scripts/check-assets.mjs`

一个简单的资源检查脚本。它会读取 `index.html`，检查其中引用的 CSS 和 JS 文件是否存在，也会检查 CSS 里的 `@import` 文件是否存在。

这个脚本的意义是：拆分文件后，如果路径写错，可以尽早发现。

## CSS 拆分说明

CSS 入口仍然是：

```text
assets/css/styles.css
```

它现在只负责导入其他样式文件：

```css
@import "./base/variables.css";
@import "./base/reset.css";
@import "./components/header.css";
@import "./components/buttons.css";
@import "./components/sidebar.css";
@import "./views/year-view.css";
@import "./views/month-view.css";
@import "./views/week-view.css";
@import "./views/day-view.css";
@import "./components/modal.css";
@import "./base/responsive.css";
```

### `assets/css/base/`

基础样式目录。

```text
variables.css   CSS 变量、颜色、圆角、尺寸等设计 token
reset.css       浏览器默认样式重置、body 基础样式
responsive.css  响应式断点
```

### `assets/css/components/`

组件样式目录。

```text
header.css   顶部栏、品牌区、视图切换、设置面板
buttons.css  通用按钮、chip、icon button、theme-button
sidebar.css  侧边栏、面板、今日任务、进度、概览卡片
modal.css    弹窗、表单、输入框、操作按钮
```

### `assets/css/views/`

视图样式目录。

```text
year-view.css   年视图、月份卡片、热力图
month-view.css  月视图网格
week-view.css   周视图网格
day-view.css    日视图时间轴
```

拆分原则：

```text
1. styles.css 保持唯一入口，index.html 不需要引用一堆 CSS 文件
2. 按职责拆，不按技术炫技拆
3. 保持原有 CSS 顺序，避免样式覆盖关系变化
4. 先拆清楚，再考虑优化命名
```

## JavaScript 拆分说明

### `assets/js/app.js`

主应用入口。它仍然负责：

- 缓存 DOM 元素
- 绑定事件
- 维护页面状态
- 调用各个模块
- 渲染主要视图
- 处理任务弹窗和导入导出

目前没有把所有渲染函数都拆出去，是有意保留的。年/月/周/日视图渲染函数共享很多 `state`、`ui`、语言、任务和 DOM 工具。强行拆分会让参数传递变复杂，反而不利于学习。

### `assets/js/core/constants.js`

存放全局常量。

包括：

- localStorage key
- 默认语言
- 默认主题
- 季节列表
- 月份名称
- 星期名称
- 数据路径
- 主题路径
- 日程布局参数

适合学习：

```text
什么数据应该抽成常量
如何避免字符串散落在各个文件里
```

### `assets/js/core/storage.js`

负责任务数据的本地存储。

主要职责：

- 从 localStorage 读取任务
- 写入任务到 localStorage
- 创建初始示例任务
- 创建任务对象

适合学习：

```text
localStorage
JSON.stringify
JSON.parse
数据持久化
失败兜底
```

### `assets/js/modules/dates.js`

日期工具模块。

主要职责：

- 日期格式化
- 获取月份名称
- 获取星期名称
- 计算周起始日期
- 日期加减
- 计算某月天数

适合学习：

```text
纯函数
日期对象 Date
函数输入输出
工具函数如何拆分
```

### `assets/js/modules/i18n.js`

国际化模块。

主要职责：

- 保存中英文词典
- 根据 key 获取文案
- 生成双语显示内容
- 读取和保存语言偏好

适合学习：

```text
对象字典
语言切换
UI 文案集中管理
```

### `assets/js/modules/theme.js`

主题模块。

主要职责：

- 校验季节主题名称
- 生成主题 CSS 文件路径
- 读取和保存季节偏好

适合学习：

```text
主题系统
CSS 文件动态切换
状态持久化
```

### `assets/js/modules/scheduleData.js`

日程 JSON 数据加载模块。

主要职责：

- 根据当前日期生成 JSON 路径
- 使用 `fetch()` 加载数据
- 缓存已加载数据
- 规范化 year/month/week/day 数据结构

适合学习：

```text
fetch
async / await
Promise.all
JSON 数据建模
数据清洗和默认值
```

### `assets/js/modules/tasks.js`

任务格式化和分组模块。

主要职责：

- 按日期分组任务
- 获取最高频标签
- 时间字符串转小时数
- 格式化任务数量
- 格式化节假日、周范围、日期标题

适合学习：

```text
数组 reduce
数据统计
格式化函数
把 UI 文案和业务数据连接起来
```

### `assets/js/components/settingsPanel.js`

设置面板组件行为。

主要职责：

- 打开设置面板
- 关闭设置面板
- 同步 `aria-expanded` 和 `aria-hidden`

适合学习：

```text
组件行为拆分
DOM class 切换
可访问性属性
```

### `assets/js/button.js`

自定义主题按钮组件。

这个文件使用 Web Component 思路封装了 `theme-button`。它和普通函数组件不同，是浏览器原生的自定义元素机制。

适合后面单独学习：

```text
customElements
HTMLElement
attributeChangedCallback
Shadow DOM 或组件封装思想
```

## 数据文件说明

### `assets/data/quotes/`

存放今日语录数据。

### `assets/data/schedule/`

存放日程数据。当前按年份、月份、周组织。

示例结构：

```text
assets/data/schedule/
└── 2026/
    ├── year.json
    └── january/
        ├── january.json
        ├── week1/
        │   ├── day.json
        │   └── week.json
        └── week2/
```

### `assets/data/theme/`

存放季节主题 CSS。

当前仍保留在 `data/theme` 下。更语义化的位置是：

```text
assets/css/themes/
```

但这会影响 HTML 和 JS 中的主题路径，所以本轮没有移动。后续可以作为单独任务处理。

## 任务数据格式

任务 JSON 示例：

```json
{
  "tasks": [
    {
      "id": "task-1234",
      "title": "Design Sprint",
      "titleAlt": "设计冲刺",
      "date": "2026-01-18",
      "start": "09:30",
      "end": "11:30",
      "priority": "high",
      "tag": "studio",
      "notes": "Draft three directions.",
      "completed": false
    }
  ]
}
```

字段说明：

```text
id         任务唯一 ID
title      英文标题
titleAlt   中文标题
date       日期，格式 YYYY-MM-DD
start      开始时间
end        结束时间
priority   优先级：high / med / low
tag        标签：studio / admin / health / learning / travel
notes      备注
completed  是否完成
```

localStorage 使用的 key：

```text
schedule-studio-data-v1
schedule-studio-lang-v1
schedule-studio-season-v1
```

## 学习路线建议

建议按这个顺序学习：

```text
1. README.md
   先理解项目结构和模块职责

2. package.json
   理解 npm install、npm run dev、npm run build

3. index.html
   理解页面骨架、id、class、data-*、表单和弹窗

4. assets/css/styles.css
   理解 CSS 入口和 @import

5. assets/css/base/
   学基础样式、变量、响应式

6. assets/css/components/
   学组件样式如何组织

7. assets/js/modules/dates.js
   从最简单的纯函数开始学 JS 模块

8. assets/js/core/storage.js
   学 localStorage 和 JSON

9. assets/js/modules/scheduleData.js
   学 fetch、async/await 和数据规范化

10. assets/js/app.js
    最后看主应用，因为它串起了所有模块
```

## 为什么不一次性把 `app.js` 全拆完

当前 `app.js` 仍然比较大，这是有意保留的。

原因：

```text
1. 视图渲染函数共享大量状态
2. 很多函数直接操作 DOM
3. 过早拆分会产生大量参数传递
4. 对学习者来说，过度抽象比大文件更难理解
```

更好的下一步是先引入一个上下文对象：

```js
const appContext = {
  state,
  ui,
  helpers: {
    getText,
    formatBilingual,
    renderTaskPill
  }
};
```

然后再逐步拆：

```text
assets/js/views/yearView.js
assets/js/views/monthView.js
assets/js/views/weekView.js
assets/js/views/dayView.js
assets/js/components/taskModal.js
```

## Git 工作流建议

这个项目适合小步提交。

推荐节奏：

```bash
npm run check
npm run build
git status
git add .
git commit -m "说明这一步做了什么"
git push
```

每次只做一类修改：

```text
拆 CSS 就只拆 CSS
拆日期函数就只拆日期函数
改文档就只改文档
```

这样出问题时容易定位，也方便学习每一步的意义。

## 当前状态

第一轮拆分已经完成：

```text
CSS 已按职责拆分
JS 已抽出核心工具模块
Vite 已接入
资源检查脚本已接入
README 已更新为中文说明
```

当前验证命令：

```bash
npm run check
npm run build
```

如果这两个命令都通过，说明资源路径和模块构建目前是正常的。
