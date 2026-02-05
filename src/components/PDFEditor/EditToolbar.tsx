import React from 'react';
import { useEdit } from '../../contexts/EditContext';
import { EditToolType } from '../../types/edit.types';

interface ToolButtonProps {
  tool: EditToolType;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors text-sm ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
    title={label}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const EditToolbar: React.FC = () => {
  const { activeTool, setActiveTool, undo, redo, canUndo, canRedo, scale, setScale } = useEdit();

  const tools: { tool: EditToolType; label: string; icon: React.ReactNode }[] = [
    {
      tool: 'select',
      label: '選択',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
    },
    {
      tool: 'page',
      label: 'ページ',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      tool: 'text',
      label: 'テキスト',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      tool: 'highlight',
      label: 'ハイライト',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.243 4.515l-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242zm6.364 3.536a1 1 0 010 1.414l-7.778 7.778-2.122.707-1.414 1.414a1 1 0 01-1.414 0l-4.243-4.243a1 1 0 010-1.414l1.414-1.414.707-2.121 7.778-7.778a1 1 0 011.414 0l5.658 5.657z" />
        </svg>
      ),
    },
    {
      tool: 'underline',
      label: '下線',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M7 8v4a5 5 0 0010 0V8" />
        </svg>
      ),
    },
    {
      tool: 'comment',
      label: 'コメント',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
    },
    {
      tool: 'image',
      label: '画像',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
      {/* ツールボタン */}
      <div className="flex items-center gap-1">
        {tools.map(({ tool, label, icon }) => (
          <ToolButton
            key={tool}
            tool={tool}
            label={label}
            icon={icon}
            active={activeTool === tool}
            onClick={() => setActiveTool(tool)}
          />
        ))}
      </div>

      <div className="h-6 w-px bg-gray-600 mx-2" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition-colors ${
            canUndo
              ? 'text-gray-300 hover:bg-gray-700'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="元に戻す (Ctrl+Z)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition-colors ${
            canRedo
              ? 'text-gray-300 hover:bg-gray-700'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="やり直す (Ctrl+Y)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      <div className="flex-1" />

      {/* ズーム */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setScale(scale - 0.25)}
          disabled={scale <= 0.25}
          className="p-1.5 rounded text-gray-300 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          title="縮小"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        <span className="text-sm text-gray-400 w-16 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(scale + 0.25)}
          disabled={scale >= 4}
          className="p-1.5 rounded text-gray-300 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          title="拡大"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
        <button
          onClick={() => setScale(1)}
          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          title="100%にリセット"
        >
          リセット
        </button>
      </div>
    </div>
  );
};

export default EditToolbar;
