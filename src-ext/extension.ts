/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';


export class ADTConfig {
    public modelFolders: string[];

    // constructor(modelFolders: string[]) {
    //     this.modelFolders = modelFolders;
    // }

    constructor(obj : any) {
        this.modelFolders = obj["modelFolders"];
    }
}

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


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('apicurito.start', async (node) => {
            if (node && node.fsPath) {
                const filePath = node.fsPath;
                ApicuritoPanelContainer.get(context).createOrShow(filePath);
            }
        })
    );
}


const buildDir = "dist";


class ApicuritoPanelContainer {


    private panels: { [filePath: string]: ApicuritoPanel } = {};
    private extensionPath: string;
    private static instance: ApicuritoPanelContainer;

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath;
    }

    public static get(context: vscode.ExtensionContext) {
        if (!this.instance) {
            this.instance = new ApicuritoPanelContainer(context.extensionPath);
        }
        return this.instance;
    }

    public createOrShow(filePath: string): ApicuritoPanel {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.Active;
        if (!this.panels[filePath]) {
            this.panels[filePath] = new ApicuritoPanel(this, this.extensionPath, column || vscode.ViewColumn.One, filePath);
        }
        this.panels[filePath].reveal();
        return this.panels[filePath];
    }

    public dispose(panel: ApicuritoPanel) {
        delete this.panels[panel.getFilePath()];
        panel.dispose();
    }
}


/**
 * Manages a webview panel
 */
class ApicuritoPanel {

    private static readonly viewType = 'apicurito';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private filePath: string;
    private column: vscode.ViewColumn;
    private container: ApicuritoPanelContainer;

    public reveal() {
        this._panel.reveal(this.column);
    }

    public getFilePath() {
        return this.filePath;
    }

    public constructor(container: ApicuritoPanelContainer, extensionPath: string, column: vscode.ViewColumn, filePath: string) {
        this.container = container;
        this.filePath = filePath;
        this._extensionPath = extensionPath;
        this.column = column;

        this._panel = vscode.window.createWebviewPanel(
            ApicuritoPanel.viewType,
            "Apicurito - " + path.basename(filePath),
            column,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(this._extensionPath, buildDir))],
                retainContextWhenHidden: true
            });

        this._panel.webview.html = this._getHtmlForWebview();

        this._panel.onDidDispose(() => this.container.dispose(this), null, []);

        this._panel.webview.onDidReceiveMessage(rawMessage => {
            const workingDirPath : string = vscode.workspace.rootPath!;
            let message: VscodeMessage = rawMessage;

            let adtConfig: ADTConfig;

            //Make reading this file optional
            fs.readFile(path.join(workingDirPath, "./.vscode/apicurio-config.json"), {encoding: "utf-8"}, (err, data) => {
                if (err) {
                    vscode.window.showErrorMessage(`[Apicurio Extension] Unable to read adt configuration`);
                } else {
                    console.log(`[Apicurio Extension] [ready]successfully read apicurio-config.json: ${data}`);
                    adtConfig = new ADTConfig(JSON.parse(data));
                    console.log(`[Apicurio Extension] [ready]adtConfig Object: ${JSON.stringify(adtConfig)}`);
                }
            });

            switch (message.type) {
                case 'alert':
                    vscode.window.showErrorMessage(message.data);
                    return;
                case 'ready':
                    fs.readFile(this.filePath, "utf-8", (err, data) => {
                        if (err) {
                            vscode.window.showErrorMessage(`Error: ${err}`);
                        } else {
                            console.log(`[Apicurio Extension] [ready] vscode.workspace ${JSON.stringify(workingDirPath)}`);
                            const extRefs : any[] = this.allNodes(JSON.parse(data), "$ref", []);
                            
                            //read all the configured mode folders for JSON and yaml. Logic should be improved to filter only DMs
                            if(adtConfig) {
                                const models = adtConfig.modelFolders
                                    .map(folder => this.fetchModelsFromFolder(workingDirPath, folder, []));
                                console.log(`All the fetched models: ${JSON.stringify(models)}`);
                                vscode.window.showInformationMessage(`Successfully read all model folders`);

                            }
                                console.log(`[Apicurio Extension] [ready] extRefs: ${JSON.stringify(extRefs)}`);
                                let m = new VscodeMessage("open", data, extRefs, workingDirPath!);
                                this.sendMessage(m);
                        }
                    });
                    return;
                case 'save-req':
                    console.log(`[Extension] save-req recieved from webview. Saving file ${this.filePath}`);
                    fs.writeFile(this.filePath, message.data, (err) => {
                        console.log(`[Apicurio Extension] [save-req] vscode.workspace ${JSON.stringify(workingDirPath)}`);
                        vscode.window.showInformationMessage(`${this.filePath} saved successfully`);
                        this.sendMessage(new VscodeMessage("save-res", null,  [], ""));
                    });
                    return;
                case 'read-local':
                    console.log(`[Extension] read-local recieved from webview. reading file ${message.data}`);
                    const absPath = "c:\\workspace\\apicurio\\example";
                    fs.readFileSync(path.join(workingDirPath, message.data), {encoding: "utf-8"})
                    return;
            }
        }, null, []);

    }

    public sendMessage(message: any) {
        this._panel.webview.postMessage(message);
    }

    public dispose() {
        this._panel.dispose();
    }

    private allNodes(obj: any, key: string, array: any[]) : any[] {
        array = array || [];
        if ('object' === typeof obj) {
            for (let k in obj) {
                if (k === key && obj[k].startsWith("./")) {
                    const fileContent = fs.readFileSync(path.join(vscode.workspace.rootPath!, obj[k]), "utf-8");
                    array.push({path: obj[k], content: fileContent});
                } else {
                    this.allNodes(obj[k], key, array);
                }
            }
        }
        return array;
    }

    private fetchModelsFromFolder(workingDirPath: string, dir: string, array: any[]) : any[] {
        array = array || [];
        fs.readdirSync(path.join(workingDirPath,dir)).forEach(file => {
            let fullPath = path.join(workingDirPath, dir, file);
            if (fs.lstatSync(fullPath).isDirectory()) {
                return this.fetchModelsFromFolder(workingDirPath, fullPath, array);
            }  
            array.push({name: file, path: path.join(dir, file)});
          });
        return array;
    }

    private _getHtmlForWebview() {

        const basePath = vscode.Uri.file(path.join(this._extensionPath, buildDir));
        const baseUri = basePath.with({ scheme: 'vscode-resource' });
        const nonce = getNonce();

        let html = `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>Apicurito</title>
            <base href="${baseUri}/">

            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="icon" type="image/x-icon" href="favicon.ico">
            <link rel="stylesheet" href="./styles.css">

            <script type="text/javascript" src="./version.js"></script>
            <script type="text/javascript" src="./config/config.js"></script>

            <style>
                #app-loading {
                    padding-top: 90px;
                    margin: auto;
                    text-align: center;
                }
            </style>

        </head>
        <body>
        <app-root>
            <div class="container container-fluid" id="load-container">
                <div id="app-loading">
                    <img src="assets/app-loading.gif">
                </div>
            </div>
        </app-root>
        <script nonce="${nonce}" type="text/javascript" src="runtime.js"></script>
        <script nonce="${nonce}" type="text/javascript" src="es2015-polyfills.js" nomodule></script>
        <script nonce="${nonce}" type="text/javascript" src="polyfills.js"></script>
        <script nonce="${nonce}" type="text/javascript" src="scripts.js"></script>
        <script nonce="${nonce}" type="text/javascript" src="vendor.js"></script>
        <script nonce="${nonce}" type="text/javascript" src="main.js"></script>
        </body>
        </html>
        `;
        return html;
    }
}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
