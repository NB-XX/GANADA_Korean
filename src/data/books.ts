export interface Book {
  id: number;
  title: string;
  subtitle: string;
  level: string;
  cover: string;
  color: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  title: string;
  subtitle: string;
  resources: LessonResources;
}

export interface LessonResources {
  课文: {
    dialogue: string;     // path to dialogue.kr.txt
    translation: string;  // path to dialogue.cn.txt
    audio: string;       // path to dialogue.mp3
  };
  语法: string;          // path to grammar.json
  单词: string;          // path to words.json
  听力: string;          // path to listening.json
  阅读: string;          // path to reading.json
}

export const books: Book[] = [
  {
    id: 1,
    title: '新轻松学韩语',
    subtitle: '初级上册',
    level: '初级',
    cover: 'https://via.placeholder.com/120x160/FFD700/000000?text=초급1',
    color: 'bg-yellow-400',
    lessons: [
      {
        id: 1,
        title: '안녕하세요',
        subtitle: '你好',
        resources: {
          课文: {
            dialogue: 'resources/text/lessons/book1/lesson1/dialogue.json',
            translation: '',
            audio: 'resources/audio/lessons/book1/lesson1/dialogue.mp3'
          },
          语法: 'resources/text/lessons/book1/lesson1/grammar.json',
          单词: 'resources/text/lessons/book1/lesson1/words.json',
          听力: 'resources/text/lessons/book1/lesson1/listening.json',
          阅读: 'resources/text/lessons/book1/lesson1/reading.json'
        }
      }
    ]
  },
  {
    id: 2,
    title: '新轻松学韩语',
    subtitle: '初级下册',
    level: '初级',
    cover: 'https://via.placeholder.com/120x160/FFD700/000000?text=초급2',
    color: 'bg-yellow-400',
    lessons: []
  },
  {
    id: 3,
    title: '新轻松学韩语',
    subtitle: '中级上册',
    level: '中级',
    cover: 'https://via.placeholder.com/120x160/FF6B35/000000?text=중급1',
    color: 'bg-orange-400',
    lessons: []
  },
  {
    id: 4,
    title: '新轻松学韩语',
    subtitle: '中级下册',
    level: '中级',
    cover: 'https://via.placeholder.com/120x160/FF6B35/000000?text=중급2',
    color: 'bg-orange-400',
    lessons: []
  },
  {
    id: 5,
    title: '新轻松学韩语',
    subtitle: '高级上册',
    level: '高级',
    cover: 'https://via.placeholder.com/120x160/FF4757/000000?text=고급1',
    color: 'bg-red-400',
    lessons: []
  },
  {
    id: 6,
    title: '新轻松学韩语',
    subtitle: '高级下册',
    level: '高级',
    cover: 'https://via.placeholder.com/120x160/FF4757/000000?text=고급2',
    color: 'bg-red-400',
    lessons: []
  }
];