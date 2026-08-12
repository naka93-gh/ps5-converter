import { ErrorHandler, provideBrowserGlobalErrorListeners } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { AppErrorHandler } from "./app/shared/app-error.handler";

// 起動に失敗すると画面が白いままになるので、コンソールに残すようにする
bootstrapApplication(AppComponent, {
  providers: [provideBrowserGlobalErrorListeners(), { provide: ErrorHandler, useExisting: AppErrorHandler }],
}).catch((err) => console.error(err));
