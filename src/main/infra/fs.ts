import { stat } from "node:fs/promises";

/**
 * ファイルのサイズを調べる
 *
 * @param path - 調べるファイル
 * @returns バイト数、ファイルが無ければnull
 */
export async function sizeOf(path: string): Promise<number | null> {
  try {
    const info = await stat(path);
    return info.size;
  } catch {
    return null;
  }
}
