import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NamedLogbook } from '../models/logbook.model';

@Component({
    selector: 'logbook-selector',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule],
    templateUrl: './logbook-selector.component.html',
})
export class LogbookSelector {
    @Input() logbooks: NamedLogbook[] = [];
    @Input() activeLogId = '';
    @Input() newLogName = '';

    @Output() logbookSelect = new EventEmitter<string>();
    @Output() newLogNameChange = new EventEmitter<string>();
    @Output() logbookAdd = new EventEmitter<void>();
    @Output() activeLogbookRename = new EventEmitter<void>();
    @Output() activeLogbookDelete = new EventEmitter<void>();
}
