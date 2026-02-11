# gas-watchers

GAS（Google Apps Script）で定期実行する情報収集・通知システム

## ウォッチャー一覧

| ウォッチャー | 状態 | 概要 |
| --- | --- | --- |
| 論文ウォッチャー | ✅ 実装済 | arXivから新着論文を収集しDiscordに通知 |
| ニュースウォッチャー | 🚧 未着手 | — |
| 株価ウォッチャー | 🚧 未着手 | — |
| 就活ウォッチャー | 🚧 未着手 | — |

## 技術スタック

| 要素 | ツール |
| --- | --- |
| ランタイム | Google Apps Script |
| データ蓄積 | Google スプレッドシート（ウォッチャーごとにシート分け） |
| 通知 | Discord Webhook（Embed形式） |
| 翻訳・要約 | Gemini 2.0 Flash API（無料枠） |
| スケジューリング | GAS 時間主導型トリガー |
| ローカル開発 | VSCode + clasp + GitHub Copilot |

## リポジトリ構成

```
gas-watchers/
├── README.md
├── src/
│   ├── config.js            # 共通設定
│   ├── utils/
│   │   ├── discord.js       # Discord通知
│   │   ├── gemini.js        # Gemini API
│   │   └── sheet.js         # スプレッドシート操作
│   ├── paper-watcher.js     # 論文ウォッチャー
│   ├── news-watcher.js      # ニュースウォッチャー（未実装）
│   ├── stock-watcher.js     # 株価ウォッチャー（未実装）
│   └── job-watcher.js       # 就活ウォッチャー（未実装）
├── .clasp.json
└── appsscript.json
```

## セットアップ手順

### 1. clasp をインストール

```bash
npm install -g @google/clasp
clasp login
```

### 2. GAS プロジェクトと紐付け

`.clasp.json` の `scriptId` を自分のGASプロジェクトのスクリプトIDに書き換えてください。

```bash
# または新規作成する場合
clasp create --type standalone --title "gas-watchers"
```

### 3. スクリプトプロパティを設定

GASエディタ → プロジェクトの設定 → スクリプトプロパティ で以下を設定：

| プロパティ名 | 値 |
| --- | --- |
| `DISCORD_WEBHOOK_URL_PAPER` | `#論文` チャンネルの Webhook URL |
| `DISCORD_WEBHOOK_URL_NEWS` | `#ニュース` チャンネルの Webhook URL |
| `DISCORD_WEBHOOK_URL_STOCK` | `#株価` チャンネルの Webhook URL |
| `DISCORD_WEBHOOK_URL_JOB` | `#就活` チャンネルの Webhook URL |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) で取得 |

### 4. Google スプレッドシートを作成

スプレッドシートを作成し、GASプロジェクトに紐付けてください（初回実行時に「論文」シートが自動作成されます）。

### 5. デプロイ & 実行

```bash
clasp push
```

GASエディタで `main()` を手動実行して動作確認。

### 6. トリガー設定

GASエディタ → 時計アイコン → トリガーを追加：

- 関数: `main`
- 実行タイプ: 時間主導型
- タイプ: 日付ベースのタイマー
- 時刻: 午前8時〜9時
