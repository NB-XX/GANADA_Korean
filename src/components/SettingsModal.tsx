import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">设置</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 字体大小设置 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">字体大小</h3>
          <div className="flex gap-4">
            {['small', 'medium', 'large'].map((size) => (
              <button
                key={size}
                className={`px-4 py-2 rounded-lg border ${
                  fontSize === size
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => onFontSizeChange(size)}
              >
                {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
              </button>
            ))}
          </div>
        </div>

        {/* 配色方案设置 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">配色方案</h3>
          <div className="flex gap-4">
            {['default', 'eye-care', 'dark'].map((t) => (
              <button
                key={t}
                className={`px-4 py-2 rounded-lg border ${
                  theme === t
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => onThemeChange(t)}
              >
                {t === 'default' ? '默认' : t === 'eye-care' ? '护眼' : '暗色'}
              </button>
            ))}
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 