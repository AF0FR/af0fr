import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SavedNetControlSession } from '../models/saved-net-control-session.model';

@Component({
    selector: 'session-manager',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule],
    templateUrl: './session-manager.component.html',
})
export class SessionManager {
    @Input() backendOnline = false;
    @Input() editing = false;
    @Input() pendingClearCurrentSession = false;
    @Input() isClearingCurrentSession = false;
    @Input() savedSessions: SavedNetControlSession[] = [];
    @Input() savedSessionName = '';
    @Input() selectedSavedSessionId = '';

    @Output() editingToggle = new EventEmitter<void>();
    @Output() savedSessionNameChange = new EventEmitter<string>();
    @Output() selectedSavedSessionIdChange = new EventEmitter<string>();
    @Output() saveCurrent = new EventEmitter<void>();
    @Output() exportCurrent = new EventEmitter<void>();
    @Output() importCurrent = new EventEmitter<Event>();
    @Output() clearCurrent = new EventEmitter<void>();
    @Output() loadSelected = new EventEmitter<void>();
    @Output() deleteSelected = new EventEmitter<void>();
}
