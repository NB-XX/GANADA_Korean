# Ganada Korean E-Textbook | 新轻松学韩语电子课本

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/NB-XX/GANADA_Korean)
[![Stars](https://img.shields.io/github/stars/NB-XX/GANADA_Korean?style=social)](https://github.com/NB-XX/GANADA_Korean)

An modern e-textbook for Korean language learners, based on the "Ganada Korean" (新轻松学韩语) textbook series. This project integrates various learning resources such as lessons, vocabulary, grammar, listening, and reading into a seamless, interactive experience.

面向韩语学习者的现代化电子课本，基于《新轻松学韩语》教材内容，集课程、单词、语法、听力、阅读等多种学习资源于一体。

## 📚 Live Demo | 在线演示

Check out the live version of the textbook:

**[https://korean-textbook.pages.dev](https://korean-textbook.pages.dev)**

## 📸 Screenshots | 项目截图

*(Here you can add some screenshots of the application. For example:)*

| Homepage                                 | Lesson View                              |
| ---------------------------------------- | ---------------------------------------- |
| ![Homepage](https://via.placeholder.com/400x250.png?text=Homepage+Screenshot) | ![Lesson View](https://via.placeholder.com/400x250.png?text=Lesson+View+Screenshot) |

## ✨ Features | 主要特性

- **Resource-Driven**: All content is loaded from structured resource files (JSON/text), making it easy to extend and maintain.
  - **资源驱动**：所有内容均以结构化资源文件（JSON/文本）驱动，便于内容扩展和维护。
- **Interactive Audio**: Play audio for entire lessons or sentence by sentence, perfect for listening and shadowing practice.
  - **逐句/整篇音频播放**：支持课文逐句、整篇音频播放，提升听力与跟读体验。
- **Synchronized Highlighting**: Text blocks are highlighted in sync with audio playback, creating an immersive learning experience.
  - **块级高亮**：交互式高亮课文块，配合音频同步，增强学习沉浸感。
- **Flexible Content Extension**: Easily add new textbooks, lessons, audio, and exercises without changing the frontend code.
  - **内容扩展灵活**：可轻松添加新课本、课次、音频、练习等资源，无需修改前端代码。
- **Modern Tech Stack**: Built with modern frontend best practices for high performance, responsiveness, and maintainability.
  - **现代前端最佳实践**：高性能、响应式、易维护，适合二次开发。

## 🛠️ Tech Stack | 技术栈

- **React 18**: A popular frontend UI framework for building component-based and reactive interfaces.
- **TypeScript**: Ensures type safety, improving the developer experience and code robustness.
- **Vite**: A next-generation frontend build tool for extremely fast local development and builds.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building beautiful, responsive designs.
- **Lucide React**: A modern icon library to enrich the UI.
- **PostCSS/Autoprefixer**: For handling CSS vendor prefixes and compatibility.
- **Resource-Driven Architecture**: All content is dynamically loaded from external JSON/text files.

## 📂 Directory Structure | 目录结构

```
GANADA_Korean/
├── src/                        # Main frontend source code
│   ├── App.tsx                 # Main application component
│   ├── data/                   # Configuration for books/lessons/resources
│   └── components/             # Main UI components
├── resources/                  # Lesson content and multimedia assets
│   ├── text/                   # Text resources (lessons, words, grammar)
│   │   └── lessons/
│   │       └── book1/lesson1/  # Organized by book/lesson
│   │           ├── dialogue.json   # Structured lesson text
│   │           ├── grammar.json    # Grammar points
│   │           ├── words.json      # Vocabulary
│   │           └── ...
│   ├── audio/                   # Audio resources (organized by book/lesson)
│   └── data/                    # Global data (book info, search index)
├── package.json                # Project dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── ...                         # Other configuration files
```

## 🚀 Getting Started | 快速开始

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npm run dev
    ```
3.  **Open in your browser:** `http://localhost:5173`

## 🧩 Content Extension Guide | 内容扩展说明

- **Add New Lessons**: Add new resource files to `resources/text/lessons/` and `resources/audio/lessons/` following the `bookX/lessonY` structure.
- **Add New Materials**: Add new JSON or text files for exercises, points, or reading materials to the corresponding directories.
- **File Structure**: It is recommended to follow the existing file structure and field names to ensure compatibility.

## 🤝 Contributing | 贡献

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

欢迎参与贡献！如果你有任何想法、建议或发现 BUG，请提交 Issue 或 Pull Request。

## 📄 License | 许可证

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

本项目基于 MIT 许可证开源。详情请见 [LICENSE](LICENSE) 文件。
