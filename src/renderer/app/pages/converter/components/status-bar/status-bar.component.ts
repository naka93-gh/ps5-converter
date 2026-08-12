import { Component, inject } from "@angular/core";
import { ConverterStore } from "../../store/converter.store";

/**
 * 画面の下端に置く件数の内訳
 */
@Component({
  selector: "app-status-bar",
  templateUrl: "./status-bar.component.html",
  styleUrl: "./status-bar.component.scss",
})
export class StatusBarComponent {
  readonly store = inject(ConverterStore);
}
