import { Component, input } from "@angular/core";

/**
 * 使えるアイコンの名前
 */
export type IconName = "gear" | "refresh" | "folder" | "pencil" | "play" | "stop" | "back";

/**
 * ボタンやラベルに添える小さなアイコン
 */
@Component({
  selector: "app-icon",
  templateUrl: "./icon.component.html",
  styleUrl: "./icon.component.scss",
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
