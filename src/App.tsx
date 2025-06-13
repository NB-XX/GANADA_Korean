import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Volume2, Book as BookIcon, Settings, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import type { Book, Lesson } from './data/books';

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
  // 停止当前音频
  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

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

  // 2. 监听selectedLesson变化，动态加载内容
  useEffect(() => {
    const loadContent = async () => {
      if (!selectedLesson) {
        setContent(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // 课文
        const dialogueJson = await fetch(`/${selectedLesson.resources.课文.dialogue}`).then(r => r.json());
        // 语法
        const grammar = await fetch(`/${selectedLesson.resources.语法}`).then(r => r.json());
        // 单词
        const words = await fetch(`/${selectedLesson.resources.单词}`).then(r => r.json());
        // 听力
        const listening = await fetch(`/${selectedLesson.resources.听力}`).then(r => r.json());
        // 阅读
        const reading = await fetch(`/${selectedLesson.resources.阅读}`).then(r => r.json());
        setContent({
          课文: {
            sentences: dialogueJson.sentences,
          },
          语法: grammar,
          单词: words,
          听力: listening,
          阅读: reading,
        });
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

  // 首页
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">韩语学习</h1>
        </div>
        <Settings className="h-5 w-5 text-gray-600" />
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
                <div className={`w-20 h-28 ${book.color} rounded-lg flex items-center justify-center text-white font-bold text-sm mb-2 mx-auto`}>
                  {book.id === 1 ? '초급1' : '초급2'}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-800">{book.title}</div>
                  <div className="text-xs text-gray-600">{book.subtitle}</div>
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
                <div className={`w-20 h-28 ${book.color} rounded-lg flex items-center justify-center text-white font-bold text-sm mb-2 mx-auto`}>
                  {book.id === 3 ? '중급1' : '중급2'}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-800">{book.title}</div>
                  <div className="text-xs text-gray-600">{book.subtitle}</div>
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
                <div className={`w-20 h-28 ${book.color} rounded-lg flex items-center justify-center text-white font-bold text-sm mb-2 mx-auto`}>
                  {book.id === 5 ? '고급1' : '고급2'}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-800">{book.title}</div>
                  <div className="text-xs text-gray-600">{book.subtitle}</div>
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
    if (!selectedBook) return null;

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
          <h1 className="text-lg font-semibold text-gray-800">{selectedBook.title} {selectedBook.subtitle}</h1>
        </div>

        {/* 课程列表 */}
        <div className="p-4">
          <div className="grid gap-4">
            {selectedBook.lessons.map(lesson => (
              <div 
                key={lesson.id}
                className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                onClick={() => {
                  setSelectedLesson(lesson);
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
    if (!selectedLesson) return null;
    if (loading) return <div className="p-8 text-center text-gray-500">内容加载中...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!content) return null;

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
            <h1 className="text-lg font-semibold text-gray-800">{selectedLesson.title}</h1>
            <div className="text-sm text-gray-600">{selectedLesson.subtitle}</div>
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

  return renderView();
};

export default App;