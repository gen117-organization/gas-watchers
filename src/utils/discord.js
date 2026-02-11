/**
 * Discord Webhook 通知ユーティリティ
 * Embed形式でDiscordチャンネルにメッセージを送信する
 */

/**
 * Discord Webhookを使ってEmbed形式のメッセージを送信する
 * @param {Object} embed - Discord Embedオブジェクト
 * @param {string} webhookPropertyName - スクリプトプロパティに保存されているWebhook URLのキー名
 */
function sendDiscordEmbed(embed, webhookPropertyName) {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty(
    webhookPropertyName
  );
  if (!webhookUrl) {
    Logger.log(
      `${webhookPropertyName} が設定されていません。スクリプトプロパティを確認してください。`
    );
    return;
  }

  const payload = { embeds: [embed] };

  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });
  } catch (e) {
    Logger.log("Discord通知エラー: " + e.message);
  }
}
