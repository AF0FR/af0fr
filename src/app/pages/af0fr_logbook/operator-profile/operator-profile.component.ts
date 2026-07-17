import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'logbook-operator-profile',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './operator-profile.component.html',
})
export class OperatorProfile {
    @Input() operatorCall = '';
    @Input() operatorName = '';
    @Input() stationGrid = '';
    @Input() stationCity = '';
    @Input() stationState = '';
    @Input() stationCountry = '';
    @Input() stationRig = '';
    @Input() stationAntenna = '';
    @Input() stationPower = '';

    @Output() operatorCallChange = new EventEmitter<string>();
    @Output() operatorNameChange = new EventEmitter<string>();
    @Output() stationGridChange = new EventEmitter<string>();
    @Output() stationCityChange = new EventEmitter<string>();
    @Output() stationStateChange = new EventEmitter<string>();
    @Output() stationCountryChange = new EventEmitter<string>();
    @Output() stationRigChange = new EventEmitter<string>();
    @Output() stationAntennaChange = new EventEmitter<string>();
    @Output() stationPowerChange = new EventEmitter<string>();
    @Output() profileSave = new EventEmitter<void>();
}
