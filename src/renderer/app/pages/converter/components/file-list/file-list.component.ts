import { Component, inject } from "@angular/core";
import type { FileEntry } from "@shared/types";
import { progressOf, statusOf } from "../../../../shared/entry";
import { formatDuration } from "../../../../shared/format";
import { ConverterStore } from "../../store/converter.store";

/**
 * 名前の末尾から常に見せる文字数
 * 日時の桁は常に見せたいので、幅が足りないときは前を削る
 */
const TAIL_LENGTH = 10;

/**
 * 左側のファイル一覧
 */
@Component({
  selector: "app-file-list",
  templateUrl: "./file-list.component.html",
  styleUrl: "./file-list.component.scss",
})
export class FileListComponent {
  readonly store = inject(ConverterStore);

  protected readonly statusOf = statusOf;
  protected readonly progressOf = progressOf;

  /**
   * 幅が足りないときに省略してよい前半
   *
   * @param name - ファイル名
   * @returns 前半。全部見せられる長さなら空文字
   */
  head(name: string): string {
    return name.length > TAIL_LENGTH ? name.slice(0, -TAIL_LENGTH) : "";
  }

  /**
   * 省略せずに見せる後半
   *
   * @param name - ファイル名
   * @returns 末尾の日時部分
   */
  tail(name: string): string {
    return name.length > TAIL_LENGTH ? name.slice(-TAIL_LENGTH) : name;
  }

  /**
   * 行の右端に出す値
   *
   * 変換中は進み具合を、それ以外は状態か尺を出す
   *
   * @param entry - 行に対応するファイル
   * @returns 右端に出す文字列
   */
  right(entry: FileEntry): string {
    const status = entry.status;
    if (status.phase === "converting") return `${Math.round(status.progress * 100)}%`;
    if (status.phase === "verifying") return "確認中";
    if (status.phase === "skipped") return "対象外";
    return formatDuration(entry.input.info?.durationSec);
  }
}
