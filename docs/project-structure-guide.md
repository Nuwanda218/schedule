# Schedule Studio 文件结构与创作指南

这份文档回答三个问题：

```text
1. 我想改页面内容，应该改哪里？
2. 我想改样式或模块，应该改哪里？
3. 我想继续拆分项目，下一步从哪里下手？
```

## 一、项目分层

当前项目可以按四层理解：

```text
页面骨架层    index.html
样式表现层    assets/css/
应用逻辑层    assets/js/
内容数据层    assets/data/
说明文档层    README.md、docs/
```

这几个层的关系是：

```text
assets/data/app-config.js
        ↓
assets/js/modules/config.js
        ↓
assets/js/app.js
        ↓
index.html 里的容器
        ↓
assets/css/ 控制最终样式
```

也就是说，很多页面内容不应该直接写死在 HTML 里，而应该先放到配置，再由 JS 渲染。

## 二、最常见修改入口

### 1. 修改品牌、默认值、模块开关

改这里：

```text
assets/data/app-config.js
```

适合修改：

```text
品牌名称
顶部小标题
默认语言
默认主题
默认打开的视图
新增任务默认时间
新增任务默认优先级
新增任务默认标签
显示或隐藏某个标签
显示或隐藏某个视图
```

### 2. 修改中英文文案

改这里：

```text
assets/js/modules/i18n.js
```

适合修改：

```text
按钮文字
表单字段名
空状态文案
状态提示
标签名称
优先级名称
页面说明文字
```

规则：

```text
app-config.js 里写 labelKey
i18n.js 里写 labelKey 对应的中英文内容
```

例子：

```js
// app-config.js
{ id: "writing", labelKey: "tagWriting", enabled: true }

// i18n.js
tagWriting: "Writing"
tagWriting: "写作"
```

### 3. 修改今日语录

改这里：

```text
assets/data/quotes/today-quotes.json
```

适合修改：

```text
语录正文
语录作者
语录分类
```

加载逻辑在：

```text
assets/js/modules/quotes.js
```

渲染逻辑在：

```text
assets/js/app.js
```

样式在：

```text
assets/css/components/sidebar.css
```

### 4. 修改任务示例数据

改这里：

```text
assets/data/schedule/2026/year.json
```

任务对象格式：

```json
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
```

注意：用户在页面里新增的任务保存在浏览器 `localStorage`，不是直接写回 JSON 文件。

当前渲染逻辑会把两类数据合并：

```text
静态 JSON 示例任务
localStorage 用户任务
```

相关文件：

```text
assets/js/modules/taskStore.js  合并和筛选用户任务
assets/js/core/storage.js       读写 localStorage
assets/js/app.js                调用合并结果渲染视图
```

删除任务时，只删除保存在 `localStorage` 里的用户任务。项目自带 JSON 示例任务属于源文件内容，不会被浏览器页面直接改写。

## 三、目录职责说明

### 根目录

```text
index.html              页面骨架
README.md               项目总说明
package.json            npm 命令和依赖
package-lock.json       依赖版本锁定
schedule-template.json  日程数据模板
```

### `assets/data/`

内容和数据目录。

```text
app-config.js   页面配置中心
quotes/         今日语录数据
schedule/       日程 JSON 数据
theme/          季节主题 CSS
```

这里的重点是“内容”。以后做创作模式、编辑面板、导入导出，都应该优先围绕这一层设计。

### `assets/js/`

应用逻辑目录。

```text
app.js        主应用入口，负责把所有模块串起来
button.js     theme-button 自定义元素
core/         底层常量和存储
modules/      可复用功能模块
components/   独立组件行为
```

当前 `app.js` 仍然较大。它的下一步拆分方向不是随便拆函数，而是先建立 `appContext`，再把视图渲染移动到 `assets/js/views/`。

建议未来结构：

```text
assets/js/views/yearView.js
assets/js/views/monthView.js
assets/js/views/weekView.js
assets/js/views/dayView.js
assets/js/components/taskModal.js
assets/js/components/filterPanel.js
assets/js/components/todayPanel.js
```

### `assets/css/`

样式目录。

```text
styles.css       唯一样式入口
base/            变量、重置、响应式
components/      组件样式
views/           年/月/周/日视图样式
```

修改样式时先判断：

```text
全局颜色、间距、圆角       variables.css
页面基础、body、字体       reset.css
顶部栏、品牌、导航         header.css
按钮、chip、icon button    buttons.css
侧边栏、今日面板、概览     sidebar.css
弹窗和表单                 modal.css
具体日历视图               views/*.css
移动端适配                 responsive.css
```

## 四、内容配置化的当前成果

本轮已经配置化：

```text
品牌 mark
品牌 eyebrow
顶部视图切换按钮
标签筛选按钮
状态筛选按钮
任务优先级下拉选项
任务标签下拉选项
新增任务默认时间、优先级、标签
筛选模块开关
```

当前 `modules.filters` 设为 `false`。筛选模块暂时不显示，侧边栏优先展示今日待办和年度概览。如果后续任务数量变多，可以把它改回 `true` 并恢复筛选面板位置。

## 七、侧边栏布局说明

当前侧边栏结构：

```text
今日待办
└── 今日任务和今日语录

年度概览
├── 最近事务
└── 年度时间刻度
```

年度时间刻度相关文件：

```text
index.html                         提供 yearTimeline 容器
assets/js/app.js                   计算最近事务和时间轴事件
assets/css/components/sidebar.css  绘制刻度线、当前进度、事件点
assets/data/theme/*.css            提供事件颜色变量
```

事件颜色复用主题变量：

```text
普通计划  --event-plan-1
中等计划  --event-plan-2
重要计划  --event-plan-3
假期      --event-holiday
调休      --event-adjustment
```

暂时还没有配置化：

```text
页面模块拖拽排序
主题颜色编辑器
完整可视化编辑面板
把编辑结果写回文件
```

这些适合下一阶段做。

## 五、下一阶段建议

### 阶段 1：配置继续补全

目标：让更多静态页面内容从配置或 i18n 读取。

可做内容：

```text
模块标题配置化
模块说明配置化
图例配置化
视图 badge 配置化
footer 文案配置化
```

### 阶段 2：编辑模式

目标：页面里出现一个创作入口，不用直接改文件。

最小版本：

```text
打开编辑模式
显示品牌和默认任务设置表单
修改后保存到 localStorage
刷新页面仍然生效
提供“恢复默认配置”按钮
```

注意：浏览器前端不能安全地直接写项目文件。开发阶段可以先保存到 `localStorage`，以后再做后端或导出 JSON。

### 阶段 3：模块和样式编辑

目标：更直观地改模块和视觉。

可做内容：

```text
开关模块
调整模块顺序
选择主题
调整强调色
调整卡片密度
导出配置
导入配置
```

界面美化建议放在“核心交互稳定之后、复杂新功能之前”。也就是先保证新增、编辑、删除、保存、导入、导出可靠，再做一轮按钮状态、表单反馈、空状态、布局密度的可用性美化。

### 阶段 4：智能添加和外部能力

目标：让日程添加更智能。

可做内容：

```text
本地自然语言解析
大模型生成任务草稿
天气 API 显示今日天气
根据天气提示出行任务
```

原则：

```text
AI 负责生成草稿
用户负责确认
程序负责校验
```

## 六、学习路线

建议按这个顺序边学边做：

```text
1. 读 app-config.js，理解配置对象
2. 读 config.js，理解模块如何暴露数据
3. 看 app.js 里的 renderConfiguredContent
4. 看 index.html 里的空容器如何被填充
5. 改 tags 增加一个新标签
6. 在 i18n.js 补中英文文案
7. 运行 npm run check
8. 运行 npm run build
9. 打开页面确认效果
```

这个过程会覆盖：

```text
对象数组
模块导入导出
DOM 渲染
配置驱动 UI
国际化 key
构建检查
```
