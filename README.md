# 新轻松学韩语电子课本

## 项目简介

本项目是面向韩语学习者的现代化电子课本，基于《新轻松学韩语》教材内容，集课程、单词、语法、听力、阅读等多种学习资源于一体。项目采用资源驱动架构，支持内容灵活扩展，具备优秀的交互体验和现代前端最佳实践。

适用对象：韩语初学者及进阶学习者、教师、教辅内容开发者。

## 技术栈

- **React 18**：主流前端 UI 框架，组件化开发与响应式渲染。
- **TypeScript**：类型安全，提升开发体验与代码健壮性。
- **Vite**：新一代前端构建工具，极快的本地开发与构建速度。
- **Tailwind CSS**：原子化 CSS 框架，快速实现响应式美观界面。
- **Lucide React**：现代化图标库，丰富 UI 交互。
- **PostCSS/Autoprefixer**：CSS 兼容性处理。
- **资源驱动**：所有课程、单词、语法、听力、阅读等内容均以 JSON/文本资源驱动，前端动态加载，便于扩展和维护。

## 目录结构

```
GANADA_Korean/
├── src/                        # 前端主代码
│   ├── App.tsx                 # 主应用组件
│   ├── data/                   # 图书/课程/资源路径配置
│   └── components/             # 主要UI组件
├── resources/                  # 课程内容与多媒体资源
│   ├── text/                   # 课文、单词、语法等文本资源
│   │   └── lessons/
│   │       └── book1/lesson1/  # 以课本/课次分级
│   │           ├── dialogue.json   # 课文（结构化，每句含音频/翻译）
│   │           ├── grammar.json    # 语法点
│   │           ├── words.json      # 单词
│   │           ├── listening.json  # 听力
│   │           ├── reading.json    # 阅读
│   │           └── ...
│   ├── audio/                   # 音频资源（按课本/课次分级）
│   └── data/                    # 图书、索引等全局数据
├── exercises/                  # 练习题相关资源
├── points/                     # 课程要点/练习
├── passages/                   # 阅读材料相关资源
├── package.json                # 项目依赖与脚本
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── postcss.config.js           # PostCSS 配置
├── tsconfig.json               # TypeScript 配置
├── index.html                  # 入口 HTML
└── ...                         # 其他配置/依赖文件
```

## 主要特性

- **资源驱动**：所有内容均以结构化资源文件（JSON/文本）驱动，便于内容扩展和维护。
- **逐句/整篇音频播放**：支持课文逐句、整篇音频播放，提升听力与跟读体验。
- **块级高亮**：交互式高亮课文块，配合音频同步，增强学习沉浸感。
- **内容扩展灵活**：可轻松添加新课本、课次、音频、练习等资源，无需修改前端代码。
- **现代前端最佳实践**：高性能、响应式、易维护，适合二次开发。

## 快速开始

1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动开发环境：
   ```bash
   npm run dev
   ```
3. 访问本地：http://localhost:5173

## 内容扩展说明

- 新增课本/课次：在 `resources/text/lessons/` 和 `resources/audio/lessons/` 下按 bookX/lessonY 结构添加对应资源文件。
- 新增练习/要点/阅读材料：在 `exercises/`、`points/`、`passages/` 目录下添加对应 JSON 或文本文件。
- 所有资源文件结构建议参考现有样例，保持字段一致性。

---

如需定制开发或内容合作，请联系项目维护者。 