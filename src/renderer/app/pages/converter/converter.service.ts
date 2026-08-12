import { Injectable, inject } from "@angular/core";
import { messageOf } from "@shared/error";
import type { FileEntry } from "@shared/types";
import { ConfigService } from "../../shared/config.service";
import { ConfigStore } from "../../shared/config.store";
import { isWaiting, needsVerify } from "../../shared/entry";
import { ConverterStore } from "./store/converter.store";

/**
 * コンバーターのサービスクラス
 */
@Injectable({ providedIn: "root" })
export class ConverterService {
  private readonly store = inject(ConverterStore);
  private readonly config = inject(ConfigStore);
  private readonly configService = inject(ConfigService);

  /**
   * 起動後に一度でも初期化したか
   */
  private initialized = false;

  constructor() {
    // 変換中の進捗だけはmainから押し出されてくるので購読する
    window.api.onProgress(({ inputPath, progress }) => this.store.setProgress(inputPath, progress));
  }

  /**
   * 初期化処理
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // 前回の設定を画面へ戻し、ffmpegの有無も見る
    await this.configService.load();

    if (this.config.ready()) await this.scan();
  }

  /**
   * ディレクトリを選び直して読み込む
   *
   * @param kind - 入力と出力のどちらを選ぶか
   */
  async pickDir(kind: "input" | "output"): Promise<void> {
    const picked = await this.configService.pickDir(kind);
    if (!picked) return;

    if (this.config.ready()) await this.scan();
  }

  /**
   * 入力ディレクトリを読み直して一覧を作る
   */
  async scan(): Promise<void> {
    const inputDir = this.config.inputDir();
    const outputDir = this.config.outputDir();
    if (!inputDir || !outputDir) return;

    this.store.scanning.set(true);
    this.store.notice.set("読み込んでいます");

    try {
      // 一覧が入れ替わるので選択も外す
      const entries = await window.api.scan(inputDir, outputDir);
      this.store.setEntries(entries);
      this.store.selectedPath.set(null);
      this.store.notice.set(entries.length === 0 ? "webmが見つかりません" : "");
    } catch (error) {
      this.store.notice.set(messageOf(error));
    } finally {
      this.store.scanning.set(false);
    }
  }

  /**
   * 待機中のファイルを1本ずつ変換し、続けて出力を検証する
   */
  async convert(): Promise<void> {
    this.store.converting.set(true);
    this.store.canceling.set(false);
    this.store.notice.set("");

    let converted = 0;
    let failed = 0;

    try {
      for (const entry of this.store.entries()) {
        if (this.store.canceling()) break;
        if (!isWaiting(entry)) continue;

        this.store.setStatus(entry.input.path, { phase: "converting", progress: 0 });
        const result = await window.api.convertOne(entry);

        // 中断は失敗ではないので、次回の再実行で拾えるよう待ちへ戻す
        if (result.status === "canceled") {
          this.store.setStatus(entry.input.path, { phase: "canceled" });
          break;
        }

        if (result.status === "failed") {
          failed++;
          this.store.setStatus(entry.input.path, { phase: "failed", reason: result.reason });
          continue;
        }

        converted++;
        await this.runVerify(entry);
      }

      // 変換済みとして飛ばしたファイルも突き合わせておく
      if (!this.store.canceling()) {
        for (const entry of this.store.entries().filter(needsVerify)) {
          await this.runVerify(entry);
        }
      }

      this.store.notice.set(
        this.store.canceling() ? `中断しました（変換 ${converted}件）` : `変換 ${converted}件 / 失敗 ${failed}件`,
      );
    } catch (error) {
      this.store.notice.set(messageOf(error));
    } finally {
      this.store.converting.set(false);
      this.store.canceling.set(false);
    }
  }

  /**
   * 変換を中断する
   */
  async cancel(): Promise<void> {
    this.store.canceling.set(true);
    await window.api.cancel();
  }

  /**
   * Finderでファイルの場所を開く
   *
   * @param path - 開くファイルのパス
   */
  reveal(path: string): void {
    void window.api.reveal(path);
  }

  /**
   * 出力を検証して結果を一覧へ反映する
   *
   * @param entry - 検証するファイル
   */
  private async runVerify(entry: FileEntry): Promise<void> {
    this.store.setStatus(entry.input.path, { phase: "verifying" });

    try {
      const { detail, output } = await window.api.verify(entry);
      this.store.finishVerify(entry.input.path, output, detail);
    } catch (error) {
      // 1本読めなかっただけでキュー全体を止めない
      this.store.setStatus(entry.input.path, { phase: "failed", reason: messageOf(error) });
    }
  }
}
