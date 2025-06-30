import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Book as BookIcon, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import type { Book } from './data/books';
import SettingsModal from './components/SettingsModal';
import SearchBar from './components/SearchBar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmptyContent from './components/EmptyContent';
import BackToTopButton from './components/BackToTopButton';

// 定义字体大小映射
const fontSizeMapping: { [key: string]: string } = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.125rem',
};

// 定义SearchResult类型
interface SearchResult {
  type: '课文' | '语法' | '单词' | '阅读';
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
  阅读: {
    passages: {
      title: string;
      translated_title: string;
      content: string;
      translation: string;
    }[];
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
    阅读: string;
  };
}

const SEARCH_TYPES = [
  { label: '全部', value: '全部' },
  { label: '课文', value: '课文' },
  { label: '语法', value: '语法' },
  { label: '单词', value: '单词' },
  { label: '阅读', value: '阅读' },
];

const App = () => {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'bookList', 'lesson', 'content'
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('课文');
  const [showTranslation, setShowTranslation] = useState(false);
  const [expandedGrammar, setExpandedGrammar] = useState<Record<number, boolean>>({});
  const [showReadingTranslation, setShowReadingTranslation] = useState<Record<number, boolean>>({});
  const [showBackToTop, setShowBackToTop] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 新增：记录当前播放的课文句子和单词索引、播放失败索引
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);
  const [playingWordIdx, setPlayingWordIdx] = useState<number | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  // Toast状态
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  // 全文播放控制
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playingAllIdx, setPlayingAllIdx] = useState<number | null>(null);
  const isPlayingAllRef = useRef(false);
  const [lessonsData, setLessonsData] = useState<LessonsData | null>(null);
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
  // 搜索索引相关状态
  const [searchIndex, setSearchIndex] = useState<any[] | null>(null);
  const [searchIndexLoading, setSearchIndexLoading] = useState(true);
  const [searchIndexError, setSearchIndexError] = useState<string | null>(null);

  const [isSearchPage, setIsSearchPage] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchType, setSearchType] = useState('全部');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 监听滚动，控制返回顶部按钮显隐
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 加载books.json
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/resources/data/books.json')
      .then(r => r.json())
      .then(setBooks)
      .catch(() => setError('课程数据加载失败'))
      .finally(() => setLoading(false));
  }, []);

  // 加载lessons.json
  useEffect(() => {
    fetch('/resources/text/lessons.json')
      .then(r => r.json())
      .then(setLessonsData);
  }, []);

  // 加载search_index.json
  useEffect(() => {
    setSearchIndexLoading(true);
    setSearchIndexError(null);
    fetch('/resources/data/search_index.json')
      .then(r => {
        if (!r.ok) throw new Error('索引文件加载失败');
        return r.json();
      })
      .then(setSearchIndex)
      .catch(() => setSearchIndexError('搜索索引加载失败'))
      .finally(() => setSearchIndexLoading(false));
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
        阅读: { passages: [] },
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

  // 播放全文
  const playAllText = async () => {
    if (activeTab !== '课文' || !content?.课文.sentences) return;
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
    setIsPlayingAll(false);
    setPlayingAllIdx(null);
    isPlayingAllRef.current = false;
  };

  // 暂停全文播放
  const pauseAllText = () => {
    setIsPlayingAll(false);
    setPlayingAllIdx(null);
    stopCurrentAudio();
    isPlayingAllRef.current = false;
  };

  // 播放单句
  const playSentence = async (audio: string, idx: number) => {
    setPlayingSentenceIdx(idx);
    setPlayingAllIdx(null);
    setIsPlayingAll(false);
    await playAudioWithFeedback(audio);
    setPlayingSentenceIdx(null);
  };

  // 单词播放
  const playWord = async (audio: string, idx: number) => {
    setPlayingWordIdx(idx);
    setIsPlayingAll(false);
    await playAudioWithFeedback(audio);
    setPlayingWordIdx(null);
  };

  const toggleGrammar = (index: number) => {
    setExpandedGrammar(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
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
    if (searchIndexLoading) {
      showToast('索引加载中，请稍候...');
      return [];
    }
    if (searchIndexError || !searchIndex) {
      showToast('搜索索引加载失败，请刷新页面');
      return [];
    }
    // 检查缓存
    if (searchCache[query]) {
      return searchCache[query];
    }
    // 本地过滤
    const results = searchIndex.filter(item =>
      item.content.includes(query) || item.preview.includes(query)
    );
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

  // 搜索页组件
  const SearchPage = () => {
    // 过滤结果
    const filteredResults = searchType === '全部'
      ? searchResults
      : searchResults.filter(r => r.type === searchType);

    const [isComposing, setIsComposing] = useState(false);
    const [inputValue, setInputValue] = useState(searchInput);

    useEffect(() => {
      // 自动聚焦
      searchInputRef.current?.focus();
    }, []);

    // 提交搜索
    const handleSearchSubmit = async () => {
      setSearchInput(inputValue);
      const results = await handleSearch(inputValue);
      setSearchResults(results);
      setSearchType('全部');
    };

    return (
      <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col transition-all duration-300 animate-fade-in">
        {/* 顶部搜索栏 */}
        <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-2 flex flex-col items-center">
          <div className="w-full flex items-center gap-2">
            <button
              className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setIsSearchPage(false)}
              aria-label="返回"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            {/* 标签+输入框一行 */}
            <div className="flex flex-1 items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
              {/* 标签 */}
              <button
                className={`h-full px-3 py-1 text-sm font-semibold rounded-none focus:outline-none transition-all whitespace-nowrap
                  ${searchType === '全部' ? 'bg-gray-100 text-gray-500' :
                    searchType === '课文' ? 'bg-blue-100 text-blue-600' :
                    searchType === '语法' ? 'bg-green-100 text-green-600' :
                    searchType === '单词' ? 'bg-yellow-100 text-yellow-700' :
                    searchType === '阅读' ? 'bg-pink-100 text-pink-600' :
                    'bg-gray-100 text-gray-500'}
                `}
                style={{ borderRight: '1px solid #e5e7eb', height: '40px' }}
                onClick={() => {
                  // 弹出下拉菜单或循环切换
                  const idx = SEARCH_TYPES.findIndex(t => t.value === searchType);
                  const next = SEARCH_TYPES[(idx + 1) % SEARCH_TYPES.length];
                  setSearchType(next.value);
                }}
                tabIndex={0}
              >
                {SEARCH_TYPES.find(t => t.value === searchType)?.label || '全部'}
              </button>
              {/* 输入框 */}
              <input
                ref={searchInputRef}
                className="flex-1 px-4 py-2 text-lg bg-white border-0 outline-none focus:ring-0"
                placeholder="搜索课文、语法、单词、阅读..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !isComposing) {
                    handleSearchSubmit();
                  }
                  if (e.key === 'Escape') setIsSearchPage(false);
                }}
                style={{ minWidth: 0 }}
              />
              {/* 搜索按钮 */}
              <button
                className="px-3 text-blue-500 hover:text-blue-700 focus:outline-none"
                onClick={handleSearchSubmit}
                tabIndex={-1}
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
              </button>
            </div>
          </div>
        </div>
        {/* 结果区 */}
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 pb-8 overflow-y-auto mt-2">
          {inputValue.trim() === '' ? (
            <div className="text-gray-400 text-center mt-16">请输入关键词进行搜索</div>
          ) : filteredResults.length === 0 ? (
            <div className="text-gray-400 text-center mt-16">未找到相关内容</div>
          ) : (
            <div className="space-y-4 mt-4">
              {filteredResults.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all border border-gray-100"
                  onClick={() => {
                    setIsSearchPage(false);
                    handleSearchResultClick(result);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      result.type === '课文' ? 'bg-blue-100 text-blue-600' :
                      result.type === '语法' ? 'bg-green-100 text-green-600' :
                      result.type === '单词' ? 'bg-yellow-100 text-yellow-700' :
                      result.type === '阅读' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{result.type}</span>
                    <span className="text-gray-700 font-medium truncate">{result.bookTitle} {result.lessonTitle}</span>
                  </div>
                  <div className="text-gray-900 font-semibold truncate">{result.preview}</div>
                  <div className="text-gray-500 text-sm truncate">{result.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 首页
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      {/* 顶部标题 */}
      <div className="bg-white shadow-sm px-4 py-6 flex flex-col items-center w-full">
        <div className="flex items-center gap-3 mb-4">
          <BookIcon className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">新轻松学韩语 电子课本</h1>
        </div>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-3xl">
            <SearchBar
              onSearch={handleSearch}
              onResultClick={handleSearchResultClick}
              loading={searchIndexLoading}
              error={searchIndexError}
              onFocus={() => setIsSearchPage(true)}
            />
          </div>
        </div>
      </div>
      {/* 自适应网格书架 */}
      <div className="flex-1 w-full flex flex-col items-center justify-center py-10 px-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {books.filter(book => book.id >= 1 && book.id <= 4).map(book => (
            <div
              key={book.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-transform duration-200 hover:scale-105 p-4 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setSelectedBook(book);
                setCurrentView('bookList');
              }}
            >
              <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-3">
                <img
                  src={`/resources/img/cover/book${book.id}.jpg`}
                  alt={`${book.title}封面`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center w-full">
                <div className="text-base font-semibold text-gray-800 truncate">{book.title}</div>
                <div className="text-sm text-gray-500 mt-1 truncate">{book.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
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
      const emptyMessage = `第 ${selectedLesson.id} 课暂无${activeTab}内容`;
      switch (activeTab) {
        case '课文':
          if (!content.课文?.sentences || content.课文.sentences.length === 0) {
            return <EmptyContent message={emptyMessage} imageUrl="/resources/img/icon/404.png" />;
          }
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">对话</h3>
                  <div className="flex gap-3 items-center">
                    {isPlayingAll ? (
                      <Pause className="h-5 w-5 text-blue-600 cursor-pointer" onClick={pauseAllText} />
                    ) : (
                      <Play className="h-5 w-5 text-blue-600 cursor-pointer" onClick={playAllText} />
                    )}
                    <Eye
                      className={`h-5 w-5 cursor-pointer transition-colors ${content.课文.sentences.length === 0 ? 'text-gray-300 cursor-not-allowed' : showTranslation ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                      onClick={() => {
                        if (content.课文.sentences.length === 0) return;
                        setShowTranslation(!showTranslation);
                      }}
                      style={{ pointerEvents: content.课文.sentences.length === 0 ? 'none' : 'auto' }}
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
          if (!content.语法?.points || content.语法.points.length === 0) {
            return <EmptyContent message={emptyMessage} imageUrl="/resources/img/icon/404.png" />;
          }
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
                      <div className="text-gray-600 whitespace-pre-line">
                        <ReactMarkdown>{point.explanation}</ReactMarkdown>
                      </div>
                      {point.table && (
                        <div className="table-container">
                          <div className="table-scroll">
                            <div className="table-content grammar-table">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({node, ...props}) => (
                                    <table className="min-w-max border-collapse" {...props} />
                                  )
                                }}
                              >
                                {point.table}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
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
          if (!content.单词?.words || content.单词.words.length === 0) {
            return <EmptyContent message={emptyMessage} imageUrl="/resources/img/icon/404.png" />;
          }
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
                      {word.etymology && (
                        <span className="text-sm text-gray-500">({word.etymology})</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{word.chinese}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        case '阅读':
          if (!content.阅读?.passages || content.阅读.passages.length === 0) {
            return <EmptyContent message={emptyMessage} imageUrl="/resources/img/icon/404.png" />;
          }
          return (
            <div className="space-y-8">
              {content.阅读.passages.map((passage: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="border-b pb-4 mb-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{passage.title}</h3>
                      {passage.translated_title && (
                        <p className="text-md text-gray-500 mt-1">{passage.translated_title}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowReadingTranslation(prev => ({ ...prev, [index]: !prev[index] }))}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      {showReadingTranslation[index] ? '隐藏译文' : '显示译文'}
                    </button>
                  </div>
                  
                  {/* 原文部分 */}
                  <div>
                    {passage.content.split('\n').map((paragraph: string, pIndex: number) => (
                      <div key={pIndex} className="text-gray-800 px-2 py-1 leading-relaxed text-justify">
                        {paragraph}
                      </div>
                    ))}
                  </div>
                  
                  {/* 译文部分 */}
                  {showReadingTranslation[index] && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="text-sm font-medium text-gray-700 mb-3">译文</div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {passage.translation.split('\n').map((paragraph: string, pIndex: number) => (
                          <div key={pIndex} className="text-gray-600 px-2 py-1 leading-relaxed text-justify">
                            {paragraph}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
          <div className="flex w-full">
            {['课文', '语法', '单词', '阅读'].map((tab: string) => (
              <div
                key={tab}
                className={`flex-1 min-w-0 text-center py-3 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis transition-all
                  ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}
                  text-[clamp(12px,3vw,16px)] font-medium`}
                onClick={() => setActiveTab(tab)}
                style={{ userSelect: 'none' }}
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
    if (isSearchPage) return <SearchPage />;
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
    <div className={`theme-${theme}`} style={{ fontSize: fontSizeMapping[fontSize] }}>
      <div className="min-h-screen bg-background text-foreground">
        {renderView()}
        <Toast message={toast.message} show={toast.show} />
        {showBackToTop && currentView !== 'home' && (
          <BackToTopButton onClick={scrollToTop} />
        )}
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
};

export default App;