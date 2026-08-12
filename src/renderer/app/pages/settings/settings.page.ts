import { Component, computed, inject, output, signal } from "@angular/core";
import { BITRATE_RANGE, DEFAULT_CONFIG } from "@shared/types";
import { ConfigService } from "../../shared/config.service";
import { ConfigStore } from "../../shared/config.store";
import { IconComponent } from "../../shared/icon/icon.component";

/**
 * 設定ページ
 */
@Component({
  selector: "app-settings-page",
  imports: [IconComponent],
  templateUrl: "./settings.page.html",
  styleUrl: "./settings.page.scss",
})
export class SettingsPage {
  private readonly store = inject(ConfigStore);
  private readonly config = inject(ConfigService);

  /** 変換画面へ戻ることを親へ伝える */
  readonly closed = output<void>();

  /** ビットレート入力の上下限 */
  protected readonly range = BITRATE_RANGE;

  /** 編集中の映像ビットレート(Mbps) */
  readonly videoBitrateMbps = signal(String(this.store.videoBitrateMbps()));
  /** 編集中の音声ビットレート(kbps) */
  readonly audioBitrateKbps = signal(String(this.store.audioBitrateKbps()));
  /** バイナリの自動/手動 */
  readonly binaryMode = signal<"auto" | "manual">(
    this.store.ffmpegPath() || this.store.ffprobePath() ? "manual" : "auto",
  );
  /** 編集中のffmpegのパス */
  readonly ffmpegPath = signal(this.store.ffmpegPath() ?? "");
  /** 編集中のffprobeのパス */
  readonly ffprobePath = signal(this.store.ffprobePath() ?? "");

  /**
   * 保存できるかどうかの判定
   */
  readonly valid = computed(() => {
    // ビットレートが範囲内に治っているか
    if (!inRange(this.videoBitrateMbps(), this.range.video)) return false;
    if (!inRange(this.audioBitrateKbps(), this.range.audio)) return false;

    // バイナリを手動で指定する場合は入力されているか
    // TODO: 保存時に、バイナリがそこにあるかどうかは検査してもいいかもしれない
    if (this.binaryMode() === "auto") return true;
    return this.ffmpegPath().trim() !== "" && this.ffprobePath().trim() !== "";
  });

  /**
   * 設定を保存して変換画面へ戻る
   */
  async save(): Promise<void> {
    // バイナリを自動で探すにしているときは入力パスを削除して保存する
    const manual = this.binaryMode() === "manual";
    await this.config.save({
      inputDir: this.store.inputDir(),
      outputDir: this.store.outputDir(),
      videoBitrateMbps: Number(this.videoBitrateMbps()),
      audioBitrateKbps: Number(this.audioBitrateKbps()),
      ffmpegPath: manual ? this.ffmpegPath().trim() || null : null,
      ffprobePath: manual ? this.ffprobePath().trim() || null : null,
    });

    this.closed.emit();
  }

  /**
   * 編集中の値を初期値へ戻す
   */
  reset(): void {
    this.videoBitrateMbps.set(String(DEFAULT_CONFIG.videoBitrateMbps));
    this.audioBitrateKbps.set(String(DEFAULT_CONFIG.audioBitrateKbps));
    this.binaryMode.set("auto");
    this.ffmpegPath.set(DEFAULT_CONFIG.ffmpegPath ?? "");
    this.ffprobePath.set(DEFAULT_CONFIG.ffprobePath ?? "");
  }

  /**
   * 入力欄の値を取り出す
   *
   * @param event - inputイベント
   * @returns 打ち込まれた文字列
   */
  textOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}

/**
 * 入力された値が範囲に収まっているか
 *
 * @param value - 入力された文字列
 * @param range - 許す範囲
 * @returns 収まっていればtrue
 */
function inRange(value: string, range: { min: number; max: number }): boolean {
  const num = Number(value);
  return value.trim() !== "" && Number.isInteger(num) && num >= range.min && num <= range.max;
}
