import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Af0frLogbookPage } from '../af0fr_logbook/af0fr_logbook.page';
import { HamBandsPage } from '../af0fr/ham-bands/ham-bands.page';
import { CwCheatSheetComponent } from '../cw/cw-cheat-sheet/cw-cheat-sheet.component';

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, Af0frLogbookPage, HamBandsPage, CwCheatSheetComponent],
    templateUrl: './ops-dashboard.page.html',
})
export class OpsDashboardPage {}
