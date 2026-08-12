import { Component, inject } from "@angular/core";
import { formatRemaining } from "../../shared/format";
import { DetailPanelComponent } from "./components/detail-panel/detail-panel.component";
import { FileListComponent } from "./components/file-list/file-list.component";
import { SummaryPanelComponent } from "./components/summary-panel/summary-panel.component";
import { ConverterService } from "./converter.service";
import { ConverterStore } from "./store/converter.store";

/**
 * コンバートページ
 */
@Component({
  selector: "app-converter-page",
  imports: [DetailPanelComponent, FileListComponent, SummaryPanelComponent],
  templateUrl: "./converter.page.html",
  styleUrl: "./converter.page.scss",
})
export class ConverterPage {
  readonly store = inject(ConverterStore);
  readonly converter = inject(ConverterService);

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
