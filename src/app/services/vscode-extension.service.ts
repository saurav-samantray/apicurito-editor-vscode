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


import {Injectable} from "@angular/core";
import {WindowRef} from "./window-ref.service";
import {bind as mousetrap_bind} from 'mousetrap';

declare var acquireVsCodeApi: any; // GLOBAL
export class VscodeMessage {

    public type: string;
    public data: any;
    public workspacePath: string;
    public extRefs: any[];

    constructor(type: string, data: any, extRefs: any[], workspacePath: string) {
        this.type = type;
        this.data = data;
        this.extRefs = extRefs;
        this.workspacePath = workspacePath;
    }

    public static Ready(data?: string, workspacePath?: string) { return new VscodeMessage("ready", data ? data : null, [], workspacePath ? workspacePath : ""); }
    public static Alert(data: string, workspacePath: string) { return new VscodeMessage("alert", data, [], workspacePath); }
}

export interface Dictionary<T> {
    [key: string]: T;
}


export type MessageHandler = (message: VscodeMessage) => void;

/**
 * Allows for communication with the vscode editor
 */
@Injectable()
export class VscodeExtensionService {

    private readonly _vscode: any = acquireVsCodeApi();

    private _messageHandlers: Dictionary<MessageHandler[]> = {};

    private _workspacePath: string;

    constructor(private window: WindowRef) {

        window.window.addEventListener('message', (event: any) => {
            console.debug("Incoming event: ", event);
            let message = new VscodeMessage(event.data.type, event.data.data, event.data.extRefs, event.data.workspacePath);
            this._workspacePath = event.data.workspacePath;
            let handlers = this._messageHandlers[message.type];
            if(handlers && handlers.length > 0) {
                for(let handler of handlers) {
                    handler(message);
                }
            } else {
                console.warn("Unhandled message: ", message);
            }
         });
    }

    public addMessageHandler(type: string, handler: MessageHandler) {
        let handlers = this._messageHandlers[type];
        if(!handlers) {
            handlers = [];
            this._messageHandlers[type] = handlers;
        }
        handlers.push(handler);
    }

    public sendMessage(message: VscodeMessage) {
        this._vscode.postMessage(message);
    }

    public apicuritoReady() {
        this.sendMessage(VscodeMessage.Ready());
    }

    public bindEditorSave(saveFn: () => void) {
        mousetrap_bind(['command+s', 'ctrl+s'], (e) => {
            saveFn();
            console.debug(e);
            return false;
        });
    }
}
