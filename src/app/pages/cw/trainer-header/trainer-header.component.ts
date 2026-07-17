import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
    SegmentedNavigation,
    SegmentedNavigationOption,
} from '../../../shared/ui/segmented-navigation/segmented-navigation.component';

export type CwWorkspaceView = 'practice' | 'progress' | 'cheatSheet';

@Component({
    selector: 'cw-trainer-header',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SegmentedNavigation],
    templateUrl: './trainer-header.component.html',
})
export class TrainerHeader {
    readonly navigationOptions: SegmentedNavigationOption[] = [
        { value: 'practice', label: 'Practice' },
        { value: 'progress', label: 'Progress' },
        { value: 'cheatSheet', label: 'Cheat Sheet' },
    ];
    @Input() callsign = '';
    @Input() activeWorkspace: CwWorkspaceView = 'practice';

    @Output() callsignChange = new EventEmitter<string>();
    @Output() profileSave = new EventEmitter<void>();
    @Output() workspaceSelect = new EventEmitter<CwWorkspaceView>();
}
