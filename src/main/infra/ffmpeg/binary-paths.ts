import { existsSync } from "node:fs";
import { join } from "node:path";
import type { BinaryStatus } from "@shared/types";

/**
 * バイナリ探索ディレクトリの候補
 * Finderから起動したアプリのPATHは/usr/bin程度しかなく、Homebrewの場所が含まれないのでこちらで補完
 */
const CANDIDATE_DIRS = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];

/**
 * 探すバイナリの名前
 */
type BinaryName = keyof BinaryStatus;

/**
 * ffmpeg/ffprobeのパスを解決するためのシングルトン
 */
export class BinaryPaths {
  /**
   * 探索結果
   * 見つからなかったことも覚えるため値はnullを許容
   */
  private readonly cache = new Map<string, string | null>();

  /**
   * 設定で指定されたパス
   * 値があれば探索より優先する
   */
  private overrides: BinaryStatus = { ffmpeg: null, ffprobe: null };

  /**
   * 手動で指定されたパスを取り込む
   *
   * @param overrides - 設定のパス。指定なしはnull
   */
  setOverrides(overrides: BinaryStatus): void {
    this.overrides = overrides;
    this.cache.clear();
  }

  /**
   * ffmpegとffprobeが揃っているかを調べる
   *
   * @returns 見つかればパス、見つからなければnull
   */
  check(): BinaryStatus {
    return { ffmpeg: this.find("ffmpeg"), ffprobe: this.find("ffprobe") };
  }

  /**
   * バイナリの絶対パスを取得する
   *
   * @param name - 探すバイナリ名
   * @returns 見つかった絶対パス
   */
  get(name: BinaryName): string {
    const path = this.find(name);
    if (!path) {
      throw new Error(`${name}が見つかりません`);
    }
    return path;
  }

  /**
   * バイナリを探す
   *
   * @param name - 探すバイナリ名
   * @returns 見つかればパス、見つからなければnull
   */
  find(name: BinaryName): string | null {
    // 手動で指定されたパスは探索より優先
    // 実在しなければ見つからない扱いにして警告にとどめる
    const override = this.overrides[name];
    if (override) return existsSync(override) ? override : null;

    // キャッシュにあるなら検索せずキャッシュの内容で返す
    const cached = this.cache.get(name);
    if (cached !== undefined) return cached;

    // PATHの中を順次検索
    const fromPath = (process.env.PATH ?? "").split(":").filter(Boolean);
    const found = [...CANDIDATE_DIRS, ...fromPath].map((dir) => join(dir, name)).find((path) => existsSync(path));

    // 見つかればキャッシュに保持してパスを、見つからなければnullを返す
    const result = found ?? null;
    this.cache.set(name, result);
    return result;
  }
}

/**
 * アプリ全体で使い回すインスタンス
 * 探索結果を共有したいのでここで1つだけ作る
 */
export const binaryPaths = new BinaryPaths();
