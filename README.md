# PDF編集ツール

Windows 11向けのPDF編集アプリケーション

## 機能

### PDF表示
- PDFファイルを開いて表示
- ページめくり（前へ/次へ）
- ズーム機能（拡大/縮小/リセット）

### PDF統合
- 複数のPDFファイルを1つに結合
- ファイルの順序変更
- 暗号化PDFの検出とエラーハンドリング

### PDF分割
- 1つのPDFを複数のファイルに分割
- 自由なページ範囲の指定
- ファイル名のカスタマイズ

## 技術スタック

- **Electron** - デスクトップアプリフレームワーク
- **React** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **pdf-lib** - PDF操作ライブラリ
- **PDF.js** - PDF表示ライブラリ

## 開発環境のセットアップ

### 必要な環境
- Node.js 18以上
- npm 9以上

### インストール

```bash
# 依存関係をインストール
npm install
```

### 開発モード

```bash
# 開発サーバーを起動
npm run dev
```

Electronウィンドウが開き、アプリケーションが起動します。

## ビルド（配布用）

### Windowsインストーラーのビルド

**注意: Windowsマシンでのみ実行可能**

```bash
# Windowsインストーラーを作成
npm run build:win
```

ビルド完了後、`release/` フォルダに以下のファイルが生成されます：
- `PDF編集ツール-1.0.0-Setup.exe` - インストーラー

### macOS版のビルド（オプション）

```bash
electron-builder --mac
```

## インストーラーの配布

1. `release/` フォルダから `.exe` ファイルを取得
2. 社内の共有フォルダやメールで配布
3. ユーザーは `.exe` を実行してインストール

## プロジェクト構造

```
pdf-editor-app/
├── electron/           # Electronメインプロセス
│   ├── main.ts        # アプリケーション起動
│   ├── preload.ts     # セキュアなAPI公開
│   └── ipc/           # ファイル操作ハンドラー
├── src/               # Reactアプリケーション
│   ├── components/    # UIコンポーネント
│   ├── contexts/      # 状態管理
│   ├── services/      # ビジネスロジック
│   ├── utils/         # ユーティリティ
│   └── types/         # TypeScript型定義
├── build/             # アプリアイコン
├── dist/              # ビルド出力
└── release/           # インストーラー出力
```

## アプリアイコンのカスタマイズ

`build/icon.ico` ファイルを追加すると、カスタムアイコンが使用されます。

詳細は `build/ICON_README.md` を参照してください。

## トラブルシューティング

### ビルドエラーが発生する場合

```bash
# node_modulesとキャッシュをクリア
rm -rf node_modules dist release
npm install
npm run build:win
```

### PDFが正しく表示されない場合

- IEモードで印刷されたPDFは一部表示されない場合があります
- 暗号化されたPDFは統合できません
- 破損したPDFファイルは処理できません

## ライセンス

社内使用を目的として開発されています。
詳細は `LICENSE.txt` を参照してください。

## バージョン履歴

### v1.0.0 (2026-01-21)
- PDF表示機能
- PDF統合機能
- PDF分割機能
- 初回リリース
