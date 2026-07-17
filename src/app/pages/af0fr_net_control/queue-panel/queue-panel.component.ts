import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Station } from '../models/station.model';

@Component({
    selector: 'queue-panel',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './queue-panel.component.html',
})
export class QueuePanel {
    @Input({ required: true }) queue: Station[] = [];

    @Output() confirm = new EventEmitter<string>();
}
