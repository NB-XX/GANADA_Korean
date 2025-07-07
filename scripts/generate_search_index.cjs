const fs = require('fs');
const path = require('path');

const lessonsRoot = path.join(__dirname, '../resources/text/lessons');
const booksJsonPath = path.join(__dirname, '../resources/data/books.json');
const outputPath = path.join(__dirname, '../resources/data/search_index.json');

const tryReadJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
};

function getBookTitle(book) {
  // 中文格式：如"初级2"、"中级1"
  if (!book || !book.level || !book.id) return `Book${book?.id || ''}`;
  let num = book.id;
  let level = book.level;
  let n = (num % 2 === 1) ? '1' : '2';
  return `${level}${n}`;
}

function getLessonTitle(book, lessonId) {
  if (!book.lessons) return `第${lessonId}课`;
  const lesson = book.lessons.find(l => l.id === lessonId);
  return lesson ? `第${lesson.id}课` : `第${lessonId}课`;
}

function main() {
  const books = tryReadJson(booksJsonPath) || [];
  const index = [];

  fs.readdirSync(lessonsRoot).forEach(bookDir => {
    const bookPath = path.join(lessonsRoot, bookDir);
    if (!fs.statSync(bookPath).isDirectory()) return;
    const bookId = parseInt(bookDir.replace(/[^0-9]/g, ''));
    const bookInfo = books.find(b => b.id === bookId) || {};
    const bookTitle = getBookTitle(bookInfo);
    console.log(`[DEBUG] 处理bookDir: ${bookDir}, bookId: ${bookId}, bookTitle: ${bookTitle}`);

    fs.readdirSync(bookPath).forEach(lessonDir => {
      const lessonPath = path.join(bookPath, lessonDir);
      if (!fs.statSync(lessonPath).isDirectory()) return;
      const lessonId = parseInt(lessonDir.replace(/[^0-9]/g, ''));
      const lessonTitle = getLessonTitle(bookInfo, lessonId);
      console.log(`  [DEBUG] 处理lessonDir: ${lessonDir}, lessonId: ${lessonId}, lessonTitle: ${lessonTitle}`);

      // 课文
      const dialoguePath = path.join(lessonPath, 'dialogue.json');
      const dialogue = tryReadJson(dialoguePath);
      if (dialogue && Array.isArray(dialogue.sentences)) {
        console.log(`    [DEBUG] 课文: ${dialogue.sentences.length} 条`);
        dialogue.sentences.forEach(s => {
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
      } else {
        console.log(`    [DEBUG] 课文: 无`);
      }
      // 语法
      const grammarPath = path.join(lessonPath, 'grammar.json');
      const grammar = tryReadJson(grammarPath);
      if (grammar && Array.isArray(grammar.points)) {
        console.log(`    [DEBUG] 语法: ${grammar.points.length} 条`);
        grammar.points.forEach(p => {
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
      } else {
        console.log(`    [DEBUG] 语法: 无`);
      }
      // 单词
      const wordsPath = path.join(lessonPath, 'words.json');
      const words = tryReadJson(wordsPath);
      if (words && Array.isArray(words.words)) {
        console.log(`    [DEBUG] 单词: ${words.words.length} 条`);
        words.words.forEach(w => {
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
      } else {
        console.log(`    [DEBUG] 单词: 无`);
      }
      // 听力
      const listeningPath = path.join(lessonPath, 'listening.json');
      const listening = tryReadJson(listeningPath);
      if (listening && Array.isArray(listening.exercises)) {
        console.log(`    [DEBUG] 听力: ${listening.exercises.length} 条`);
        listening.exercises.forEach(e => {
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
      } else {
        console.log(`    [DEBUG] 听力: 无`);
      }
      // 阅读
      const readingPath = path.join(lessonPath, 'reading.json');
      const reading = tryReadJson(readingPath);
      if (reading && Array.isArray(reading.passages)) {
        console.log(`    [DEBUG] 阅读: ${reading.passages.length} 条`);
        reading.passages.forEach(p => {
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
      } else {
        console.log(`    [DEBUG] 阅读: 无`);
      }
    });
  });

  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`索引生成完毕，共 ${index.length} 条，输出到 ${outputPath}`);
}

main(); 