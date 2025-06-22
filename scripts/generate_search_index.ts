import fs from 'fs';
import path from 'path';

// 索引项类型定义
interface SearchIndexItem {
  type: '课文' | '语法' | '单词' | '听力' | '阅读';
  content: string;
  preview: string;
  bookId: number;
  lessonId: number;
  bookTitle: string;
  lessonTitle: string;
}

const lessonsRoot = path.join(__dirname, '../content/text/lessons');
const booksJsonPath = path.join(__dirname, '../content/data/books.json');
const outputPath = path.join(__dirname, '../content/data/search_index.json');

// 兼容实际目录结构
const tryReadJson = (filePath: string) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
};

function getBookTitle(books: any[], bookId: number) {
  const book = books.find(b => b.id === bookId);
  return book ? book.title : `Book${bookId}`;
}

function getLessonTitle(book: any, lessonId: number) {
  const lesson = book.lessons.find((l: any) => l.id === lessonId);
  return lesson ? lesson.title : `Lesson${lessonId}`;
}

function main() {
  const books = tryReadJson(booksJsonPath) || [];
  const index: SearchIndexItem[] = [];

  fs.readdirSync(lessonsRoot).forEach(bookDir => {
    const bookPath = path.join(lessonsRoot, bookDir);
    if (!fs.statSync(bookPath).isDirectory()) return;
    const bookId = parseInt(bookDir.replace(/[^0-9]/g, ''));
    const bookInfo = books.find((b: any) => b.id === bookId) || {};
    const bookTitle = bookInfo.title || bookDir;

    fs.readdirSync(bookPath).forEach(lessonDir => {
      const lessonPath = path.join(bookPath, lessonDir);
      if (!fs.statSync(lessonPath).isDirectory()) return;
      const lessonId = parseInt(lessonDir.replace(/[^0-9]/g, ''));
      const lessonTitle = getLessonTitle(bookInfo, lessonId);

      // 课文
      const dialoguePath = path.join(lessonPath, 'dialogue.json');
      const dialogue = tryReadJson(dialoguePath);
      if (dialogue && Array.isArray(dialogue.sentences)) {
        dialogue.sentences.forEach((s: any) => {
          index.push({
            type: '课文',
            content: s.korean,
            preview: s.chinese,
            bookId,
            lessonId,
            bookTitle,
            lessonTitle
          });
        });
      }
      // 语法
      const grammarPath = path.join(lessonPath, 'grammar.json');
      const grammar = tryReadJson(grammarPath);
      if (grammar && Array.isArray(grammar.points)) {
        grammar.points.forEach((p: any) => {
          index.push({
            type: '语法',
            content: p.title,
            preview: p.explanation,
            bookId,
            lessonId,
            bookTitle,
            lessonTitle
          });
        });
      }
      // 单词
      const wordsPath = path.join(lessonPath, 'words.json');
      const words = tryReadJson(wordsPath);
      if (words && Array.isArray(words.words)) {
        words.words.forEach((w: any) => {
          index.push({
            type: '单词',
            content: w.korean,
            preview: w.chinese,
            bookId,
            lessonId,
            bookTitle,
            lessonTitle
          });
        });
      }
      // 听力
      const listeningPath = path.join(lessonPath, 'listening.json');
      const listening = tryReadJson(listeningPath);
      if (listening && Array.isArray(listening.exercises)) {
        listening.exercises.forEach((e: any) => {
          index.push({
            type: '听力',
            content: e.title,
            preview: e.script,
            bookId,
            lessonId,
            bookTitle,
            lessonTitle
          });
        });
      }
      // 阅读
      const readingPath = path.join(lessonPath, 'reading.json');
      const reading = tryReadJson(readingPath);
      if (reading && Array.isArray(reading.passages)) {
        reading.passages.forEach((p: any) => {
          index.push({
            type: '阅读',
            content: p.title,
            preview: p.content,
            bookId,
            lessonId,
            bookTitle,
            lessonTitle
          });
        });
      }
    });
  });

  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`索引生成完毕，共 ${index.length} 条，输出到 ${outputPath}`);
}

main(); 