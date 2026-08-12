import { Component } from "@angular/core";
import { ConverterPage } from "./pages/converter/converter.page";

/**
 * アプリのルートコンポーネント
 */
@Component({
  selector: "app-root",
  imports: [ConverterPage],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {}
