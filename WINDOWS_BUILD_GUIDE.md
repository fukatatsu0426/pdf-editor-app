# Windows用インストーラーのビルド手順

## 前提条件（開発者のみ必要）

- Node.js 18以上
- Git（GitHubからクローンする場合）

**注意: エンドユーザー（他の社員）はNode.jsやGitのインストールは不要です。**

---

## 手順1: プロジェクトの取得

### 方法A: GitHubからクローン

```bash
git clone https://github.com/fukatatsu0426/pdf-editor-app.git
cd pdf-editor-app
```

### 方法B: Zipファイルをダウンロード

1. https://github.com/fukatatsu0426/pdf-editor-app にアクセス
2. 緑色の「Code」ボタン → 「Download ZIP」をクリック
3. ダウンロードしたZipファイルを展開
4. コマンドプロンプトまたはPowerShellで展開したフォルダに移動

---

## 手順2: 依存関係のインストール

```bash
npm install
```

**所要時間:** 5-10分（初回のみ）

---

## 手順3: インストーラーのビルド

```bash
npm run build:win
```

**所要時間:** 2-5分

---

## 手順4: ビルド結果の確認

ビルドが完了すると、`release/` フォルダに以下のファイルが生成されます：

```
release/
└── PDF編集ツール-1.0.0-Setup.exe  ← このファイルを配布
```

**ファイルサイズ:** 約150-200MB

---

## 手順5: SharePointへのアップロード

1. `release/PDF編集ツール-1.0.0-Setup.exe` を取得
2. SharePointの共有フォルダにアップロード
3. 社員がダウンロードできるように権限を設定

---

## トラブルシューティング

### エラー: `npm: command not found`

Node.jsがインストールされていません。
https://nodejs.org/ から最新版（LTS）をダウンロードしてインストールしてください。

### エラー: ビルドが途中で失敗する

```bash
# キャッシュをクリアして再実行
rm -rf node_modules dist release
npm install
npm run build:win
```

### ビルドしたファイルが大きすぎる

正常です。Electronアプリは約150-200MBのサイズになります。
これはChromiumエンジンが含まれるためです。

---

## 更新版のビルド

アプリを更新した場合：

1. GitHubから最新版を取得: `git pull`
2. 再度ビルド: `npm run build:win`
3. 新しいバージョンの.exeファイルをSharePointにアップロード
4. 社員に再インストールを依頼（上書きインストール可能）
