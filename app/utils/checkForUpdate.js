// 📁 frontend/utils/checkForUpdate.js
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * アップデート確認＆実行関数（Tauri Plugin Updater 対応）
 */
export async function checkForUpdate() {
  try {
    const update = await check();
    if (update) {
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength;
            console.log(`🔽 ダウンロード開始: ${contentLength} bytes`);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            console.log(`📦 ${downloaded} / ${contentLength} bytes`);
            break;
          case "Finished":
            console.log("✅ ダウンロード完了");
            break;
        }
      });

      console.log("🚀 アップデート完了、再起動します");
      await relaunch();
      return `アップデートを適用して再起動しました（v${update.version}）`;
    } else {
      return "✅ 最新バージョンです。";
    }
  } catch (err) {
    return `アップデート確認エラー: ${String(err)}`;
  }
}
