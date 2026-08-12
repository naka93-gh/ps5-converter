import { Component, inject } from "@angular/core";
import { ConfigStore } from "../../../../shared/config.store";
import { IconComponent } from "../../../../shared/icon/icon.component";
import { ConverterService } from "../../converter.service";

/**
 * 入出力のディレクトリがまだ決まっていないときに出す案内
 */
@Component({
  selector: "app-setup-panel",
  imports: [IconComponent],
  templateUrl: "./setup-panel.component.html",
  styleUrl: "./setup-panel.component.scss",
})
export class SetupPanelComponent {
  readonly config = inject(ConfigStore);
  readonly converter = inject(ConverterService);
}
