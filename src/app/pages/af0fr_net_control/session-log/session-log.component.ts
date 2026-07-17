import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LogEntry } from '../models/log-entry.model';

@Component({
    selector: 'session-log',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './session-log.component.html',
})
export class SessionLog {
    @Input({ required: true }) entries: LogEntry[] = [];
}
