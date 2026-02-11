/**
 * 論文ウォッチャー
 * arXiv APIから研究キーワードに合致する新着論文を自動収集し、
 * Googleスプレッドシートに蓄積 & Discord Webhookで通知する
 *
 * 実行頻度: 1日1回（毎朝8時）
 * トリガー設定: GASエディタ → 時計アイコン → 時間主導型 → 日付ベースのタイマー → 午前8時
 */

/** スプレッドシートのヘッダ定義 */
const PAPER_HEADERS = [
  "arXiv ID",
  "タイトル",
  "著者",
  "公開日",
  "アブストラクト",
  "URL",
  "日本語要約",
];

/**
 * 論文ウォッチャーのメインエントリポイント
 * 1. arXiv APIから論文を取得
 * 2. 既存IDと照合して新着のみ抽出
 * 3. Gemini APIで日本語要約を生成
 * 4. スプレッドシートに保存
 * 5. Discordに通知
 */
function main() {
  const cfg = CONFIG.PAPER_WATCHER;

  // arXiv APIから論文を取得
  const papers = fetchArxivPapers(cfg.QUERY, cfg.MAX_RESULTS);
  if (papers.length === 0) {
    Logger.log("arXiv APIから論文を取得できませんでした");
    return;
  }
  Logger.log(`arXiv APIから ${papers.length} 件の論文を取得`);

  // スプレッドシートを取得（なければ作成）
  const sheet = getOrCreateSheet(cfg.SHEET_NAME, PAPER_HEADERS);

  // 既存のarXiv IDと照合して重複を排除
  const existingIds = getExistingIds(sheet, 0); // A列 = arXiv ID
  const newPapers = papers.filter((p) => !existingIds.has(p.arxivId));

  if (newPapers.length === 0) {
    Logger.log("新着論文なし");
    return;
  }
  Logger.log(`新着論文: ${newPapers.length} 件`);

  // Gemini APIで日本語要約を生成
  const enrichedPapers = newPapers.map((paper) => {
    const summary = summarizeWithGemini(
      paper.abstract,
      CONFIG.GEMINI.PROMPTS.PAPER_SUMMARY
    );
    // Gemini APIのレートリミット対策（15 req/min）
    Utilities.sleep(500);
    return { ...paper, summary };
  });

  // スプレッドシートに保存
  enrichedPapers.forEach((p) => {
    sheet.appendRow([
      p.arxivId,
      p.title,
      p.authors,
      p.published,
      p.abstract,
      p.link,
      p.summary,
    ]);
  });
  Logger.log(`スプレッドシートに ${enrichedPapers.length} 件を追加`);

  // Discordに通知
  enrichedPapers.forEach((paper) => {
    const embed = buildPaperEmbed(paper);
    sendDiscordEmbed(embed, cfg.WEBHOOK_PROPERTY);
    // Discord Webhookのレートリミット対策
    Utilities.sleep(1000);
  });

  Logger.log(`${enrichedPapers.length} 件の新着論文を処理しました`);
}

/**
 * arXiv APIから論文を取得する
 * @param {string} query - arXiv検索クエリ
 * @param {number} maxResults - 最大取得件数
 * @returns {Array<Object>} 論文オブジェクトの配列
 */
function fetchArxivPapers(query, maxResults) {
  const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
    query
  )}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      Logger.log(`arXiv API HTTP ${statusCode}: ${response.getContentText()}`);
      return [];
    }

    const xml = XmlService.parse(response.getContentText());
    const ns = XmlService.getNamespace("http://www.w3.org/2005/Atom");
    const entries = xml.getRootElement().getChildren("entry", ns);

    return entries.map((entry) => {
      const id = entry.getChild("id", ns).getText();
      const arxivId = id.replace("http://arxiv.org/abs/", "");
      const title = entry
        .getChild("title", ns)
        .getText()
        .replace(/\n/g, " ")
        .trim();
      const abstract = entry
        .getChild("summary", ns)
        .getText()
        .replace(/\n/g, " ")
        .trim();
      const published = entry
        .getChild("published", ns)
        .getText()
        .split("T")[0];
      const authors = entry
        .getChildren("author", ns)
        .map((a) => a.getChild("name", ns).getText())
        .join(", ");
      const link = `https://arxiv.org/abs/${arxivId}`;

      return { arxivId, title, authors, published, abstract, link };
    });
  } catch (e) {
    Logger.log("arXiv API error: " + e.message);
    return [];
  }
}

/**
 * 論文情報からDiscord Embedオブジェクトを構築する
 * @param {Object} paper - 論文オブジェクト
 * @returns {Object} Discord Embedオブジェクト
 */
function buildPaperEmbed(paper) {
  // Discordの文字数制限（Embed fieldは1024文字まで）
  const abstractText =
    paper.abstract.length > 800
      ? paper.abstract.substring(0, 800) + "..."
      : paper.abstract;

  const summaryText =
    paper.summary.length > 1024
      ? paper.summary.substring(0, 1021) + "..."
      : paper.summary;

  return {
    title: paper.title,
    url: paper.link,
    color: 3447003, // 青色
    fields: [
      { name: "👤 著者", value: paper.authors, inline: false },
      { name: "📅 公開日", value: paper.published, inline: true },
      { name: "📝 Abstract", value: abstractText, inline: false },
      { name: "🇯🇵 日本語要約", value: summaryText, inline: false },
    ],
    footer: {
      text: "論文ウォッチャー | arXiv",
    },
    timestamp: new Date().toISOString(),
  };
}
