/**
 * ffprobeで読み取った動画の情報
 *
 * 項目が欠けていても分岐せずに済むよう、数値は0、文字列は空文字で埋める
 */
export interface VideoInfo {
  durationSec: number;
  width: number;
  height: number;
  colorTransfer: string;
  codecName: string;
}

/**
 * 入力か出力のファイル1つ分
 *
 * 詳細画面で元と出力を左右に並べるため、どちらも同じ形で持つ
 */
export interface MediaFile {
  path: string;
  /** バイト数。ファイルがまだ無ければnull */
  sizeBytes: number | null;
  /** 読み取った動画の情報。読めなければnull */
  info: VideoInfo | null;
}

/**
 * 検証1項目分の結果。どの条件で落ちたかを画面に出すため個別に持つ
 */
export interface VerifyCheck {
  label: string;
  ok: boolean;
  /** 詳細に並べる値 */
  detail: string;
  /** 一覧に出す一行。単体で意味が通る文にする */
  reason: string;
}

/**
 * 検証の全体結果
 */
export interface VerifyDetail {
  ok: boolean;
  checks: VerifyCheck[];
}

/**
 * 1件が今どの段階にいるか
 *
 * その段階にしか無い値（進み具合・失敗の理由・検証結果）は段階の中へ入れ、
 * ありえない組み合わせを型で持てなくする
 */
export type EntryStatus =
  /** 変換の順番を待っている */
  | { phase: "waiting" }
  /** 中断で待ちへ戻した。再実行でそのまま拾う */
  | { phase: "canceled" }
  /** 変換の対象にしない */
  | { phase: "skipped"; reason: string }
  /** 出力が既にあり、突き合わせがまだ */
  | { phase: "unverified" }
  /** 変換中。progressは0〜1 */
  | { phase: "converting"; progress: number }
  /** 出力を突き合わせている */
  | { phase: "verifying" }
  /** 突き合わせが済んだ。通ったかはdetail.okで見る */
  | { phase: "verified"; detail: VerifyDetail }
  /** ffmpegが異常終了した */
  | { phase: "failed"; reason: string };

/**
 * 一覧に並べるファイル1件分
 *
 * 走査で決まる素性（name・input・output.path）と、進行につれて動くstatusを分けて持つ
 */
export interface FileEntry {
  /** 拡張子を除いたファイル名 */
  name: string;
  input: MediaFile;
  output: MediaFile;
  status: EntryStatus;
}
