import React from 'react';

interface EmptyContentProps {
  message: string;
  imageUrl?: string;
}

const EmptyContent: React.FC<EmptyContentProps> = ({ message, imageUrl }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-white">
      {/* 图片区块 */}
      <div className="mb-6 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="空内容提示" className="max-w-[160px] max-h-[160px]" />
        ) : null}
      </div>
      <p className="text-gray-500 text-lg font-medium">{message}</p>
    </div>
  );
};

export default EmptyContent; 