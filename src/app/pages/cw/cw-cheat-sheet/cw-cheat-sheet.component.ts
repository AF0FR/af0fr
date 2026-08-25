import { isPlatformBrowser, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { OpsLogCategory } from '../../af0fr_logbook/models/logbook.model';
import { standardCq, standardExchange } from '../cw-protocol';

type CheatSheetField =
    | 'ownCall'
    | 'otherCall'
    | 'greeting'
    | 'rst'
    | 'qth'
    | 'ownName'
    | 'otherName'
    | 'rig'
    | 'power'
    | 'antenna'
    | 'antennaHeight'
    | 'weather'
    | 'temperature'
    | 'yearsHam'
    | 'yearsCw'
    | 'activity'
    | 'age'
    | 'occupation'
    | 'hobby'
    | 'qslPreference'
    | 'favoriteBand'
    | 'operatingSchedule'
    | 'recentProject'
    | 'potaState'
    | 'ownPark'
    | 'otherPark';

@Component({
    selector: 'cw-cheat-sheet',
    standalone: true,
    imports: [NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cw-cheat-sheet.component.html',
})
export class CwCheatSheetComponent implements OnInit {
    private readonly storageKey = 'cw-on-air-reference-v1';
    private readonly fields: CheatSheetField[] = [
        'ownCall', 'otherCall', 'greeting', 'rst', 'qth', 'ownName', 'otherName',
        'rig', 'power', 'antenna', 'antennaHeight', 'weather', 'temperature',
        'yearsHam', 'yearsCw', 'activity', 'age', 'occupation', 'hobby',
        'qslPreference',
        'favoriteBand', 'operatingSchedule', 'recentProject',
        'potaState', 'ownPark', 'otherPark',
    ];

    @Input() showToolbar = true;
    @Input() compact = false;
    @Input() protocol: OpsLogCategory = 'standard';
    readonly standardCq = standardCq('AF0FR');
    readonly standardExchange = standardExchange('<CALL>', 'AF0FR', '<RST>', 'OAKVILLE MO', 'TAYLOR', 'GM/GA/GE');

    ownCall = '';
    otherCall = '';
    greeting = 'GM';
    rst = '';
    qth = '';
    ownName = '';
    otherName = '';
    rig = '';
    power = '';
    antenna = '';
    antennaHeight = '';
    weather = '';
    temperature = '';
    yearsHam = '';
    yearsCw = '';
    activity = '';
    age = '';
    occupation = '';
    hobby = '';
    qslPreference = 'DIRECT';
    favoriteBand = '';
    operatingSchedule = '';
    recentProject = '';
    potaState = '';
    ownPark = '';
    otherPark = '';

    constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

    ngOnInit(): void {
        this.restoreState();
    }

    get printableCq(): string {
        return standardCq(this.valueOrSlot(this.ownCall, 'URCALL'));
    }

    get printableExchange(): string {
        return standardExchange(
            this.valueOrSlot(this.otherCall, 'HISCALL'),
            this.valueOrSlot(this.ownCall, 'URCALL'),
            this.valueOrSlot(this.rst, 'RST'),
            this.valueOrSlot(this.qth, 'CITY STATE'),
            this.valueOrSlot(this.ownName, 'URNAME'),
            this.greeting,
        );
    }

    valueOrSlot(value: string, label: string): string {
        return value.trim().toUpperCase() || `<${label}>`;
    }

    updateField(field: CheatSheetField, value: string): void {
        this[field] = value.toUpperCase();
        this.persistState();
    }

    print(): void {
        window.print();
    }

    private restoreState(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        try {
            const saved = JSON.parse(localStorage.getItem(this.storageKey) ?? '{}') as Record<string, unknown>;
            for (const field of this.fields) {
                if (typeof saved[field] === 'string') this[field] = saved[field];
            }
        } catch {
            // Ignore unavailable storage or invalid data and retain the defaults.
        }
    }

    private persistState(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        try {
            localStorage.setItem(
                this.storageKey,
                JSON.stringify(Object.fromEntries(this.fields.map(field => [field, this[field]]))),
            );
        } catch {
            // The reference remains usable when browser storage is unavailable.
        }
    }
}
