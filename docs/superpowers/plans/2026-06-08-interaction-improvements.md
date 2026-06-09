# 交互改进方案

## 概述

本计划分为三个批次实现，每批次独立可用，按优先级排列。目标是让日常使用更流畅，减少不必要的弹窗跳转。

---

## 批次 1：低成本高回报（基础交互）

### 1.1 任务一键完成

**问题**：标记完成需要 打开 modal → 勾选 → 保存，3 步操作。

**方案**：

- 在今日任务列表（`#todayList`）每个 task item 前加一个 circle checkbox
- 在周视图 / 日视图的 `.task-block` 左侧加一个小圆圈
- 在月视图的 `.task-pill` 上 hover 时显示完成按钮
- 点击直接 toggle `completed` 状态并保存 localStorage
- 完成后 task 加 `is-done` class（已有样式：opacity 0.55 + line-through）
- 加一个 150ms 的 scale 动画作为点击反馈

**涉及文件**：

```
assets/js/app.js          — renderTodayList, renderDayBlocks, renderMonthView 中插入 checkbox
assets/css/views/day-view.css  — .task-check 样式
assets/css/components/sidebar.css — today-list checkbox 样式
```

**新增 i18n key**：`toggleComplete` / `toggleIncomplete`

---

### 1.2 键盘快捷键

**问题**：所有操作依赖鼠标点击，没有快捷方式。

**方案**：

在 `bindUI()` 中注册全局 keydown listener：

| 快捷键 | 动作 |
|--------|------|
| `N` | 打开新建任务 modal |
| `T` | 跳回今天 |
| `1` | 切换到年视图 |
| `2` | 切换到月视图 |
| `3` | 切换到周视图 |
| `4` | 切换到日视图 |
| `←` | 前一个时间段（shiftRange -1） |
| `→` | 后一个时间段（shiftRange +1） |
| `Escape` | 关闭 modal / settings panel |

**约束**：当焦点在 input/textarea/select 时忽略单字母快捷键，避免冲突。

**涉及文件**：

```
assets/js/app.js — bindUI() 末尾新增 bindKeyboardShortcuts()
```

---

### 1.3 Toast 通知替代底部状态栏

**问题**：当前操作反馈在页面底部的 status 文字中，不够显眼。

**方案**：

- 新建一个 `.toast-container`（固定在视口顶部中央）
- 操作成功/失败时弹出一个 toast，3 秒后自动消失
- toast 有 slide-down 入场 + fade-out 离场动画
- 保留底部 status 作为静态信息展示，toast 用于即时反馈

**涉及文件**：

```
index.html                     — body 末尾加 .toast-container
assets/css/components/toast.css — 新文件
assets/css/styles.css          — @import toast.css
assets/js/app.js               — 新增 showToast(messageHtml, type)，setStatusKey 中调用
```

---

## 批次 2：输入体验提升

### 2.1 Quick Add 快速添加栏

**问题**：添加任务必须打开 modal 填完整表单。

**方案**：

- 在 header `.header-actions` 前面加一个输入框 `.quick-add-input`
- 用户输入标题后按 Enter，用当前视图日期 + 默认配置（`appConfig.defaults.newTask`）创建任务
- 创建后输入框清空，展示 toast "Task saved"
- 如果用户想填更多字段，点 "Add Task" 按钮仍走 modal 流程
- 移动端时 quick-add 收起为一个 `+` 按钮，点击展开

**涉及文件**：

```
index.html                       — header 中加 input
assets/css/components/header.css — quick-add 样式
assets/js/app.js                 — bindQuickAdd()、quickAddTask()
```

**新增 i18n key**：`quickAddPlaceholder`（"Type a task and press Enter"）

---

### 2.2 任务右键上下文菜单

**问题**：修改优先级、删除等操作必须进 modal。

**方案**：

- 右键 `.task-block` / `.task-pill` / `.today-item` 时弹出轻量菜单
- 菜单项：✓ 完成 / ✗ 删除 / ⬆ 高优先 / ➡ 中优先 / ⬇ 低优先 / ✏ 编辑
- 点击菜单项直接执行操作，不进 modal
- 点击外部或按 Esc 关闭菜单
- 移动端用长按触发

**涉及文件**：

```
assets/css/components/context-menu.css — 新文件
assets/css/styles.css                  — @import
index.html                             — body 末尾加 .context-menu 容器
assets/js/app.js                       — bindContextMenu()、showContextMenu()、handleContextAction()
```

---

### 2.3 Modal 动画优化

**问题**：modal 打开/关闭是硬切（display none/flex），无过渡。

**方案**：

- 打开：overlay fade-in 200ms + card scale(0.96→1) + translateY(12→0) 200ms
- 关闭：overlay fade-out 150ms + card scale(1→0.96) 150ms
- 用 CSS animation + `is-opening` / `is-closing` class 控制
- 关闭时等动画结束再 `display: none`（用 animationend 事件）

**涉及文件**：

```
assets/css/components/modal.css — 添加动画 keyframes
assets/js/app.js               — openModal / closeModal 中管理 class
```

---

## 批次 3：进阶交互

### 3.1 日视图/周视图拖拽调整时间

**问题**：修改任务时间只能编辑表单。

**方案**：

- 在 `.task-block` 上注册 pointerdown，拖动时实时更新 `top` 位置
- 在 `.task-block` 底部加一个 resize handle，拖拽改变 `height`（时长）
- 松开时根据像素位置计算新的 start/end 时间（已有 `HOUR_HEIGHT = 56px`）
- 保存更新后的任务到 localStorage
- 拖拽过程中显示时间预览 tooltip

**涉及文件**：

```
assets/js/modules/drag.js — 新模块，导出 initDrag(container, onDrop)
assets/css/views/day-view.css — .task-block 拖拽中样式、resize handle
assets/js/app.js — renderDayBlocks/renderWeekBlocks 中调用 initDrag
```

**注意**：仅对 `source === "user"` 的任务启用拖拽，JSON 数据源任务只读。

---

### 3.2 视图切换动画

**问题**：视图切换是硬切 `display: none/block`。

**方案**：

- 切换时对离场面板 fade-out + translateX(-8px)，150ms
- 新面板 fade-in + translateX(8px→0)，200ms
- 用 `.is-entering` / `.is-leaving` class + animationend 管理

**涉及文件**：

```
assets/css/components/sidebar.css — .view-panel 动画
assets/js/app.js — setView() 中添加动画逻辑
```

---

### 3.3 任务卡片增删动画

**问题**：renderAll() 整体重绘，任务出现/消失没有过渡。

**方案**：

- 新增任务时对对应 DOM 元素加 `.is-new` class → slide-in + fade-in
- 删除任务时先加 `.is-removing` → fade-out + collapse height，animationend 后移除 DOM
- 标记完成时加 `.is-completing` → 短暂 scale pulse 后恢复

这一项需要局部渲染而非全量 innerHTML 替换。可以在 today list 先试验，日/周视图后续跟进。

**涉及文件**：

```
assets/css/components/sidebar.css — 动画 keyframes
assets/js/app.js — renderTodayList 改为 diff-patch 模式（对比新旧 task id 列表）
```

---

## 实现顺序建议

```
批次 1（约 1-2 天）
  1.1 一键完成  ← 最能改善日常使用
  1.2 键盘快捷键
  1.3 Toast 通知

批次 2（约 2-3 天）
  2.1 Quick Add
  2.2 右键菜单
  2.3 Modal 动画

批次 3（约 3-4 天）
  3.1 拖拽改时间
  3.2 视图切换动画
  3.3 任务增删动画
```

## 设计原则

- 所有新交互遵循已有的 CSS 变量体系（`--accent`, `--line`, `--surface` 等）
- 动画时长控制在 150-300ms，不拖沓
- 键盘和鼠标操作互补，不互斥
- 不引入外部库，全部原生实现
- 保持当前模块化结构（新功能拆到独立模块/CSS 文件）
- 所有文本走 i18n 双语系统
