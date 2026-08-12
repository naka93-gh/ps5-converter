import { Injectable, inject } from "@angular/core";
import type { AppConfig } from "@shared/types";
import { ConfigStore } from "./config.store";

/**
 * 設定のサービスクラス
 */
@Injectable({ providedIn: "root" })
export class ConfigService {
  private readonly store = inject(ConfigStore);

  /**
   * 保存された設定を読み込み、バイナリの有無を調べる
   */
  async load(): Promise<void> {
    this.apply(await window.api.loadConfig());
    await this.refreshBinaries();
  }

  /**
   * 設定を保存する
   *
   * @param config - 保存する設定
   */
  async save(config: AppConfig): Promise<void> {
    await window.api.saveConfig(config);
    this.apply(config);

    // 手で指定したパスに実物があるとは限らないので、保存のたびに確かめ直す
    await this.refreshBinaries();
  }

  /**
   * ディレクトリを選び直して保存する
   *
   * @param kind - 入力と出力のどちらを選ぶか
   * @returns 選び直したらtrue、取り消したらfalse
   */
  async pickDir(kind: "input" | "output"): Promise<boolean> {
    const target = kind === "input" ? this.store.inputDir : this.store.outputDir;
    const picked = await window.api.selectDir(target());
    if (!picked) return false;

    // 次回の起動で復元できるよう、選んだ時点で残す
    target.set(picked);
    await window.api.saveConfig(this.current());

    return true;
  }

  /**
   * 画面が持っている設定を1つにまとめる
   *
   * @returns 保存に渡す設定
   */
  current(): AppConfig {
    return {
      inputDir: this.store.inputDir(),
      outputDir: this.store.outputDir(),
      videoBitrateMbps: this.store.videoBitrateMbps(),
      audioBitrateKbps: this.store.audioBitrateKbps(),
      ffmpegPath: this.store.ffmpegPath(),
      ffprobePath: this.store.ffprobePath(),
    };
  }

  /**
   * 読み込んだ設定を画面へ反映する
   *
   * @param config - 反映する設定
   */
  private apply(config: AppConfig): void {
    this.store.inputDir.set(config.inputDir);
    this.store.outputDir.set(config.outputDir);
    this.store.videoBitrateMbps.set(config.videoBitrateMbps);
    this.store.audioBitrateKbps.set(config.audioBitrateKbps);
    this.store.ffmpegPath.set(config.ffmpegPath);
    this.store.ffprobePath.set(config.ffprobePath);
  }

  /**
   * ffmpegとffprobeの有無を調べ、足りなければ警告に出す
   */
  private async refreshBinaries(): Promise<void> {
    const binaries = await window.api.checkBinaries();
    const missing = (["ffmpeg", "ffprobe"] as const).filter((name) => !binaries[name]);

    this.store.binaryError.set(missing.length === 0 ? "" : `${missing.join("と")}が見つかりません`);
  }
}
