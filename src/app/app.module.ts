/**
 * @license
 * Copyright 2018 Red Hat
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
//import {ApicurioCommonComponentsModule, ApicurioEditorModule} from 'apicurio-design-studio';

import {AppComponent} from './app.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import {FormsModule} from '@angular/forms';
import {WindowRef} from './services/window-ref.service';
import {EmptyStateComponent} from "./empty/empty-state.component";
import {DownloaderService} from "./services/downloader.service";
import {HttpClientModule} from "@angular/common/http";
import {AppInfoService} from './services/app-info.service';
import {ConfigService} from './services/config.service';
import {StorageService} from "./services/storage.service";
//import {ConfigureValidationComponent} from "./editor/configure-validation.dialog";
import { VscodeExtensionService } from './services/vscode-extension.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {LoggerService} from "./services/logger.service"
import {ApicurioEditorModule} from "./editor.module";
import {AsyncApiEditorComponent} from "./components/editors/asyncapi-editor.component";
import {OpenApiEditorComponent} from "./components/editors/openapi-editor.component";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ApicurioEditorModule,
        ModalModule.forRoot(),
        BsDropdownModule.forRoot(),
        BrowserAnimationsModule
    ],
    declarations: [
        AppComponent,
        EmptyStateComponent,
        OpenApiEditorComponent,
        AsyncApiEditorComponent
    ],
    providers: [WindowRef, AppInfoService, LoggerService, ConfigService, DownloaderService, StorageService, VscodeExtensionService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
