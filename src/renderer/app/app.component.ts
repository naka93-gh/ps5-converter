import { Component, signal } from "@angular/core";
import { ConverterPage } from "./pages/converter/converter.page";
import { SettingsPage } from "./pages/settings/settings.page";

/**
 * アプリのルートコンポーネント
 */
@Component({
  selector: "app-root",
  imports: [ConverterPage, SettingsPage],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  /**
   * 今出している画面
   * 画面が増えてきたらRouterを入れるかを検討する
   */
  readonly page = signal<"converter" | "settings">("converter");
}
