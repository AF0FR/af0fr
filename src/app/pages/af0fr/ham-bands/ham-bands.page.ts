import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

type Mode = 'data' | 'phone' | 'cw';

interface BandSegment {
    start: number;
    end: number;
    mode: Mode;
}

interface LicenseRow {
    license: string;
    power?: string;
    segments: BandSegment[];
}

interface HamBand {
    name: string;
    label: string;
    start: number;
    end: number;
    ticks: number[];
    rows: LicenseRow[];
    note?: string;
}

@Component({
    standalone: true,
    imports: [DecimalPipe, RouterLink],
    templateUrl: './ham-bands.page.html',
})
export class HamBandsPage {
    readonly bands: HamBand[] = [
        {
            name: '80 meters', label: '3.5 MHz', start: 3.5, end: 4.0,
            ticks: [3.5, 3.525, 3.6, 3.7, 3.8, 4.0],
            rows: [
                { license: 'Extra', segments: [{ start: 3.5, end: 3.6, mode: 'data' }, { start: 3.6, end: 4.0, mode: 'phone' }] },
                { license: 'Advanced', segments: [{ start: 3.525, end: 3.6, mode: 'data' }, { start: 3.7, end: 4.0, mode: 'phone' }] },
                { license: 'General', segments: [{ start: 3.525, end: 3.6, mode: 'data' }, { start: 3.8, end: 4.0, mode: 'phone' }] },
                { license: 'Novice / Technician', power: '200 W PEP', segments: [{ start: 3.525, end: 3.6, mode: 'cw' }] },
            ],
        },
        {
            name: '40 meters', label: '7 MHz', start: 7.0, end: 7.3,
            ticks: [7.0, 7.025, 7.075, 7.1, 7.125, 7.175, 7.3],
            rows: [
                { license: 'Extra', segments: [{ start: 7.0, end: 7.125, mode: 'data' }, { start: 7.125, end: 7.3, mode: 'phone' }] },
                { license: 'Advanced', segments: [{ start: 7.025, end: 7.125, mode: 'data' }, { start: 7.125, end: 7.3, mode: 'phone' }] },
                { license: 'General', segments: [{ start: 7.025, end: 7.125, mode: 'data' }, { start: 7.175, end: 7.3, mode: 'phone' }] },
                { license: 'Novice / Technician', power: '200 W PEP', segments: [{ start: 7.025, end: 7.125, mode: 'cw' }] },
            ],
            note: 'ITU Regions 1 and 3—and Region 2 stations west of 130° W or below 20° N—use 7.000–7.075 MHz for RTTY/data and 7.075–7.300 MHz for phone/image. Novice and Technician 7.025–7.125 MHz privileges are outside Region 2; see FCC §§97.301(e), 97.305(c), and 97.307(f)(11). These exemptions do not apply in the continental U.S.',
        },
        {
            name: '20 meters', label: '14 MHz', start: 14.0, end: 14.35,
            ticks: [14.0, 14.025, 14.15, 14.175, 14.225, 14.35],
            rows: [
                { license: 'Extra', segments: [{ start: 14.0, end: 14.15, mode: 'data' }, { start: 14.15, end: 14.35, mode: 'phone' }] },
                { license: 'Advanced', segments: [{ start: 14.025, end: 14.15, mode: 'data' }, { start: 14.175, end: 14.35, mode: 'phone' }] },
                { license: 'General', segments: [{ start: 14.025, end: 14.15, mode: 'data' }, { start: 14.225, end: 14.35, mode: 'phone' }] },
            ],
        },
        {
            name: '15 meters', label: '21 MHz', start: 21.0, end: 21.45,
            ticks: [21.0, 21.025, 21.2, 21.225, 21.275, 21.45],
            rows: [
                { license: 'Extra', segments: [{ start: 21.0, end: 21.2, mode: 'data' }, { start: 21.2, end: 21.45, mode: 'phone' }] },
                { license: 'Advanced', segments: [{ start: 21.025, end: 21.2, mode: 'data' }, { start: 21.225, end: 21.45, mode: 'phone' }] },
                { license: 'General', segments: [{ start: 21.025, end: 21.2, mode: 'data' }, { start: 21.275, end: 21.45, mode: 'phone' }] },
                { license: 'Novice / Technician', power: '200 W PEP', segments: [{ start: 21.025, end: 21.2, mode: 'cw' }, { start: 21.275, end: 21.45, mode: 'phone' }] },
            ],
        },
    ];

    position(value: number, band: HamBand): number {
        return ((value - band.start) / (band.end - band.start)) * 100;
    }

    width(segment: BandSegment, band: HamBand): number {
        return ((segment.end - segment.start) / (band.end - band.start)) * 100;
    }

    modeLabel(mode: Mode): string {
        return mode === 'data' ? 'RTTY and data' : mode === 'phone' ? 'Phone and image' : 'CW only';
    }
}
