// 自动生成 books.json 的脚本
// 用法：node scripts/generateBooks.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LESSONS_ROOT = path.join(__dirname, '../resources/text/lessons');
const OUTPUT = path.join(__dirname, '../src/data/books.json');

function getLevelByBookId(bookId: number): string {
  if (bookId === 1 || bookId === 2) return '初级';
  if (bookId === 3 || bookId === 4) return '中级';
  if (bookId === 5 || bookId === 6) return '高级';
  return '';
}

function scanLessons() {
  const books: any[] = [];
  const bookDirs = fs.readdirSync(LESSONS_ROOT).filter(f => f.startsWith('book'));
  for (const bookDir of bookDirs) {
    const bookPath = path.join(LESSONS_ROOT, bookDir);
    const lessons: any[] = [];
    const lessonDirs = fs.readdirSync(bookPath)
      .filter(f => f.startsWith('lesson'))
      .sort((a, b) => {
        const na = parseInt(a.replace('lesson', ''));
        const nb = parseInt(b.replace('lesson', ''));
        return na - nb;
      });
    for (const lessonDir of lessonDirs) {
      const lessonPath = path.join(bookPath, lessonDir);
      // 资源文件
      const dialogue = path.relative(
        path.join(__dirname, '../'),
        path.join(lessonPath, 'dialogue.json')
      ).replace(/\\/g, '/');
      const grammar = path.relative(
        path.join(__dirname, '../'),
        path.join(lessonPath, 'grammar.json')
      ).replace(/\\/g, '/');
      const words = path.relative(
        path.join(__dirname, '../'),
        path.join(lessonPath, 'words.json')
      ).replace(/\\/g, '/');
      const listening = path.relative(
        path.join(__dirname, '../'),
        path.join(lessonPath, 'listening.json')
      ).replace(/\\/g, '/');
      const reading = path.relative(
        path.join(__dirname, '../'),
        path.join(lessonPath, 'reading.json')
      ).replace(/\\/g, '/');
      lessons.push({
        id: parseInt(lessonDir.replace('lesson', '')),
        title: lessonDir,
        subtitle: '',
        resources: {
          课文: { dialogue },
          语法: grammar,
          单词: words,
          听力: listening,
          阅读: reading
        }
      });
    }
    const bookId = parseInt(bookDir.replace('book', ''));
    books.push({
      id: bookId,
      title: bookDir,
      subtitle: '',
      level: getLevelByBookId(bookId),
      cover: '',
      color: '',
      lessons
    });
  }
  return books;
}

function main() {
  const books = scanLessons();
  fs.writeFileSync(OUTPUT, JSON.stringify(books, null, 2), 'utf-8');
  console.log('books.json generated:', OUTPUT);
}

main(); 