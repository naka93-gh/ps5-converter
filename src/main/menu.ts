import { Menu, type MenuItemConstructorOptions } from "electron";

/** メニューのラベルに入れるアプリ名 */
const APP_NAME = "PS5 Converter";
/** Macかどうか */
const isMac = process.platform === "darwin";

/**
 * 日本語ラベルのアプリケーションメニューを適用する
 */
export function setupMenu(): void {
  const template: MenuItemConstructorOptions[] = [...(isMac ? [appMenu()] : []), editMenu()];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * アプリ名のメニュー
 *
 * @returns メニューの定義
 */
function appMenu(): MenuItemConstructorOptions {
  return {
    label: APP_NAME,
    submenu: [
      { role: "about", label: `${APP_NAME}について` },
      { type: "separator" },
      { role: "hide", label: `${APP_NAME}を隠す` },
      { role: "quit", label: `${APP_NAME}を終了` },
    ],
  };
}

/**
 * 編集メニュー
 *
 * @returns メニューの定義
 */
function editMenu(): MenuItemConstructorOptions {
  return {
    label: "編集",
    submenu: [
      { role: "undo", label: "取り消す" },
      { role: "redo", label: "やり直す" },
      { type: "separator" },
      { role: "cut", label: "切り取る" },
      { role: "copy", label: "コピー" },
      { role: "paste", label: "ペースト" },
      { role: "selectAll", label: "すべてを選択" },
    ],
  };
}
