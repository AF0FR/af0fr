import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OpsLogCategory } from '../../af0fr_logbook/models/logbook.model';
import { NgIf } from '@angular/common';

@Component({
    selector: 'cw-cheat-sheet',
    standalone: true,
    imports: [NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cw-cheat-sheet.component.html',
})
export class CwCheatSheetComponent {
    @Input() showToolbar = true;
    @Input() compact = false;
    @Input() protocol: OpsLogCategory = 'standard';

    print(): void {
        window.print();
    }
}
