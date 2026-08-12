import { Component, computed, inject, output } from "@angular/core";
import { ConfigStore } from "../../shared/config.store";
import { formatRemaining, splitPath } from "../../shared/format";
import { IconComponent } from "../../shared/icon/icon.component";
import { DetailPanelComponent } from "./components/detail-panel/detail-panel.component";
import { FileListComponent } from "./components/file-list/file-list.component";
import { SetupPanelComponent } from "./components/setup-panel/setup-panel.component";
import { StatusBarComponent } from "./components/status-bar/status-bar.component";
import { ConverterService } from "./converter.service";
import { ConverterStore } from "./store/converter.store";

/**
 * コンバートページ
 */
@Component({
  selector: "app-converter-page",
  imports: [DetailPanelComponent, FileListComponent, IconComponent, SetupPanelComponent, StatusBarComponent],
  templateUrl: "./converter.page.html",
  styleUrl: "./converter.page.scss",
})
export class ConverterPage {
  readonly store = inject(ConverterStore);
  readonly config = inject(ConfigStore);
  readonly converter = inject(ConverterService);

  /** 設定画面リクエスト */
  readonly settingsRequested = output<void>();

  /** 入力ディレクトリ */
  readonly inputPath = computed(() => splitPath(this.config.inputDir() ?? ""));
  /** 出力ディレクトリ */
  readonly outputPath = computed(() => splitPath(this.config.outputDir() ?? ""));

  /** 進行の一行に出すバーの伸び。出力を読み直している間は幅いっぱいにする */
  readonly liveWidth = computed(() => {
    const status = this.store.active()?.status;
    if (!status) return 0;

    return status.phase === "converting" ? Math.round(status.progress * 100) : 100;
  });

  /** 進行の一行の右端。変換中は進み具合、それ以外は段階の名前 */
  readonly liveLabel = computed(() => {
    const status = this.store.active()?.status;
    if (!status) return "";

    return status.phase === "converting" ? `${Math.round(status.progress * 100)}%` : "確認中";
  });

  constructor() {
    // 画面を開いた時点でffmpegの確認と前回のディレクトリの読み込みを始める
    void this.converter.init();
  }

  /**
   * ヘッダーに出す残り時間
   *
   * @returns 「25分」のような丸めた文字列
   */
  remaining(): string {
    return formatRemaining(this.store.remainingSec());
  }
}
