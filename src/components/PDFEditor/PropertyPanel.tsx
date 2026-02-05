import React from 'react';
import { useEdit } from '../../contexts/EditContext';
import {
  TextEdit,
  HighlightAnnotation,
  UnderlineAnnotation,
  CommentAnnotation,
  ImageEdit,
} from '../../types/edit.types';

const PropertyPanel: React.FC = () => {
  const {
    activeTool,
    getSelectedObject,
    updateText,
    updateHighlight,
    updateComment,
    updateImage,
    updateUnderline,
    removeText,
    removeHighlight,
    removeUnderline,
    removeComment,
    removeImage,
  } = useEdit();

  const selectedObject = getSelectedObject();

  // オブジェクトが選択されていない場合のヘルプメッセージ
  if (!selectedObject) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4">プロパティ</h3>
        <div className="text-sm text-gray-500">
          {getToolHelp(activeTool)}
        </div>
      </div>
    );
  }

  // オブジェクトの種類を判定
  const objectType = getObjectType(selectedObject);

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">
        {getObjectTypeName(objectType)}のプロパティ
      </h3>

      {/* テキストプロパティ */}
      {objectType === 'text' && (
        <TextProperties
          text={selectedObject as TextEdit}
          onUpdate={updateText}
          onDelete={() => removeText(selectedObject.id)}
        />
      )}

      {/* ハイライトプロパティ */}
      {objectType === 'highlight' && (
        <HighlightProperties
          highlight={selectedObject as HighlightAnnotation}
          onUpdate={updateHighlight}
          onDelete={() => removeHighlight(selectedObject.id)}
        />
      )}

      {/* 下線プロパティ */}
      {objectType === 'underline' && (
        <UnderlineProperties
          underline={selectedObject as UnderlineAnnotation}
          onUpdate={updateUnderline}
          onDelete={() => removeUnderline(selectedObject.id)}
        />
      )}

      {/* コメントプロパティ */}
      {objectType === 'comment' && (
        <CommentProperties
          comment={selectedObject as CommentAnnotation}
          onUpdate={updateComment}
          onDelete={() => removeComment(selectedObject.id)}
        />
      )}

      {/* 画像プロパティ */}
      {objectType === 'image' && (
        <ImageProperties
          image={selectedObject as ImageEdit}
          onUpdate={updateImage}
          onDelete={() => removeImage(selectedObject.id)}
        />
      )}
    </div>
  );
};

// テキストプロパティ
interface TextPropertiesProps {
  text: TextEdit;
  onUpdate: (id: string, updates: Partial<TextEdit>) => void;
  onDelete: () => void;
}

const TextProperties: React.FC<TextPropertiesProps> = ({ text, onUpdate, onDelete }) => {
  return (
    <div className="space-y-4">
      {/* テキスト内容 */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">テキスト</label>
        <textarea
          value={text.text}
          onChange={(e) => onUpdate(text.id, { text: e.target.value })}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm resize-none"
          rows={3}
        />
      </div>

      {/* フォントサイズ */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">フォントサイズ</label>
        <input
          type="number"
          value={text.fontSize}
          onChange={(e) => onUpdate(text.id, { fontSize: parseInt(e.target.value) || 14 })}
          min={8}
          max={72}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
        />
      </div>

      {/* 色 */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={text.color}
            onChange={(e) => onUpdate(text.id, { color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={text.color}
            onChange={(e) => onUpdate(text.id, { color: e.target.value })}
            className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
      </div>

      {/* 位置 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">X座標</label>
          <input
            type="number"
            value={Math.round(text.x)}
            onChange={(e) => onUpdate(text.id, { x: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Y座標</label>
          <input
            type="number"
            value={Math.round(text.y)}
            onChange={(e) => onUpdate(text.id, { y: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
      </div>

      {/* 削除ボタン */}
      <button
        onClick={onDelete}
        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
      >
        削除
      </button>
    </div>
  );
};

// ハイライトプロパティ
interface HighlightPropertiesProps {
  highlight: HighlightAnnotation;
  onUpdate: (id: string, updates: Partial<HighlightAnnotation>) => void;
  onDelete: () => void;
}

const HighlightProperties: React.FC<HighlightPropertiesProps> = ({ highlight, onUpdate, onDelete }) => {
  const colorOptions = [
    { name: 'イエロー', value: '#FFFF00' },
    { name: 'ピンク', value: '#FF69B4' },
    { name: 'ライム', value: '#B8FF00' },
    { name: 'グレー', value: '#BDBDBD' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1">色</label>
        <div className="grid grid-cols-2 gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate(highlight.id, { color: option.value })}
              className={`flex items-center gap-2 px-2 py-1 rounded border text-xs ${
                highlight.color === option.value ? 'border-blue-500' : 'border-gray-600'
              }`}
            >
              <span
                className="w-5 h-5 rounded border border-gray-600"
                style={{ backgroundColor: option.value, opacity: highlight.opacity }}
              />
              <span className="text-gray-300">{option.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">幅</label>
          <input
            type="number"
            min={1}
            value={Math.round(highlight.width)}
            onChange={(e) => onUpdate(highlight.id, { width: Math.max(1, Number(e.target.value) || 1) })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">高さ</label>
          <input
            type="number"
            min={1}
            value={Math.round(highlight.height)}
            onChange={(e) => onUpdate(highlight.id, { height: Math.max(1, Number(e.target.value) || 1) })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
      </div>

      <button
        onClick={onDelete}
        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
      >
        削除
      </button>
    </div>
  );
};

// 下線プロパティ
interface UnderlinePropertiesProps {
  underline: UnderlineAnnotation;
  onUpdate: (id: string, updates: Partial<UnderlineAnnotation>) => void;
  onDelete: () => void;
}

const UnderlineProperties: React.FC<UnderlinePropertiesProps> = ({ underline, onUpdate, onDelete }) => {
  const x1 = underline.x;
  const y1 = underline.y;
  const x2 = underline.x2 ?? underline.x + underline.width;
  const y2 = underline.y2 ?? underline.y;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const safeNx = length > 0 ? dx / length : 1;
  const safeNy = length > 0 ? dy / length : 0;
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1">色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={underline.color}
            onChange={(e) => onUpdate(underline.id, { color: e.target.value })}
            className="w-8 h-8 rounded border border-gray-600 bg-transparent"
          />
          <input
            type="text"
            value={underline.color}
            onChange={(e) => onUpdate(underline.id, { color: e.target.value })}
            className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">幅</label>
        <input
          type="number"
          min={1}
          value={Math.round(length)}
          onChange={(e) => {
            const nextLen = Math.max(1, Number(e.target.value) || 1);
            const newX2 = x1 + safeNx * nextLen;
            const newY2 = y1 + safeNy * nextLen;
            onUpdate(underline.id, { width: nextLen, x2: newX2, y2: newY2 });
          }}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">太さ</label>
        <input
          type="number"
          min={1}
          value={underline.thickness}
          onChange={(e) => onUpdate(underline.id, { thickness: Math.max(1, Number(e.target.value) || 1) })}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">線の種類</label>
        <select
          value={underline.lineStyle ?? 'solid'}
          onChange={(e) => onUpdate(underline.id, { lineStyle: e.target.value as UnderlineAnnotation['lineStyle'] })}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
        >
          <option value="solid">実線</option>
          <option value="dashed">破線</option>
          <option value="dotted">点線</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">終端</label>
        <select
          value={underline.lineCap ?? 'butt'}
          onChange={(e) => onUpdate(underline.id, { lineCap: e.target.value as UnderlineAnnotation['lineCap'] })}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
        >
          <option value="butt">角</option>
          <option value="round">丸</option>
          <option value="square">四角</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">矢印</label>
        <select
          value={
            underline.arrowStart && underline.arrowEnd
              ? 'both'
              : underline.arrowStart
              ? 'start'
              : underline.arrowEnd
              ? 'end'
              : 'none'
          }
          onChange={(e) => {
            const value = e.target.value as 'none' | 'start' | 'end' | 'both';
            onUpdate(underline.id, {
              arrowStart: value === 'start' || value === 'both',
              arrowEnd: value === 'end' || value === 'both',
            });
          }}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
        >
          <option value="none">なし</option>
          <option value="start">片方（始点）</option>
          <option value="end">片方（終点）</option>
          <option value="both">両端</option>
        </select>
      </div>

      <button
        onClick={onDelete}
        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
      >
        削除
      </button>
    </div>
  );
};

// コメントプロパティ
interface CommentPropertiesProps {
  comment: CommentAnnotation;
  onUpdate: (id: string, updates: Partial<CommentAnnotation>) => void;
  onDelete: () => void;
}

const CommentProperties: React.FC<CommentPropertiesProps> = ({ comment, onUpdate, onDelete }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1">コメント</label>
        <textarea
          value={comment.text}
          onChange={(e) => onUpdate(comment.id, { text: e.target.value })}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm resize-none"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">作成日時</label>
        <span className="text-sm text-gray-300">
          {comment.createdAt.toLocaleString()}
        </span>
      </div>

      <button
        onClick={onDelete}
        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
      >
        削除
      </button>
    </div>
  );
};

// 画像プロパティ
interface ImagePropertiesProps {
  image: ImageEdit;
  onUpdate: (id: string, updates: Partial<ImageEdit>) => void;
  onDelete: () => void;
}

const ImageProperties: React.FC<ImagePropertiesProps> = ({ image, onUpdate, onDelete }) => {
  const aspectRatio = image.originalWidth / image.originalHeight;

  const handleWidthChange = (width: number) => {
    onUpdate(image.id, {
      width,
      height: width / aspectRatio,
    });
  };

  const handleHeightChange = (height: number) => {
    onUpdate(image.id, {
      width: height * aspectRatio,
      height,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1">サイズ</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">幅</label>
            <input
              type="number"
              value={Math.round(image.width)}
              onChange={(e) => handleWidthChange(parseInt(e.target.value) || image.width)}
              min={10}
              className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">高さ</label>
            <input
              type="number"
              value={Math.round(image.height)}
              onChange={(e) => handleHeightChange(parseInt(e.target.value) || image.height)}
              min={10}
              className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">元のサイズ</label>
        <span className="text-sm text-gray-300">
          {image.originalWidth} x {image.originalHeight}px
        </span>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">形式</label>
        <span className="text-sm text-gray-300">
          {image.mimeType === 'image/png' ? 'PNG' : 'JPEG'}
        </span>
      </div>

      {/* 位置 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">X座標</label>
          <input
            type="number"
            value={Math.round(image.x)}
            onChange={(e) => onUpdate(image.id, { x: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Y座標</label>
          <input
            type="number"
            value={Math.round(image.y)}
            onChange={(e) => onUpdate(image.id, { y: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
          />
        </div>
      </div>

      {/* サイズリセット */}
      <button
        onClick={() =>
          onUpdate(image.id, {
            width: image.originalWidth,
            height: image.originalHeight,
          })
        }
        className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors text-sm"
      >
        元のサイズに戻す
      </button>

      <button
        onClick={onDelete}
        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
      >
        削除
      </button>
    </div>
  );
};

// オブジェクトの種類を判定
function getObjectType(obj: unknown): 'text' | 'highlight' | 'underline' | 'comment' | 'image' {
  if ('fontSize' in (obj as TextEdit)) return 'text';
  if ('opacity' in (obj as HighlightAnnotation)) return 'highlight';
  if ('thickness' in (obj as UnderlineAnnotation)) return 'underline';
  if ('createdAt' in (obj as CommentAnnotation)) return 'comment';
  return 'image';
}

// オブジェクト種類の日本語名
function getObjectTypeName(type: string): string {
  switch (type) {
    case 'text':
      return 'テキスト';
    case 'highlight':
      return 'ハイライト';
    case 'underline':
      return '下線';
    case 'comment':
      return 'コメント';
    case 'image':
      return '画像';
    default:
      return 'オブジェクト';
  }
}

// ツールごとのヘルプメッセージ
function getToolHelp(tool: string): string {
  switch (tool) {
    case 'select':
      return 'キャンバス上のオブジェクトをクリックして選択できます。';
    case 'page':
      return '左のサムネイルからページの回転・削除・並べ替えができます。';
    case 'text':
      return 'キャンバス上をクリックしてテキストを追加します。';
    case 'highlight':
      return 'キャンバス上をドラッグしてハイライトを追加します。';
    case 'underline':
      return 'キャンバス上をドラッグして下線を追加します。';
    case 'comment':
      return 'キャンバス上をクリックしてコメントを追加します。';
    case 'image':
      return 'キャンバス上をクリックして画像を挿入します。';
    default:
      return 'ツールを選択してください。';
  }
}

export default PropertyPanel;
