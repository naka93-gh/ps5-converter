import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";

// 起動に失敗すると画面が白いままになるので、コンソールに残すようにする
bootstrapApplication(AppComponent).catch((err) => console.error(err));
