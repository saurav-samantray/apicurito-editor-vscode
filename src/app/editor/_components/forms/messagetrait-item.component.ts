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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewEncapsulation} from "@angular/core";
import {AaiMessageTraitDefinition} from "@apicurio/data-models";
import {AbstractBaseComponent} from "../common/base-component";
import {DocumentService} from "../../_services/document.service";
import {SelectionService} from "../../_services/selection.service";
import {ModelUtils} from "../../_util/model.util";


@Component({
    selector: "[messagetrait-item]",
    templateUrl: "messagetrait-item.component.html",
    styleUrls: [ "messagetrait-item.component.css" ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageTraitItemComponent extends AbstractBaseComponent {

    @Input() messageTrait: AaiMessageTraitDefinition;

    constructor(private changeDetectorRef: ChangeDetectorRef, private documentService: DocumentService,
                private selectionService: SelectionService) {
        super(changeDetectorRef, documentService, selectionService);
    }

    /**
     * Returns the name of the message trait.
     */
    public messageTraitName(): string {
        return this.messageTrait.getName();
    }

    /**
     * Gets the node path for the message trait.
     */
    public asNodePath(): string {
        return ModelUtils.nodeToPath(this.messageTrait);
    }

    /**
     * Returns true iff the message trait definition is "imported".  A definition is imported if it has a $ref
     * that refers to an external source (anything other than #/ references).
     */
    isImported(): boolean {
        let $ref: string = this.messageTrait.$ref;
        return ($ref && $ref.indexOf("#") != 0);
    }

}
