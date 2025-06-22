import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchResult {
  type: '课文' | '语法' | '单词' | '听力' | '阅读';
  content: string;
  preview: string;
  bookId: number;
  lessonId: number;
  bookTitle: string;
  lessonTitle: string;
}

interface SearchBarProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultClick: (result: SearchResult) => void;
  loading?: boolean;
  error?: string | null;
  onFocus?: () => void;
}

const tagColors: Record<string, string> = {
  '课文': 'bg-blue-100 text-blue-700',
  '语法': 'bg-green-100 text-green-700',
  '单词': 'bg-yellow-100 text-yellow-700',
  '听力': 'bg-purple-100 text-purple-700',
  '阅读': 'bg-pink-100 text-pink-700',
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onResultClick, loading = false, error = null, onFocus }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索防抖
  const handleSearch = async (value: string) => {
    setQuery(value);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await onSearch(value);
        setResults(searchResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // 提交搜索
  const handleSearchSubmit = async () => {
    if (!query.trim()) return;
    const res = await onSearch(query);
    setResults(res);
  };

  // 渲染搜索结果
  const renderResults = () => {
    if (!isOpen) return null;

    if (isLoading) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg p-4">
          <div className="text-gray-500 text-center">搜索中...</div>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg p-4">
          <div className="text-gray-500 text-center">未找到相关内容</div>
        </div>
      );
    }

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <div
            key={index}
            className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            onClick={() => {
              onResultClick(result);
              setIsOpen(false);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tagColors[result.type] || 'bg-gray-100 text-gray-600'}`}>{result.type}</span>
              <span className="text-xs text-gray-500">{result.bookTitle} {result.lessonTitle}</span>
            </div>
            <div className="font-medium text-gray-800 truncate">{result.content}</div>
            <div className="text-sm text-gray-500 truncate">{result.preview}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !isComposing) {
              handleSearchSubmit();
            }
          }}
          placeholder={loading ? '索引加载中...' : error ? '索引加载失败，请刷新' : '输入关键词搜索'}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading || !!error}
          onFocus={onFocus}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      {loading && (
        <div className="text-blue-500 text-sm mt-2">索引加载中，请稍候...</div>
      )}
      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}
      {renderResults()}
    </div>
  );
};

export default SearchBar; 