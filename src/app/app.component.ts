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

import {Component} from '@angular/core';
import {ApiDefinition} from "./editor/_models/api.model";
import {WindowRef} from './services/window-ref.service';
import {AppInfoService} from "./services/app-info.service";
import {VscodeExtensionService} from './services/vscode-extension.service';
import * as YAML from 'js-yaml';
import {ApiFileEncoding} from "./editor/api-file-encoding.type";
import { EditingInfo } from './components/models/editingInfo.model';
import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';

declare var acquireVsCodeApi: any;
declare var window: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {

    helpExpanded: boolean = false;

    api: ApiDefinition = null;
    isShowLoading: boolean = true;
    isShowEditor: boolean = false;
    isShowError: boolean = false;
    encoding: ApiFileEncoding = ApiFileEncoding.JSON; // default to JSON
    config: EditingInfo;

    private vscode: VscodeExtensionService;

    constructor(private logger: LoggerService, private configService: ConfigService, private winRef: WindowRef, public appInfo: AppInfoService, vscode: VscodeExtensionService) {
        this.vscode = vscode;
        this.vscode.addMessageHandler("open", message => {
            this.openEditor(message.data);
        });

        configService.get("OPENAPI").then(cfg => {
            this.config = cfg;
        }).catch(error => {
            this.logger.error("Failed to get editor configuration: %o", error);
        });
    }

    public ngAfterViewInit() {
        this.vscode.apicuritoReady();
    }

    public openEditor(content: any): void {
        this.api = new ApiDefinition();
        this.api.createdBy = 'user';
        this.api.createdOn = new Date();
        this.api.tags = [];
        this.api.description = '';
        this.api.id = 'api-1';
        this.api.type = "OpenAPI30";
        this.api.spec = this.parseContent(content);
        this.isShowLoading = false;
            this.isShowEditor = true;
    }

    /**
     * Parses the given content into a JS object.  This should support both JSON and YAML content.  If
     * parsing fails we should log an error and return null.  That will indicate to any consumers that
     * there *should* be an entry for the content but that the content failed to be parsed.
     *
     * A side effect of this method is to set the "encoding" field to either JSON or YAML.
     *
     * @param body
     */
    private parseContent(content: any): any {
        let rval: any = null;
        if (typeof content === "object") {
            rval = content;
            this.encoding = ApiFileEncoding.JSON;
        }

        if (rval == null) {
            try {
                rval = JSON.parse(content);
                this.encoding = ApiFileEncoding.JSON;
            } catch (e) {}
        }

        if (rval == null) {
            try {
                rval = YAML.safeLoad(content);
                this.encoding = ApiFileEncoding.YAML;
            } catch (e) {}
        }

        if (rval == null) {
            console.warn("Failed to parse content!");
        }

        return rval;
    }

}
