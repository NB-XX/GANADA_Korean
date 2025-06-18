import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Volume2, Book as BookIcon, Settings, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import type { Book } from './data/books';
import SettingsModal from './components/SettingsModal';
import SearchBar from './components/SearchBar';

// 定义SearchResult类型
interface SearchResult {
  type: '课文' | '语法' | '单词' | '听力' | '阅读';
  content: string;
  preview: string;
  bookId: number;
  lessonId: number;
  bookTitle: string;
  lessonTitle: string;
}

// 1. 定义LessonContent类型
interface LessonContent {
  课文: {
    sentences: {
      speaker: string;
      korean: string;
      chinese: string;
      audio: string;
    }[];
  };
  语法: {
    points: {
      title: string;
      explanation: string;
      examples: { korean: string; chinese: string }[];
    }[];
  };
  单词: {
    words: {
      korean: string;
      chinese: string;
      etymology: string;
      audio: string;
    }[];
  };
  听力: {
    exercises: {
      id: number;
      type: string;
      title: string;
      audio: string;
      question: string;
      options?: string[];
      answer: any;
      script: string;
    }[];
  };
  阅读: {
    passages: {
      title: string;
      content: string;
      translation: string;
    }[];
  };
}

// 新增：课程标题接口
interface LessonTitle {
  ko: string;
  zh: string;
}

interface LessonInfo {
  id: number;
  title: LessonTitle;
  subtitle: LessonTitle;
  resources?: {
    课文: { dialogue: string };
    语法: string;
    单词: string;
    听力: string;
    阅读: string;
  };
}

interface BookInfo {
  title: string;
  subtitle: string;
  lessons: {
    id: number;
    title: string;
    subtitle: string;
    resources?: {
      课文: { dialogue: string };
      语法: string;
      单词: string;
      听力: string;
      阅读: string;
    };
  }[];
}

interface LessonsData {
  books: {
    [key: string]: BookInfo;
  };
}

// Toast组件
const Toast: React.FC<{ message: string; show: boolean }> = ({ message, show }) => (
  <div
    className={`fixed left-1/2 bottom-8 z-50 px-6 py-3 rounded-lg text-white text-base font-medium shadow-lg transition-all duration-300
      ${show ? 'opacity-100 translate-x-[-50%]' : 'opacity-0 pointer-events-none translate-x-[-50%]'}
      bg-red-500
    `}
    style={{ transform: 'translateX(-50%)' }}
  >
    {message}
  </div>
);

// 修改Lesson类型定义
interface Lesson {
  id: number;
  title: string;
  subtitle: string;
  resources: {
    课文: { dialogue: string };
    语法: string;
    单词: string;
    听力: string;
    阅读: string;
  };
}

const App = () => {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'bookList', 'lesson', 'content'
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('课文');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [expandedGrammar, setExpandedGrammar] = useState<Record<number, boolean>>({});
  const [showListeningScript, setShowListeningScript] = useState<Record<number, boolean>>({});
  const [showReadingTranslation, setShowReadingTranslation] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 新增：记录当前播放的课文句子和单词索引、播放失败索引
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);
  const [playingWordIdx, setPlayingWordIdx] = useState<number | null>(null);
  const [failedSentenceIdx, setFailedSentenceIdx] = useState<number | null>(null);
  const [failedWordIdx, setFailedWordIdx] = useState<number | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState<string | null>(null);
  // Toast状态
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  // 全文播放控制
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playingAllIdx, setPlayingAllIdx] = useState<number | null>(null);
  const isPlayingAllRef = useRef(false);
  const [lessonsData, setLessonsData] = useState<LessonsData | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  // 设置相关状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved || 'medium';
  });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'default';
  });

  // 搜索相关状态
  const [searchCache, setSearchCache] = useState<Record<string, any>>({});

  // 加载books.json
  useEffect(() => {
    setBooksLoading(true);
    setBooksError(null);
    fetch('/src/data/books.json')
      .then(r => r.json())
      .then(setBooks)
      .catch(() => setBooksError('课程数据加载失败'))
      .finally(() => setBooksLoading(false));
  }, []);

  // 加载lessons.json
  useEffect(() => {
    setLessonsLoading(true);
    setLessonsError(null);
    fetch('/resources/text/lessons.json')
      .then(r => r.json())
      .then(setLessonsData)
      .catch(() => setLessonsError('课程标题数据加载失败'))
      .finally(() => setLessonsLoading(false));
  }, []);

  // 2. 监听selectedLesson变化，动态加载内容
  useEffect(() => {
    const loadContent = async () => {
      if (!selectedLesson) {
        setContent(null);
        return;
      }
      setLoading(true);
      setError(null);
      
      // 初始化默认内容结构
      const defaultContent: LessonContent = {
        课文: { sentences: [] },
        语法: { points: [] },
        单词: { words: [] },
        听力: { exercises: [] },
        阅读: { passages: [] }
      };

      try {
        // 课文
        try {
          const dialogueJson = await fetch(`/${selectedLesson.resources.课文.dialogue}`).then(r => r.json());
          defaultContent.课文.sentences = dialogueJson.sentences;
        } catch (e) {
          console.warn('课文内容加载失败:', e);
        }

        // 语法
        try {
          const grammar = await fetch(`/${selectedLesson.resources.语法}`).then(r => r.json());
          defaultContent.语法 = grammar;
        } catch (e) {
          console.warn('语法内容加载失败:', e);
        }

        // 单词
        try {
          const words = await fetch(`/${selectedLesson.resources.单词}`).then(r => r.json());
          defaultContent.单词 = words;
        } catch (e) {
          console.warn('单词内容加载失败:', e);
        }

        // 听力
        try {
          const listening = await fetch(`/${selectedLesson.resources.听力}`).then(r => r.json());
          defaultContent.听力 = listening;
        } catch (e) {
          console.warn('听力内容加载失败:', e);
        }

        // 阅读
        try {
          const reading = await fetch(`/${selectedLesson.resources.阅读}`).then(r => r.json());
          defaultContent.阅读 = reading;
        } catch (e) {
          console.warn('阅读内容加载失败:', e);
        }

        setContent(defaultContent);
      } catch (e) {
        setError('内容加载失败');
        setContent(null);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [selectedLesson]);

  // Toast状态
  const showToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  // 封装音频播放，支持失败Toast和打断
  const playAudioWithFeedback = async (audio: string, onFail?: () => void) => {
    stopCurrentAudio();
    if (!audio) {
      showToast('音频加载失败，请检查文件或重试');
      onFail && onFail();
      return;
    }
    return new Promise<void>((resolve) => {
      const audioEl = new window.Audio(audio);
      audioRef.current = audioEl;
      audioEl.onended = () => {
        audioRef.current = null;
        resolve();
      };
      audioEl.onerror = () => {
        showToast('音频加载失败，请检查文件或重试');
        audioRef.current = null;
        onFail && onFail();
        resolve();
      };
      audioEl.play().catch(() => {
        showToast('音频加载失败，请检查文件或重试');
        audioRef.current = null;
        onFail && onFail();
        resolve();
      });
    });
  };

  const playAudio = (audioFile: string) => {
    // 模拟音频播放
    console.log(`Playing audio: ${audioFile}`);
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  // 播放全文
  const playAllText = async () => {
    if (activeTab !== '课文' || !content?.课文.sentences) return;
    setIsPlaying(true);
    setIsPlayingAll(true);
    isPlayingAllRef.current = true;
    for (let i = 0; i < content.课文.sentences.length; i++) {
      if (!isPlayingAllRef.current) break;
      setPlayingAllIdx(i);
      const audio = content.课文.sentences[i].audio;
      if (audio) {
        await playAudioWithFeedback(audio);
      } else {
        showToast('音频加载失败，请检查文件或重试');
      }
    }
    setIsPlaying(false);
    setIsPlayingAll(false);
    setPlayingAllIdx(null);
    isPlayingAllRef.current = false;
  };

  // 暂停全文播放
  const pauseAllText = () => {
    setIsPlayingAll(false);
    setPlayingAllIdx(null);
    setIsPlaying(false);
    stopCurrentAudio();
    isPlayingAllRef.current = false;
  };

  // 播放单句
  const playSentence = async (audio: string, idx: number) => {
    setFailedSentenceIdx(null);
    setPlayingSentenceIdx(idx);
    setPlayingAllIdx(null);
    setIsPlayingAll(false);
    setIsPlaying(true);
    await playAudioWithFeedback(audio, () => setFailedSentenceIdx(idx));
    setIsPlaying(false);
    setPlayingSentenceIdx(null);
  };

  // 单词播放
  const playWord = async (audio: string, idx: number) => {
    setFailedWordIdx(null);
    setPlayingWordIdx(idx);
    setIsPlaying(true);
    await playAudioWithFeedback(audio, () => setFailedWordIdx(idx));
    setIsPlaying(false);
    setPlayingWordIdx(null);
  };

  const toggleGrammar = (index: number) => {
    setExpandedGrammar(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleListeningScript = (id: number) => {
    setShowListeningScript(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 停止当前音频
  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // 应用字体大小
  useEffect(() => {
    const root = document.documentElement;
    switch (fontSize) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'medium':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
    }
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // 应用主题
  useEffect(() => {
    const root = document.documentElement;
    switch (theme) {
      case 'default':
        root.classList.remove('theme-eye-care', 'theme-dark');
        break;
      case 'eye-care':
        root.classList.remove('theme-dark');
        root.classList.add('theme-eye-care');
        break;
      case 'dark':
        root.classList.remove('theme-eye-care');
        root.classList.add('theme-dark');
        break;
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 搜索函数
  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    // 检查缓存
    if (searchCache[query]) {
      return searchCache[query];
    }

    const results: SearchResult[] = [];

    // 遍历所有书籍和课程
    for (const book of books) {
      for (const lesson of book.lessons) {
        try {
          // 搜索课文
          if (lesson.resources.课文) {
            const dialogue = await fetch(`/${lesson.resources.课文.dialogue}`).then(r => r.json());
            dialogue.sentences.forEach((sentence: any) => {
              if (sentence.korean.includes(query) || sentence.chinese.includes(query)) {
                results.push({
                  type: '课文',
                  content: sentence.korean,
                  preview: sentence.chinese,
                  bookId: book.id,
                  lessonId: lesson.id,
                  bookTitle: `${book.level}${book.id}`,
                  lessonTitle: `第${lesson.id}课`
                });
              }
            });
          }

          // 搜索语法
          if (lesson.resources.语法) {
            const grammar = await fetch(`/${lesson.resources.语法}`).then(r => r.json());
            grammar.points.forEach((point: any) => {
              if (point.title.includes(query) || point.explanation.includes(query)) {
                results.push({
                  type: '语法',
                  content: point.title,
                  preview: point.explanation,
                  bookId: book.id,
                  lessonId: lesson.id,
                  bookTitle: `${book.level}${book.id}`,
                  lessonTitle: `第${lesson.id}课`
                });
              }
            });
          }

          // 搜索单词
          if (lesson.resources.单词) {
            const words = await fetch(`/${lesson.resources.单词}`).then(r => r.json());
            words.words.forEach((word: any) => {
              if (word.korean.includes(query) || word.chinese.includes(query)) {
                results.push({
                  type: '单词',
                  content: word.korean,
                  preview: word.chinese,
                  bookId: book.id,
                  lessonId: lesson.id,
                  bookTitle: `${book.level}${book.id}`,
                  lessonTitle: `第${lesson.id}课`
                });
              }
            });
          }

          // 搜索听力
          if (lesson.resources.听力) {
            const listening = await fetch(`/${lesson.resources.听力}`).then(r => r.json());
            listening.exercises.forEach((exercise: any) => {
              if (exercise.title.includes(query) || exercise.script.includes(query)) {
                results.push({
                  type: '听力',
                  content: exercise.title,
                  preview: exercise.script,
                  bookId: book.id,
                  lessonId: lesson.id,
                  bookTitle: `${book.level}${book.id}`,
                  lessonTitle: `第${lesson.id}课`
                });
              }
            });
          }

          // 搜索阅读
          if (lesson.resources.阅读) {
            const reading = await fetch(`/${lesson.resources.阅读}`).then(r => r.json());
            reading.passages.forEach((passage: any) => {
              if (passage.title.includes(query) || passage.content.includes(query)) {
                results.push({
                  type: '阅读',
                  content: passage.title,
                  preview: passage.content,
                  bookId: book.id,
                  lessonId: lesson.id,
                  bookTitle: `${book.level}${book.id}`,
                  lessonTitle: `第${lesson.id}课`
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error searching in book ${book.id} lesson ${lesson.id}:`, error);
        }
      }
    }

    // 更新缓存
    setSearchCache(prev => ({
      ...prev,
      [query]: results
    }));

    return results;
  };

  // 处理搜索结果点击
  const handleSearchResultClick = (result: SearchResult) => {
    const book = books.find(b => b.id === result.bookId);
    if (!book) return;

    const lesson = book.lessons.find(l => l.id === result.lessonId);
    if (!lesson) return;

    setSelectedBook(book);
    setSelectedLesson({
      ...lesson,
      resources: lesson.resources
    });
    setCurrentView('lesson');
    setActiveTab(result.type);
  };

  // 首页
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">韩语学习</h1>
          </div>
          <Settings 
            className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800" 
            onClick={() => setIsSettingsOpen(true)}
          />
        </div>
        <div className="max-w-2xl mx-auto">
          <SearchBar
            onSearch={handleSearch}
            onResultClick={handleSearchResultClick}
          />
        </div>
      </div>

      {/* 我的图书 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">我的图书</h2>
        </div>
        {booksLoading && <div className="text-gray-500 p-4">课程加载中...</div>}
        {booksError && <div className="text-red-500 p-4">{booksError}</div>}
        {!booksLoading && !booksError && (
        <>
        {/* 初级 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">初级</h3>
          <div className="grid grid-cols-2 gap-4">
            {books.filter(book => book.level === '初级').map(book => (
              <div key={book.id} 
                   className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
                   onClick={() => {
                     setSelectedBook(book);
                     setCurrentView('bookList');
                   }}>
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-3">
                  {book.id <= 4 ? (
                    <img 
                      src={`/resources/img/cover/book${book.id}.jpg`}
                      alt={`${book.title}封面`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${book.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {book.id === 5 ? '고급1' : '고급2'}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-base font-medium text-gray-800">
                    {book.level}{book.id % 2 === 1 ? '1' : '2'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{book.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中级 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">中级</h3>
          <div className="grid grid-cols-2 gap-4">
            {books.filter(book => book.level === '中级').map(book => (
              <div key={book.id} 
                   className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
                   onClick={() => {
                     setSelectedBook(book);
                     setCurrentView('bookList');
                   }}>
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-3">
                  {book.id <= 4 ? (
                    <img 
                      src={`/resources/img/cover/book${book.id}.jpg`}
                      alt={`${book.title}封面`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${book.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {book.id === 5 ? '고급1' : '고급2'}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-base font-medium text-gray-800">
                    {book.level}{book.id % 2 === 1 ? '1' : '2'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{book.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 高级 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">高级</h3>
          <div className="grid grid-cols-2 gap-4">
            {books.filter(book => book.level === '高级').map(book => (
              <div key={book.id} 
                   className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
                   onClick={() => {
                     setSelectedBook(book);
                     setCurrentView('bookList');
                   }}>
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-3">
                  {book.id <= 4 ? (
                    <img 
                      src={`/resources/img/cover/book${book.id}.jpg`}
                      alt={`${book.title}封面`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${book.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {book.id === 5 ? '고급1' : '고급2'}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-base font-medium text-gray-800">
                    {book.level}{book.id % 2 === 1 ? '1' : '2'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{book.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );

  // 课程列表
  const BookList = () => {
    if (!selectedBook || !lessonsData) return null;

    const bookInfo = lessonsData.books[selectedBook.id.toString()];

    return (
      <div className="min-h-screen bg-gray-50">
        {/* 头部 */}
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
          <ChevronLeft 
            className="h-5 w-5 text-gray-600 cursor-pointer" 
            onClick={() => {
              setSelectedBook(null);
              setCurrentView('home');
            }}
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{bookInfo.title}</h1>
            <div className="text-sm text-gray-600">{bookInfo.subtitle}</div>
          </div>
        </div>

        {/* 课程列表 */}
        <div className="p-4">
          <div className="grid gap-4">
            {bookInfo.lessons.map(lesson => (
              <div 
                key={lesson.id}
                className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                onClick={() => {
                  const lessonResources = selectedBook.lessons.find(l => l.id === lesson.id)?.resources;
                  if (!lessonResources) {
                    showToast('课程资源加载失败');
                    return;
                  }
                  const lessonWithResources: Lesson = {
                    ...lesson,
                    resources: lessonResources
                  };
                  setSelectedLesson(lessonWithResources);
                  setCurrentView('lesson');
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-medium text-gray-800">{lesson.title}</div>
                    <div className="text-sm text-gray-600">{lesson.subtitle}</div>
                  </div>
                  <div className="text-sm text-gray-400">第{lesson.id}课</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 课程内容
  const LessonView = () => {
    if (!selectedLesson || !lessonsData) return null;
    if (loading) return <div className="p-8 text-center text-gray-500">内容加载中...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!content) return null;

    const bookInfo = lessonsData.books[selectedBook?.id.toString() || ''];
    const lessonInfo = bookInfo?.lessons.find(l => l.id === selectedLesson.id);

    // 3. 渲染逻辑改为使用content状态
    const renderContent = () => {
      switch (activeTab) {
        case '课文':
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">对话</h3>
                  <div className="flex gap-3">
                    {isPlayingAll ? (
                      <Pause className="h-5 w-5 text-blue-600 cursor-pointer" onClick={pauseAllText} />
                    ) : (
                      <Play className="h-5 w-5 text-blue-600 cursor-pointer" onClick={playAllText} />
                    )}
                    <Eye
                      className={`h-5 w-5 cursor-pointer ${showTranslation ? 'text-blue-600' : 'text-gray-400'}`}
                      onClick={() => setShowTranslation(!showTranslation)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {content.课文.sentences.map((sentence, index, arr) => {
                    const showSpeaker = index === 0 || sentence.speaker !== arr[index - 1].speaker;
                    const isActive = (isPlayingAll && playingAllIdx === index) || (!isPlayingAll && playingSentenceIdx === index);
                    return (
                      <div
                        key={index}
                        className={`space-y-1 rounded cursor-pointer transition-all
                          ${isActive ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-blue-50'}
                        `}
                        onClick={() => playSentence(sentence.audio, index)}
                      >
                        <div className="flex items-start gap-2 px-2 py-1">
                          <span className="text-sm text-gray-500 font-medium min-w-[60px] flex-shrink-0">
                            {showSpeaker ? sentence.speaker + '：' : ''}
                          </span>
                          <span className="text-gray-800">{sentence.korean}</span>
                        </div>
                        {showTranslation && (
                          <div className="ml-[68px] text-sm text-gray-600 px-2 pb-1">
                            {sentence.chinese}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        case '语法':
          return (
            <div className="space-y-4">
              {content.语法.points.map((point: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleGrammar(index)}
                  >
                    <h3 className="text-lg font-medium text-gray-800">{point.title}</h3>
                    {expandedGrammar[index] ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {expandedGrammar[index] && (
                    <div className="mt-4 space-y-4">
                      <p className="text-gray-600">{point.explanation}</p>
                      <div className="space-y-2">
                        {point.examples.map((example: any, i: number) => (
                          <div key={i} className="bg-gray-50 p-3 rounded">
                            <div className="text-gray-800">{example.korean}</div>
                            <div className="text-gray-600 text-sm">{example.chinese}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        case '单词':
          return (
            <div className="space-y-4">
              {content.单词.words.map((word: any, index: number) => (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-4 shadow-sm flex justify-between items-center cursor-pointer transition-all
                    ${playingWordIdx === index ? 'ring-2 ring-blue-400 bg-blue-100' : 'hover:bg-blue-50'}
                  `}
                  onClick={() => playWord(word.audio, index)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-gray-800">{word.korean}</span>
                      <span className="text-sm text-gray-500">({word.etymology})</span>
                    </div>
                    <div className="text-sm text-gray-600">{word.chinese}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        case '听力':
          return (
            <div className="space-y-6">
              {content.听力.exercises.map((exercise: any) => (
                <div key={exercise.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">{exercise.title}</h3>
                    <Play 
                      className="h-5 w-5 text-blue-600 cursor-pointer" 
                      onClick={() => playAudioWithFeedback(exercise.audio)}
                    />
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-800">{exercise.question}</p>
                    {exercise.type === 'choice' && exercise.options && (
                      <div className="space-y-2">
                        {exercise.options.map((option: string, index: number) => (
                          <div key={index} className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                    {exercise.type === 'judge' && (
                      <div className="flex gap-4">
                        <div className="p-3 border rounded cursor-pointer hover:bg-gray-50 flex-1 text-center">
                          正确
                        </div>
                        <div className="p-3 border rounded cursor-pointer hover:bg-gray-50 flex-1 text-center">
                          错误
                        </div>
                      </div>
                    )}
                    {exercise.type === 'short_answer' && (
                      <input
                        type="text"
                        className="w-full p-3 border rounded"
                        placeholder="请输入答案"
                      />
                    )}
                    <button 
                      className="text-sm text-blue-600"
                      onClick={() => toggleListeningScript(exercise.id)}
                    >
                      {showListeningScript[exercise.id] ? '隐藏原文' : '显示原文'}
                    </button>
                    {showListeningScript[exercise.id] && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {exercise.script}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        case '阅读':
          return (
            <div className="space-y-6">
              {content.阅读.passages.map((passage: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">{passage.title}</h3>
                    <Eye
                      className={`h-5 w-5 cursor-pointer ${showReadingTranslation ? 'text-blue-600' : 'text-gray-400'}`}
                      onClick={() => setShowReadingTranslation(!showReadingTranslation)}
                    />
                  </div>
                  <div className="space-y-4">
                    {passage.content.split('\n').map((paragraph: string, pIndex: number) => (
                      <div key={pIndex} className="space-y-1 rounded cursor-pointer transition-all hover:bg-blue-50">
                        <div className="text-gray-800 px-2 py-1">{paragraph}</div>
                        {showReadingTranslation && (
                          <div className="text-sm text-gray-600 px-2 pb-1">
                            {passage.translation.split('\n')[pIndex]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* 头部 */}
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
          <ChevronLeft 
            className="h-5 w-5 text-gray-600 cursor-pointer" 
            onClick={() => {
              setSelectedLesson(null);
              setCurrentView('bookList');
            }}
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{lessonInfo?.title}</h1>
            <div className="text-sm text-gray-600">{lessonInfo?.subtitle}</div>
          </div>
        </div>
        {/* 选项卡 */}
        <div className="bg-white border-b">
          <div className="flex">
            {['课文', '语法', '单词', '听力', '阅读'].map((tab: string) => (
              <div
                key={tab}
                className={`px-6 py-3 cursor-pointer ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
        {/* 内容区域 */}
        <div className="p-4">
          {renderContent()}
        </div>
        {/* Toast全局提示 */}
        <Toast message={toast.message} show={toast.show} />
      </div>
    );
  };

  // 渲染当前视图
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'bookList':
        return <BookList />;
      case 'lesson':
        return <LessonView />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      {renderView()}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        theme={theme}
        onThemeChange={setTheme}
      />
    </>
  );
};

export default App;