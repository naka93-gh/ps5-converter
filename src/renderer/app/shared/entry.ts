import type { FileEntry } from "@shared/types";

/**
 * バッジと丸印の色。CSS変数の名前に合わせる
 */
export type StatusTone = "muted" | "run" | "ok" | "bad";

/**
 * 画面に出す状態の見た目
 */
export interface StatusBadge {
  label: string;
  tone: StatusTone;
}

/**
 * 1件の見た目を段階から決める
 *
 * @param entry - 対象のファイル
 * @returns バッジの文言と色
 */
export function statusOf(entry: FileEntry): StatusBadge {
  const status = entry.status;

  switch (status.phase) {
    case "waiting":
      return { label: "待機", tone: "muted" };
    case "canceled":
      return { label: "中断", tone: "muted" };
    case "skipped":
      return { label: "対象外", tone: "muted" };
    case "unverified":
      return { label: "変換済み", tone: "ok" };
    case "converting":
      return { label: "変換中", tone: "run" };
    case "verifying":
      return { label: "確認中", tone: "run" };
    case "verified":
      return status.detail.ok ? { label: "OK", tone: "ok" } : { label: "不一致", tone: "bad" };
    case "failed":
      return { label: "失敗", tone: "bad" };
  }
}

/**
 * 変換の進み具合
 *
 * @param entry - 対象のファイル
 * @returns 0〜1。変換中でなければnull
 */
export function progressOf(entry: FileEntry): number | null {
  return entry.status.phase === "converting" ? entry.status.progress : null;
}

/**
 * 変換の順番を待っているか
 *
 * 中断で待ちへ戻したものも含む
 *
 * @param entry - 対象のファイル
 * @returns 変換対象でまだ手を付けていなければtrue
 */
export function isWaiting(entry: FileEntry): boolean {
  return entry.status.phase === "waiting" || entry.status.phase === "canceled";
}

/**
 * 変換を飛ばしたまま検証がまだか
 *
 * @param entry - 対象のファイル
 * @returns 出力が既にあって、今回まだ突き合わせていなければtrue
 */
export function needsVerify(entry: FileEntry): boolean {
  return entry.status.phase === "unverified";
}

/**
 * 変換の手間が済んでいるか
 *
 * 検証がまだの変換済みも、変換自体は要らないので含める
 *
 * @param entry - 対象のファイル
 * @returns 検証が通ったか、検証待ちの変換済みならtrue
 */
export function isDone(entry: FileEntry): boolean {
  const status = entry.status;
  return status.phase === "unverified" || (status.phase === "verified" && status.detail.ok);
}

/**
 * 手当てが要るか
 *
 * @param entry - 対象のファイル
 * @returns 検証が通らなかったか、変換に失敗していればtrue
 */
export function needsAttention(entry: FileEntry): boolean {
  const status = entry.status;
  return status.phase === "failed" || (status.phase === "verified" && !status.detail.ok);
}

/**
 * 備考に出す一行
 *
 * 段階ごとに持っている理由を、そのまま出せる文にして取り出す
 *
 * @param entry - 対象のファイル
 * @returns 出す文。無ければ空文字
 */
export function reasonOf(entry: FileEntry): string {
  const status = entry.status;

  switch (status.phase) {
    case "skipped":
    case "failed":
      return status.reason;
    case "canceled":
      return "中断しました";
    case "verified":
      return status.detail.checks.find((check) => !check.ok)?.reason ?? "";
    default:
      return "";
  }
}
