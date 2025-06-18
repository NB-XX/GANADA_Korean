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
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);

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
              <span className="text-sm font-medium text-gray-800">{result.content}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600">
                {result.type}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-1">{result.preview}</div>
            <div className="text-xs text-gray-400">
              {result.bookTitle} · {result.lessonTitle}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索课文、语法、单词..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      {renderResults()}
    </div>
  );
};

export default SearchBar; 