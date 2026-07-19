import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'cw-cheat-sheet',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cw-cheat-sheet.component.html',
})
export class CwCheatSheetComponent {
    @Input() showToolbar = true;
    @Input() compact = false;

    print(): void {
        window.print();
    }
}
