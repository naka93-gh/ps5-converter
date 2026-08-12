import { Component, computed, inject } from "@angular/core";
import { ConfigStore } from "../../../../shared/config.store";
import { needsAttention, reasonOf } from "../../../../shared/entry";
import { formatRemaining } from "../../../../shared/format";
import { ConverterStore } from "../../store/converter.store";

/**
 * 未選択のときに出す全体のまとめ
 *
 * 件数と、手当てが要るファイルへの入口を並べる
 */
@Component({
  selector: "app-summary-panel",
  templateUrl: "./summary-panel.component.html",
  styleUrl: "./summary-panel.component.scss",
})
export class SummaryPanelComponent {
  readonly store = inject(ConverterStore);
  readonly config = inject(ConfigStore);

  protected readonly formatRemaining = formatRemaining;
  protected readonly reasonOf = reasonOf;

  /** 手当てが要るファイル。検証が通らなかったものと変換に失敗したもの */
  readonly attention = computed(() => this.store.entries().filter(needsAttention));
}
