import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AzimuthView } from '../models/azimuth.model';
import {
    SegmentedNavigation,
    SegmentedNavigationOption,
} from '../../../shared/ui/segmented-navigation/segmented-navigation.component';

@Component({
    selector: 'azimuth-header',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SegmentedNavigation],
    templateUrl: './azimuth-header.component.html',
})
export class AzimuthHeader {
    readonly navigationOptions: SegmentedNavigationOption[] = [
        { value: 'reports', label: 'Reports' },
        { value: 'map', label: 'Map' },
    ];
    @Input() currentCallsign = '';
    @Input() callsignDraft = '';
    @Input() editingCallsign = false;
    @Input() activeView: AzimuthView = 'reports';

    @Output() callsignEdit = new EventEmitter<void>();
    @Output() callsignSave = new EventEmitter<string>();
    @Output() callsignCancel = new EventEmitter<void>();
    @Output() viewSelect = new EventEmitter<AzimuthView>();
}
