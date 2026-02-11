/**
 * 共通設定
 * 各ウォッチャーの設定とAPI設定を一元管理する
 */
const CONFIG = {
  PAPER_WATCHER: {
    SHEET_NAME: "論文",
    MAX_RESULTS: 30,
    QUERY:
      '(cat:cs.SE OR cat:cs.PL OR cat:cs.DC) AND all:(microservice OR "code clone" OR co-modification)',
    WEBHOOK_PROPERTY: "DISCORD_WEBHOOK_URL_PAPER",
  },
  GEMINI: {
    MODEL: "gemini-2.5-flash",
    PROMPTS: {
      PAPER_SUMMARY:
        "以下の論文のアブストラクトを3行以内で日本語要約してください。\n\n",
    },
  },
};
