import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OpsLogCategory } from '../../af0fr_logbook/models/logbook.model';
import { NgFor, NgIf } from '@angular/common';
import { standardCq, standardExchange } from '../cw-protocol';

@Component({
    selector: 'cw-cheat-sheet',
    standalone: true,
    imports: [NgFor, NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cw-cheat-sheet.component.html',
})
export class CwCheatSheetComponent {
    @Input() showToolbar = true;
    @Input() compact = false;
    @Input() protocol: OpsLogCategory = 'standard';
    readonly standardCq = standardCq('AF0FR');
    readonly standardExchange = standardExchange('<CALL>', 'AF0FR', '<RST>', 'OAKVILLE MO', 'TAYLOR');
    readonly printableCq = standardCq('<URCALL>');
    readonly printableExchange = standardExchange('<HISCALL>', '<URCALL>', '<RST>', '<CITY> <STATE>', '<NAME> <NAME>');

    print(): void {
        window.print();
    }
}
