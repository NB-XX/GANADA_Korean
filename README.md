# 韩语学习前端项目

## 项目简介

本项目是一个现代化的韩语学习前端应用，支持课程、单词、语法、听力、阅读等多种学习内容，交互体验优秀，内容资源驱动，便于扩展和维护。

## 技术栈

- **React 18**：主流前端 UI 框架，组件化开发与响应式渲染。
- **TypeScript**：类型安全，提升开发体验与代码健壮性。
- **Vite**：新一代前端构建工具，极快的本地开发与构建速度。
- **Tailwind CSS**：原子化 CSS 框架，快速实现响应式美观界面。
- **Lucide React**：现代化图标库，丰富 UI 交互。
- **PostCSS/Autoprefixer**：CSS 兼容性处理。
- **资源驱动**：课程、单词、语法、听力、阅读等内容均以 JSON/文本资源驱动，前端动态加载，便于扩展和维护。

## 目录结构

```
korean_text_book2/
├── src/                        # 前端主代码
│   ├── App.tsx                 # 主应用组件
│   ├── data/
│   │   └── books.ts            # 图书/课程/资源路径配置
│   └── ...                     # 其他组件/入口
├── resources/                  # 课程内容资源
│   └── text/
│       └── lessons/
│           └── book1/
│               └── lesson1/
│                   ├── dialogue.json      # 课文（结构化，每句含音频/翻译）
│                   ├── grammar.json      # 语法点
│                   ├── words.json        # 单词
│                   ├── listening.json    # 听力
│                   ├── reading.json      # 阅读
│                   ├── ...               # 其他文本/资源
├── points/                     # 课程要点/练习（如有）
├── exercises/                  # 练习题相关资源
├── passages/                   # 阅读材料相关资源
├── words/                      # 单词相关资源
├── package.json                # 项目依赖与脚本
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── postcss.config.js           # PostCSS 配置
├── tsconfig.json               # TypeScript 配置
├── index.html                  # 入口 HTML
└── ...                         # 其他配置/依赖文件
```

## 主要特性

- 资源驱动，内容扩展灵活。
- 现代前端最佳实践，开发体验与性能兼顾。
- 交互体验佳，支持逐句/整篇音频播放、块级高亮等。
- 代码结构清晰，易于维护和二次开发。 