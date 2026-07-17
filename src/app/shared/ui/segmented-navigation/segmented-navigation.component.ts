import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentedNavigationOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-segmented-navigation',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './segmented-navigation.component.html',
})
export class SegmentedNavigation {
    @Input() options: SegmentedNavigationOption[] = [];
    @Input() selected = '';
    @Input() ariaLabel = 'Sections';
    @Input() columnsClass = '';
    @Input() pillStyle = false;

    @Output() selectedChange = new EventEmitter<string>();
}
