/**
 * Gemini API ユーティリティ
 * Gemini 2.5 Flash を使ったテキスト生成（翻訳・要約など）
 */

/**
 * Gemini APIを使ってテキストを要約・翻訳する
 * @param {string} text - 要約対象のテキスト
 * @param {string} prompt - Geminiに渡すプロンプト（textの前に付与される）
 * @returns {string} Geminiの応答テキスト。エラー時は「(要約取得失敗)」
 */
function summarizeWithGemini(text, prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(
    "GEMINI_API_KEY"
  );
  if (!apiKey) {
    Logger.log(
      "GEMINI_API_KEY が設定されていません。スクリプトプロパティを確認してください。"
    );
    return "(要約取得失敗: APIキー未設定)";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI.MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt + text }],
      },
    ],
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      Logger.log(`Gemini API HTTP ${statusCode}: ${response.getContentText()}`);
      return "(要約取得失敗)";
    }

    const json = JSON.parse(response.getContentText());
    return json.candidates[0].content.parts[0].text.trim();
  } catch (e) {
    Logger.log("Gemini API error: " + e.message);
    return "(要約取得失敗)";
  }
}
