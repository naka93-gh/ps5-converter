import { Component, computed, inject, input } from "@angular/core";
import type { FileEntry } from "@shared/types";
import { reasonOf, statusOf } from "../../../../shared/entry";
import { formatDuration, formatElapsed, formatSize } from "../../../../shared/format";
import { ConverterService } from "../../converter.service";

/**
 * 選んだ1件の詳細
 *
 * 検証の内訳と、元ファイルとの比較を出す
 */
@Component({
  selector: "app-detail-panel",
  templateUrl: "./detail-panel.component.html",
  styleUrl: "./detail-panel.component.scss",
})
export class DetailPanelComponent {
  readonly entry = input.required<FileEntry>();
  readonly converter = inject(ConverterService);

  protected readonly formatDuration = formatDuration;
  protected readonly formatSize = formatSize;

  /** 状態バッジに出す文言と色 */
  readonly status = computed(() => statusOf(this.entry()));

  /** 検証の内訳。まだ突き合わせていなければnull */
  readonly verifyDetail = computed(() => {
    const status = this.entry().status;
    return status.phase === "verified" ? status.detail : null;
  });

  /** 名前の下に出す一行。落ちた理由があればそれを優先する */
  readonly subtitle = computed(() => {
    const entry = this.entry();
    const reason = reasonOf(entry);
    if (reason) return reason;

    switch (entry.status.phase) {
      case "verified":
        return "変換と検証がどちらも通りました";
      case "unverified":
        return "出力先に同じ名前のmp4があります";
      case "waiting":
        return "まだ変換していません";
      default:
        return "";
    }
  });

  /** 元ファイルの尺 */
  readonly total = computed(() => formatDuration(this.entry().input.info?.durationSec));

  /** 変換の進み具合。変換中でなければ0 */
  readonly progress = computed(() => {
    const status = this.entry().status;
    return status.phase === "converting" ? status.progress : 0;
  });

  /** 変換が今どこまで進んだかを尺で表したもの */
  readonly elapsed = computed(() => formatElapsed((this.entry().input.info?.durationSec ?? 0) * this.progress()));

  /** 進捗の百分率。一覧の右端と同じ丸め方にする */
  readonly percent = computed(() => Math.round(this.progress() * 100));

  /**
   * 解像度を1つの文字列にする
   *
   * @param width - 横幅
   * @param height - 縦幅
   * @returns 「1920x1080」の形。取れていなければ-
   */
  size(width: number | undefined, height: number | undefined): string {
    return width && height ? `${width}x${height}` : "-";
  }
}
