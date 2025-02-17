/**
 * @license
 * Copyright 2018 JBoss Inc
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

import {Component, Input, OnChanges, SimpleChanges, ViewEncapsulation} from "@angular/core";
import * as marked from "marked";

@Component({
    selector: "markdown",
    template: `<div class="md-container" [innerHTML]="convertedData" [class.empty]="isEmpty()"></div>`,
    styleUrls: ["markdown.component.css"],
    encapsulation: ViewEncapsulation.None
})
export class MarkdownComponent implements OnChanges {
    @Input("data")
    data: string;
    @Input("emptyText")
    emptyText: string = "No value.";

    public convertedData: any;

    ngOnChanges(changes: SimpleChanges): void {
        if (this.data) {
            // TODO sanitize the result using e.g. DOMPurify
            const mrval = marked.parse(this.data, {});
            if (typeof mrval === "string") {
                this.convertedData = mrval;
            } else {
                mrval.then(value => {
                    this.convertedData = value;
                });
            }
        }
    }

    public isEmpty(): boolean {
        if(this.data === null || this.data === undefined) {
            return true;
        } else {
            if (typeof this.data === "string") {
                return this.data?.trim().length === 0;
            } else {
                return false;
            }
        }
    }
}
