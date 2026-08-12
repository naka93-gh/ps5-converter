import { computed, Injectable, signal } from "@angular/core";
import { DEFAULT_CONFIG } from "@shared/types";

/**
 * 変換画面と設定画面のどちらからも参照する設定値の状態
 */
@Injectable({ providedIn: "root" })
export class ConfigStore {
  /**
   * 入力ディレクトリ
   */
  readonly inputDir = signal<string | null>(DEFAULT_CONFIG.inputDir);

  /**
   * 出力ディレクトリ
   */
  readonly outputDir = signal<string | null>(DEFAULT_CONFIG.outputDir);

  /**
   * 映像のビットレート(Mbps)
   */
  readonly videoBitrateMbps = signal(DEFAULT_CONFIG.videoBitrateMbps);

  /**
   * 音声のビットレート(kbps)
   */
  readonly audioBitrateKbps = signal(DEFAULT_CONFIG.audioBitrateKbps);

  /**
   * 手動で指定する場合のffmpegのパス
   */
  readonly ffmpegPath = signal<string | null>(DEFAULT_CONFIG.ffmpegPath);

  /**
   * 手動で指定する場合のffprobeのパス
   */
  readonly ffprobePath = signal<string | null>(DEFAULT_CONFIG.ffprobePath);

  /**
   * ffmpegが見つからないときの警告
   */
  readonly binaryError = signal("");

  /**
   * 入力と出力がどちらも選ばれているか
   */
  readonly dirsChosen = computed(() => Boolean(this.inputDir() && this.outputDir()));

  /**
   * 変換を始められるか
   */
  readonly ready = computed(() => this.dirsChosen() && !this.binaryError());
}
