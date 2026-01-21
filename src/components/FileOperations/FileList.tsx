interface FileItem {
  id: string;
  name: string;
  path: string;
}

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export default function FileList({ files, onRemove, onMoveUp, onMoveDown }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">
          ファイルを追加してください
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          {/* ファイル情報 */}
          <div className="flex items-center gap-4 flex-1">
            <span className="text-gray-500 font-mono text-sm w-8 text-center">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-md">{file.path}</p>
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex items-center gap-2">
            {/* 上に移動 */}
            <button
              onClick={() => onMoveUp(file.id)}
              disabled={index === 0}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="上に移動"
            >
              ↑
            </button>

            {/* 下に移動 */}
            <button
              onClick={() => onMoveDown(file.id)}
              disabled={index === files.length - 1}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="下に移動"
            >
              ↓
            </button>

            {/* 削除 */}
            <button
              onClick={() => onRemove(file.id)}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              title="削除"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
