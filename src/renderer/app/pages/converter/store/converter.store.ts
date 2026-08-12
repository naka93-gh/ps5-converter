import { computed, Injectable, signal } from "@angular/core";
import type { EntryStatus, FileEntry, MediaFile, VerifyDetail } from "@shared/types";
import { isDone, isWaiting, needsAttention } from "../../../shared/entry";

/**
 * 実時間の何倍で変換が進むか
 * 残り時間の見積もりに使う
 */
// TODO: あくまでM4 Maxでの実測なのでこれでいいのかは再検討
const SPEED_RATIO = 5;

/**
 * コンバーターページの状態
 */
@Injectable({ providedIn: "root" })
export class ConverterStore {
  /**
   * 一覧の実体
   */
  private readonly _entries = signal<FileEntry[]>([]);

  /**
   * 一覧
   * 外部から直接書き換えられないよう読み取り専用
   */
  readonly entries = this._entries.asReadonly();

  /**
   * 詳細に出している1件のパス
   */
  readonly selectedPath = signal<string | null>(null);

  /**
   * 走査中かどうか
   */
  readonly scanning = signal(false);

  /**
   * 変換中かどうか
   */
  readonly converting = signal(false);

  /**
   * 中断してキューが止まるまでの間
   */
  readonly canceling = signal(false);

  /**
   * ヘッダーに出す一行。処理の途中経過や結果を入れる
   */
  readonly notice = signal("");

  /**
   * 詳細に出す1件。未選択ならnull
   */
  readonly selected = computed(() => this.entries().find((entry) => entry.input.path === this.selectedPath()) ?? null);

  /**
   * 状態ごとの件数。要確認は不一致と失敗をまとめて数える
   */
  readonly counts = computed(() => {
    const entries = this.entries();
    return {
      all: entries.length,
      pending: entries.filter(isWaiting).length,
      done: entries.filter(isDone).length,
      ng: entries.filter(needsAttention).length,
      // 段階の名前はskipped、画面では「対象外」と出している
      invalid: entries.filter((entry) => entry.status.phase === "skipped").length,
    };
  });

  /**
   * 走査中か変換中か。操作を止めるのに使う
   */
  readonly busy = computed(() => this.scanning() || this.converting());

  /**
   * 今mainで処理している1件。走っていなければnull
   */
  readonly active = computed(
    () =>
      this.entries().find((entry) => entry.status.phase === "converting" || entry.status.phase === "verifying") ?? null,
  );

  /**
   * 何件目を処理しているか。手を付け終えた数に今の1件を足す
   */
  readonly position = computed(() => {
    const counts = this.counts();
    return counts.all - counts.pending;
  });

  /**
   * 待機分と変換中の残りから、終わるまでのおおよその秒数を出す
   */
  readonly remainingSec = computed(() => {
    const entries = this.entries();

    // 待機中はまだ手を付けていないので尺をまるごと足す
    const waiting = entries.filter(isWaiting).reduce((sum, entry) => sum + (entry.input.info?.durationSec ?? 0), 0);

    // 変換中の1本は残りだけを足す
    const live = entries.find((entry) => entry.status.phase === "converting");
    const liveRest =
      live?.status.phase === "converting" ? (live.input.info?.durationSec ?? 0) * (1 - live.status.progress) : 0;

    return (waiting + liveRest) / SPEED_RATIO;
  });

  /**
   * 一覧をまるごと入れ替える
   *
   * @param entries - 新しい一覧
   */
  setEntries(entries: FileEntry[]): void {
    this._entries.set(entries);
  }

  /**
   * 選択を切り替える
   * 同じものを選び直したときは選択を外す
   *
   * @param inputPath - 選ぶファイルのパス
   */
  select(inputPath: string | null): void {
    this.selectedPath.set(this.selectedPath() === inputPath ? null : inputPath);
  }

  /**
   * 指定ファイルパスのステータスを設定する
   *
   * @param inputPath - 対象のファイルのパス
   * @param status - ステータス
   */
  setStatus(inputPath: string, status: EntryStatus): void {
    this.update(inputPath, (entry) => ({ ...entry, status }));
  }

  /**
   * 変換中の1件の進捗を差し替える
   *
   * @param inputPath - 対象のファイルのパス
   * @param progress - 進み具合。0〜1
   */
  setProgress(inputPath: string, progress: number): void {
    this.update(inputPath, (entry) =>
      entry.status.phase === "converting" ? { ...entry, status: { phase: "converting", progress } } : entry,
    );
  }

  /**
   * 検証の結果と、そこで読み直した出力を書き戻す
   *
   * @param inputPath - 対象のファイルのパス
   * @param output - 検証時点の出力
   * @param detail - 項目ごとの結果
   */
  finishVerify(inputPath: string, output: MediaFile, detail: VerifyDetail): void {
    this.update(inputPath, (entry) => ({ ...entry, output, status: { phase: "verified", detail } }));
  }

  /**
   * 1件分だけ差し替える
   *
   * @param inputPath - 対象のファイルのパス
   * @param change - 新しい1件を返す関数
   */
  private update(inputPath: string, change: (entry: FileEntry) => FileEntry): void {
    this._entries.update((entries) => entries.map((entry) => (entry.input.path === inputPath ? change(entry) : entry)));
  }
}
