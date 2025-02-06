/**
 * @license
 * Copyright 2022 Red Hat
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

import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import * as YAML from 'js-yaml';
import {LoggerService} from "../../services/logger.service";
import {EditorComponent} from "./editor.component";
import {WindowRef} from "../../services/window-ref.service";
import {ApiDefinition} from "../../editor/_models/api.model";
import {AaiEditorComponent} from "../../editor/aaieditor.component";
import { EditingInfo } from "../models/editingInfo.model";
import { ApiEditorComponentFeatures } from "../../editor/_models/features.model";
import { VscodeExtensionService, VscodeMessage } from "../../services/vscode-extension.service";
import { ApiFileEncoding } from "../../editor/api-file-encoding.type";
import { DownloaderService } from "../../services/downloader.service";
import { ConfigService, GeneratorConfig } from "../../services/config.service";
import { StorageService } from "../../services/storage.service";


@Component({
    selector: "asyncapi-editor",
    templateUrl: "asyncapi-editor.component.html",
    styleUrls: ["asyncapi-editor.component.css"]
})
export class AsyncApiEditorComponent implements EditorComponent {

    // @ts-ignore
    @Input() api: ApiDefinition;
    @Input() config: EditingInfo;
    @Input() encoding: ApiFileEncoding;

    @Output() onClose: EventEmitter<void> = new EventEmitter<void>();

    @ViewChild("apiEditor") apiEditor: AaiEditorComponent | undefined;


    generating: boolean = false;
    generateError: string = null;

    showSuccessToast: boolean = false;
    showErrorToast: boolean = false;
    toastTimeoutId: number = null;

    persistenceTimeout: number;

    vscodeExtension: VscodeExtensionService;

    /**
     * Constructor.
     */
    constructor(private logger: LoggerService, private window: WindowRef, private downloader: DownloaderService,
        public configService: ConfigService,
        private storage: StorageService, vscodeExtension: VscodeExtensionService) {
            this.vscodeExtension = vscodeExtension;
        vscodeExtension.bindEditorSave(() => {
            this.logger.info("Binding editorSave to saveExt()")
            this.saveExt();
        });
    }

    /**
     * Called whenever the API definition is changed by the user.
     */
    public documentChanged(): any {
        this.logger.info("[AsyncApiEditorComponent] Detected a document change");
        const newValue: ApiDefinition = this.apiEditor.getValue();
        const message: any = {
            type: "apicurio_onChange",
            data: {
                content: newValue.spec
            }
        };
        this.window.window.top.postMessage(message, "*");
    }

    public saveExt() {
            let spec: any = this.apiEditor.getValue().spec;
            if (typeof spec === "object") {
                if (this.encoding == ApiFileEncoding.JSON) {
                    spec = JSON.stringify(spec, null, 4);
                } else if (this.encoding == ApiFileEncoding.YAML) {
                    spec = YAML.dump(spec, {
                        indent: 4,
                        lineWidth: 110,
                        noRefs: true
                    });
                }
                this.vscodeExtension.sendMessage(new VscodeMessage("save-req", spec, [], ""));
            }
        }
    
        public save(format: string = "json"): Promise<boolean> {
            console.info("[EditorComponent] Saving the API definition.");
            this.generateError = null;
            let ct: string = "application/json";
            let filename: string = "openapi-spec";
            let spec: any = this.apiEditor.getValue().spec;
            if (typeof spec === "object") {
                if (format === "json") {
                    spec = JSON.stringify(spec, null, 4);
                    filename += ".json";
                } else {
                    //spec = YAML.stringify(spec, 100, 4);
                    spec = YAML.dump(spec, {
                        indent: 4,
                        lineWidth: 110,
                        noRefs: true
                    });
                    filename += ".yaml";
                }
            }
            let content: string = spec;
            return this.downloader.downloadToFS(content, ct, filename).then(rval => {
                this.storage.clear();
                return rval;
            });
        }
    
        public close(): void {
            console.info("[EditorComponent] Closing the editor.");
            this.generateError = null;
            this.storage.clear();
            this.onClose.emit();
        }
    
        public saveAndClose(): void {
            console.info("[EditorComponent] Saving and then closing the editor.");
            this.save().then(() => {
                this.close();
            });
        }
    
        public generate(gconfig: GeneratorConfig): void {
            console.info("[EditorComponent] Generating project: ", gconfig);
    
            this.generateError = null;
            this.showErrorToast = false;
            this.showSuccessToast = false;
    
            let spec: any = this.apiEditor.getValue().spec;
            if (typeof spec === "object") {
                spec = JSON.stringify(spec, null, 4);
            }
            let content: string = spec;
            let filename: string = "camel-project.zip";
            this.generating = true;
            this.downloader.generateAndDownload(gconfig, content, filename).then(() => {
                this.generating = false;
                this.showSuccessToast = true;
                // this.toastTimeoutId = setTimeout(() => {
                //     this.showSuccessToast = false;
                // }, 5000);
            }).catch(error => {
                console.error("[EditorComponent] Error generating project: ", error);
                this.generating = false;
                this.generateError = error.message;
                this.showErrorToast = true;
                // Only fade-away automatically for successful generation.  Error stays until dismissed.
                // this.toastTimeoutId = setTimeout(() => {
                //     this.showErrorToast = false;
                // }, 5000);
            });
        }
    
        public closeSuccessToast(): void {
            this.showSuccessToast = false;
            clearTimeout(this.toastTimeoutId);
        }
    
        public closeErrorToast(): void {
            this.showErrorToast = false;
            clearTimeout(this.toastTimeoutId);
        }

    public getValue(): string {
        const value: ApiDefinition = this.apiEditor.getValue();
        return JSON.stringify(value.spec, null, 4);
    }

}
