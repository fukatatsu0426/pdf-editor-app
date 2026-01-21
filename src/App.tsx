import { useState } from 'react'
import { PDFProvider } from './contexts/PDFContext'
import PDFViewer from './components/PDFViewer/PDFViewer'
import Toolbar from './components/PDFViewer/Toolbar'
import FileMerger from './components/FileOperations/FileMerger'
import FileSplitter from './components/FileOperations/FileSplitter'

type TabType = 'viewer' | 'merge' | 'split';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('viewer');

  return (
    <PDFProvider>
      <div className="flex flex-col h-screen">
        {/* タブナビゲーション */}
        <div className="bg-gray-800 text-white flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('viewer')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'viewer'
                ? 'bg-gray-900 border-b-2 border-blue-500'
                : 'hover:bg-gray-700'
            }`}
          >
            PDF表示
          </button>
          <button
            onClick={() => setActiveTab('merge')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'merge'
                ? 'bg-gray-900 border-b-2 border-blue-500'
                : 'hover:bg-gray-700'
            }`}
          >
            PDF統合
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'split'
                ? 'bg-gray-900 border-b-2 border-blue-500'
                : 'hover:bg-gray-700'
            }`}
          >
            PDF分割
          </button>
        </div>

        {/* コンテンツエリア */}
        {activeTab === 'viewer' ? (
          <>
            {/* ツールバー */}
            <Toolbar />

            {/* PDFビューア */}
            <div className="flex-1 overflow-hidden">
              <PDFViewer />
            </div>
          </>
        ) : activeTab === 'merge' ? (
          /* PDF統合 */
          <div className="flex-1 overflow-hidden">
            <FileMerger />
          </div>
        ) : (
          /* PDF分割 */
          <div className="flex-1 overflow-hidden">
            <FileSplitter />
          </div>
        )}
      </div>
    </PDFProvider>
  )
}

export default App
