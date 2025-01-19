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


import { Injectable } from "@angular/core";
import { WindowRef } from "./window-ref.service";
import { EditingInfoContent } from "../components/models/editingInfoContent.model";
import { EditingInfo } from "../components/models/editingInfo.model";
import { LoggerService } from "./logger.service";

export interface GeneratorConfig {
    name: string;
    url: string;
}
export interface Config {
    generators: Array<GeneratorConfig>;
}

const DEMO_CONTENT = `{
    "openapi": "3.0.2",
    "info": {
        "title": "Demo API",
        "version": "1.0.0",
        "description": "A sample API.",
        "termsOfService": "http://swagger.io/terms/"
    },
    "paths": {},
    "components": {}
}`;


const ASYNC_DEMO_CONTENT = `{
  "asyncapi": "2.0.0",
  "info": {
    "title": "DEMO API",
    "version": "1.0.0",
    "description": "A sample API",
    "license": {
      "name": "Apache 2.0",
      "url": "https://www.apache.org/licenses/LICENSE-2.0"
    }
  }
}`;

const openAPIContent: EditingInfoContent = {
    type: "OPENAPI",
    value: DEMO_CONTENT
}

const asyncAPIContent: EditingInfoContent = {
    type: "ASYNCAPI",
    value: ASYNC_DEMO_CONTENT
}

/**
 * Holds the application config.
 */
@Injectable()
export class ConfigService implements Config {

    generators: GeneratorConfig[] = [{
        name: "Fuse Camel Project",
        url: "http://localhost:8080/api/v1/generate/camel-project.zip"
    }];

    constructor(private windowRef: WindowRef, private logger: LoggerService) {
        let serverConfig: any = windowRef.window["ApicuritoConfig"]

        if (serverConfig) {
            console.info("[ConfigService] Loaded config from server.");
            this.generators = serverConfig.generators;
        } else {
            console.warn("[ConfigService] Could not load config from server, using defaults.");
        }
    }

    public get(type: string): Promise<EditingInfo> {
        const content = this.getContent(type);
        this.logger.info("[ConfigService] content details: %o", content);
        return new Promise((resolve, reject) => {
            // TODO pass some vendor extensions for openapi editing
            const info: EditingInfo = {
                content: content,
                features: {
                    allowImports: false,
                    allowCustomValidations: false
                },
                openapi: {
                    vendorExtensions: []
                }
            };
            resolve(info);
        });
    }

    private getContent(type: string): EditingInfoContent {
        switch (type) {
            case "OPENAPI":
                return openAPIContent;
            case "ASYNCAPI":
                return asyncAPIContent;
        }
        return null;
    };
}