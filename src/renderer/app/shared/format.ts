/**
 * 秒を m:ss にする
 *
 * @param seconds - 秒数
 * @returns 「23:45」の形、尺が取れていないときは「-」
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "-";
  return ms(seconds);
}

/**
 * 経過時間を m:ss にする
 *
 * 尺と違い0にも意味があるので、始まったばかりでも0:00と出す
 *
 * @param seconds - 経過した秒数
 * @returns 「12:34」の形
 */
export function formatElapsed(seconds: number): string {
  return ms(Math.max(seconds, 0));
}

/**
 * 秒をm:ssへ組み立てる
 *
 * PS5のビデオクリップは最長1時間なので、時間の桁は持たせず60分ちょうどは60:00と出す
 *
 * @param seconds - 秒数
 * @returns 「23:45」の形
 */
function ms(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/**
 * バイト数を読みやすい単位にする
 *
 * @param bytes - バイト数
 * @returns 1GB以上ならGB、それ未満はMB、取れていなければ「-」
 */
export function formatSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

/**
 * パスを分割する
 *
 * @param path - 表示するパス
 * @returns 前半と、区切りから始まる末尾。区切りが無ければ前半は空文字
 */
export function splitPath(path: string): { head: string; tail: string } {
  const index = path.lastIndexOf("/");
  if (index <= 0) return { head: "", tail: path };

  return { head: path.slice(0, index), tail: path.slice(index) };
}

/**
 * 残り時間を丸めて出す
 *
 * @param seconds - 残りの秒数
 * @returns 「25分」「1時間5分」の形
 */
export function formatRemaining(seconds: number): string {
  if (seconds < 60) return "1分未満";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}分`;

  return `${Math.floor(minutes / 60)}時間${minutes % 60}分`;
}
