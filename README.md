# 教育词汇数据生产系统

基于 AI 的教育英语词汇内容自动化生产平台，覆盖「导入 → 生产 → 质检 → 入库」全流程。

---

## 系统概览

本系统面向学科产品团队，用于批量生产结构化的英语词汇教学内容。每个单词经过 AI 生成后，会自动进入多维度质检流程，问题内容进入修复队列，最终通过质检的内容入库为标准化数据。

### 核心流程

```
词表导入 → AI 内容生产（语块/例句/助记/音节） → 自动质检 → 异常修复 → 入库总表
```

### 数据维度

每个单词入库后包含以下结构化数据：

| 维度 | 说明 |
|------|------|
| 基础信息 | 单词、音标（IPA）、音节划分、学段 |
| 义项 | 词性、中文释义、教材来源 |
| 核心语块 | 每个义项下的高频搭配语块 |
| 例句 | 英文例句 + 中文翻译 |
| 助记 | 类型（词根词缀/音义联想/词中词/考试应用）、公式、口诀、老师话术 |
| 质量记录 | 异常字段、问题描述、修复次数 |

---

## 功能模块

### 1. 数据看板（Dashboard）

- 总览生产数据统计（总词数、合格率、异常数）
- Bad Case 分类展示，按维度查看原子标准违规情况
- 支持点击维度卡片展开查看详细的原子标准列表

### 2. 词表导入（Import）

- 上传 Excel/CSV 格式的词表文件
- 配置批次名称、目标学段
- 导入后自动创建生产批次，进入生产监控

### 3. 生产监控（Monitoring）

- 实时展示当前批次的生产进度（已入库/待修复/处理中）
- 可视化流水线动画，展示 Gate 1-3 质检过程
- 生产完成后提示异常数量，可跳转质检审核

### 4. 质检审核（Review）

- 展示所有未通过质检的异常词项
- 支持按错误类型筛选（语块/例句/助记/释义）
- 单词卡片展开后，**有问题的字段用红色背景+红色边框高亮标注**，缺失字段显示红色占位提示
- 一键 AI 修复：批量调用 AI 重新生成异常内容
- 人工修改：打开详情弹窗，直接编辑所有字段后保存入库
- 修复历史记录

### 5. 总表管理（Master Table）

- 分页浏览所有已入库单词（服务端分页，每页 50 条）
- 搜索过滤：按单词名搜索、按教材来源下拉筛选
- 批次筛选：通过「查看历史」选择特定批次的数据
- 点击单词弹出详情卡片，展示完整的入库数据（义项、语块、例句、助记、元信息）
- 支持导出

### 6. Prompt 管理

- 管理所有 AI 生成指令和质检指令
- 分为两大类：**内容生产**（7 个）和**质检校验**（5 个）
- 左右分栏布局：右侧列表点选，左侧展示详情
- 支持编辑 Prompt 的名称、描述、指令内容、默认模型
- 支持新建和删除 Prompt
- 支持一键复制指令内容

#### 内容生产 Prompt

| 名称 | 功能 |
|------|------|
| 语块 | 生成目标词在特定义项下的核心语块 |
| 例句 | 生成符合学段的英文例句和中文翻译 |
| 助记-词根词缀 | 基于词根词缀拆解生成助记方案 |
| 助记-音义联想 | 通过发音与含义联想生成助记 |
| 助记-词中词 | 从目标词中找出隐藏小词辅助记忆 |
| 助记-考试应用 | 生成基于考试应用场景的助记内容 |
| 音节 | 对目标词进行音节划分 |

#### 质检校验 Prompt

| 名称 | 功能 |
|------|------|
| 语块质检 | 校验语块是否包含目标词、贴合语境 |
| 例句质检 | 校验语法、义项匹配、难度适配、翻译准确性 |
| 助记质检 | 校验公式逻辑性、口诀可读性、内容完整性 |
| 释义质检 | 校验释义准确性、词性匹配、学段适配 |
| 音节质检 | 校验音节划分是否符合语音学规则 |

---

## 技术架构

### 前端

- **React 19** + **TypeScript**
- **Tailwind CSS 4** — 样式系统
- **Framer Motion** (`motion/react`) — 页面过渡与交互动画
- **Lucide React** — 图标库
- 玻璃拟态（Glass-morphism）设计风格，蓝黄白主色调

### 后端

- **Express** — API 服务
- **better-sqlite3** — 嵌入式 SQLite 数据库
- **tsx** — TypeScript 直接运行

### 开发工具

- **Vite 6** — 构建与 HMR
- Vite 作为 Express 的中间件运行，开发时一个端口同时提供 API 和前端

---

## 数据库结构

```
batches         — 导入批次
words           — 单词主表（word, ipa, syllables, grade_level, status）
meanings        — 义项表（pos, definition）
sources         — 教材来源（textbook）
content_items   — 内容项（dimension: chunk/sentence/mnemonic）
quality_issues  — 质量问题记录（field, issue, retry_count）
```

已建立的索引：`words(status)`, `words(word)`, `words(batch_id)`, `meanings(word_id)`, `sources(meaning_id)`, `content_items(word_id, dimension)`, `content_items(meaning_id, dimension)`, `quality_issues(word_id)`

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（前端 + API 一体）
npm run dev
```

启动后访问 `http://localhost:3000`

### 其他命令

```bash
# 生产构建
npm run build

# 类型检查
npm run lint

# 预览构建产物
npm run preview
```

---

## 项目结构

```
├── server.ts                  # Express 后端 + Vite 中间件 + 数据库初始化
├── src/
│   ├── App.tsx                # 主布局（侧边栏导航 + 路由）
│   ├── index.css              # 全局样式（玻璃拟态、渐变背景、动画）
│   ├── types.ts               # TypeScript 类型定义
│   ├── pages/
│   │   ├── DashboardPage.tsx  # 数据看板
│   │   ├── ImportPage.tsx     # 词表导入
│   │   ├── MonitoringPage.tsx # 生产监控
│   │   ├── ReviewPage.tsx     # 质检审核（含 WordCard + DetailModal）
│   │   ├── MasterTablePage.tsx# 总表管理（分页 + 详情弹窗）
│   │   └── PromptPage.tsx     # Prompt 管理（分类 + 编辑）
│   └── components/
│       └── BatchHistoryModal.tsx # 批次历史弹窗
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vocab.db                   # SQLite 数据库文件（运行时自动生成）
```

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取全局统计数据 |
| GET | `/api/words?page=&pageSize=&letter=&source=&batchId=` | 分页查询已入库单词 |
| GET | `/api/words/:id` | 获取单词完整详情 |
| PATCH | `/api/words/:id` | 更新单词数据并重新质检 |
| POST | `/api/words/:id/retry` | 对单个单词触发 AI 修复 |
| GET | `/api/pending-repair?search=&filter=&field=&batchId=` | 获取待修复单词列表 |
| POST | `/api/repair-all` | 批量 AI 修复所有可重试的异常项 |
| GET | `/api/jobs/:id` | 查询修复任务进度 |
| GET | `/api/batches` | 获取所有批次列表 |
| GET | `/api/batches/:id` | 获取批次详情 |
| POST | `/api/import` | 导入新词表 |
