import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'script-panel',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './script-panel.component.html',
})
export class ScriptPanel {
    @Input() openingScript = '';
    @Input() trafficPrompt = '';
    @Input() lateCheckinPrompt = '';
    @Input() closingScript = '';

    collapsed = true;
}
