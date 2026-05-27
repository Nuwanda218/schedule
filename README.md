# Schedule Studio

一个现代化的日程安排工具原型，支持多视图切换、任务管理和丰富的主题系统。

## ✨ 功能特性

- **多视图布局**：年视图（卡片/热力图）、月视图、周视图、日视图
- **任务管理**：添加、编辑、删除任务，支持优先级和标签分类
- **筛选功能**：按标签（工作室、行政、健康、学习、旅行）和状态（待办/完成）筛选
- **数据持久化**：localStorage 本地存储，支持 JSON 导入导出
- **多语言支持**：中英文双语切换
- **主题系统**：5种季节主题（春、夏、秋、冬、欢乐）+ 明暗模式
- **响应式设计**：适配桌面端和移动端

## 🚀 快速开始

### 安装与运行

项目为纯静态前端项目，无需构建工具，直接在浏览器中打开即可。

```bash
# 克隆项目
git clone <repository-url>
cd Schedule

# 方式1：使用浏览器直接打开
open index.html

# 方式2：使用本地服务器（推荐）
python -m http.server 8000
# 或
npx serve .

# 访问地址
http://localhost:8000
```

## 📁 项目结构

```
Schedule/
├── assets/                  # 静态资源目录
│   ├── css/                 # 样式文件
│   │   └── styles.css       # 主样式表（布局、组件、动画）
│   ├── data/                # 数据文件
│   │   ├── quotes/          # 励志语录数据
│   │   │   └── today-quotes.json
│   │   ├── schedule/        # 日程数据（按年/月/周/日组织）
│   │   │   └── 2026/
│   │   │       ├── year.json
│   │   │       └── january/
│   │   │           ├── january.json
│   │   │           └── week1/
│   │   │               ├── day.json
│   │   │               └── week.json
│   │   └── theme/           # 季节主题样式
│   │       ├── spring.css / spring-dark.css
│   │       ├── summer.css / summer-dark.css
│   │       ├── autumn.css / autumn-dark.css
│   │       ├── winter.css / winter-dark.css
│   │       ├── joyful.css / joyful-dark.css
│   │       └── theme-template.css
│   └── js/                  # JavaScript 文件
│       ├── app.js           # 主应用逻辑
│       └── button.js        # 主题切换按钮组件
├── index.html               # 主页面
├── schedule-template.json   # 日程数据模板
└── README.md                # 项目说明
```

## 📊 数据格式

### 任务数据格式

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

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 任务唯一标识 |
| `title` | string | 任务标题（主语言） |
| `titleAlt` | string | 任务标题（副语言） |
| `date` | string | 日期（格式：YYYY-MM-DD） |
| `start` | string | 开始时间（格式：HH:MM） |
| `end` | string | 结束时间（格式：HH:MM） |
| `priority` | string | 优先级：`high` / `med` / `low` |
| `tag` | string | 标签：`studio` / `admin` / `health` / `learning` / `travel` |
| `notes` | string | 备注信息 |
| `completed` | boolean | 是否完成 |

## 🔧 技术栈

- **HTML5** - 页面结构
- **CSS3** - 样式设计（CSS Grid、Flexbox、自定义属性）
- **Vanilla JavaScript** - 应用逻辑（ES6+）
- **Web Components** - 自定义元素（theme-button）

## 🎨 主题系统

### 季节主题

| 主题 | 描述 |
|------|------|
| Spring | 清新绿色调 |
| Summer | 明亮蓝黄色调 |
| Autumn | 温暖橙红色调（默认） |
| Winter | 冷冽蓝灰色调 |
| Joyful | 活力彩虹色调 |

### 外观模式

- **Light** - 明亮模式
- **Dark** - 暗黑模式

## 🌐 语言支持

- English（英语）
- 中文（简体）

## 📱 响应式断点

- **桌面端**（> 980px）：侧边栏 + 主内容并排布局
- **平板端**（720px - 980px）：侧边栏移至底部
- **移动端**（< 720px）：紧凑布局，年视图改为双列

## 📝 开发说明

### 数据存储

- 任务数据存储在 localStorage，键为 `schedule-studio-data-v1`
- 语言偏好存储在 `schedule-studio-lang-v1`
- 季节主题存储在 `schedule-studio-season-v1`

### 添加新主题

1. 复制 `theme-template.css` 并重命名
2. 修改 `--accent`、`--accent-2`、`--accent-3` 等颜色变量
3. 在 `app.js` 的 `SEASONS` 数组中添加主题名称
4. 在 `index.html` 的季节选择器中添加对应按钮

---

## 📈 项目优化建议

### 当前问题

1. **JavaScript 代码过于庞大**：`app.js` 超过 40KB，所有逻辑混在一起，难以维护
2. **CSS 缺乏模块化**：单一大文件，样式组织不够清晰
3. **目录结构可优化**：资源分类可以更细粒度
4. **缺少构建工具**：没有压缩、热重载等开发体验优化
5. **无测试覆盖**：缺少单元测试和集成测试

### 优化方案

#### 1. 代码结构优化

**建议的目录结构**：

```
Schedule/
├── assets/
│   ├── css/
│   │   ├── base/           # 基础样式
│   │   │   ├── reset.css
│   │   │   ├── variables.css
│   │   │   └── typography.css
│   │   ├── components/     # 组件样式
│   │   │   ├── header.css
│   │   │   ├── sidebar.css
│   │   │   ├── calendar.css
│   │   │   ├── modal.css
│   │   │   └── buttons.css
│   │   ├── views/          # 视图样式
│   │   │   ├── year-view.css
│   │   │   ├── month-view.css
│   │   │   ├── week-view.css
│   │   │   └── day-view.css
│   │   ├── themes/         # 主题样式（可保留原位置或迁移）
│   │   └── styles.css      # 主入口（@import 其他文件）
│   └── js/
│       ├── modules/        # 功能模块
│       │   ├── storage.js  # 存储管理
│       │   ├── i18n.js     # 国际化
│       │   ├── theme.js    # 主题管理
│       │   └── utils.js    # 工具函数
│       ├── views/          # 视图模块
│       │   ├── YearView.js
│       │   ├── MonthView.js
│       │   ├── WeekView.js
│       │   └── DayView.js
│       ├── components/     # 组件模块
│       │   ├── TaskModal.js
│       │   └── SettingsPanel.js
│       └── app.js          # 应用入口
├── index.html
├── package.json
└── README.md
```

#### 2. 引入构建工具

**推荐配置**：

```json
{
  "name": "schedule-studio",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {},
  "devDependencies": {
    "vite": "^6.5.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

#### 3. 添加测试框架

```bash
npm install --save-dev jest @types/jest
```

#### 4. 代码规范

- 引入 ESLint 进行代码质量检查
- 配置 Prettier 进行代码格式化
- 添加 `.editorconfig` 统一编辑器配置

### 实施路径

| 步骤 | 任务 | 预估时间 |
|------|------|----------|
| 1 | 创建目录结构，拆分 CSS 文件 | 2小时 |
| 2 | 拆分 JavaScript 模块 | 4小时 |
| 3 | 配置 Vite + PostCSS | 1小时 |
| 4 | 添加 ESLint + Prettier | 1小时 |
| 5 | 编写单元测试 | 3小时 |
| 6 | 测试验证与修复 | 2小时 |

---

**License**: MIT