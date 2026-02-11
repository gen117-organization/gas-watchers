/**
 * Google スプレッドシート操作ユーティリティ
 * シートの作成・データ取得などの共通処理
 */

/**
 * 指定名のシートを取得する。存在しない場合は新規作成してヘッダ行を追加する
 * @param {string} sheetName - シート名
 * @param {string[]} headers - ヘッダ行の配列
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} シートオブジェクト
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    Logger.log(`「${sheetName}」シートを新規作成しました`);
  }
  return sheet;
}

/**
 * シートの指定列から既存IDのセットを取得する（重複排除用）
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象シート
 * @param {number} colIndex - ID列のインデックス（0始まり）
 * @returns {Set<string>} 既存IDのセット
 */
function getExistingIds(sheet, colIndex) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return new Set();
  }
  const data = sheet.getDataRange().getValues();
  return new Set(data.slice(1).map((row) => row[colIndex]));
}
