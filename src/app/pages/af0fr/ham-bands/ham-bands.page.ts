import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

type Mode = 'data' | 'phone' | 'cw' | 'mixed';

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
    voluntaryCw?: { start: number; end: number };
}

interface FlatBandSegment extends BandSegment {
    license: string;
    voluntaryCw: boolean;
}

@Component({
    selector: 'ham-band-reference',
    standalone: true,
    imports: [DecimalPipe, RouterLink],
    templateUrl: './ham-bands.page.html',
})
export class HamBandsPage {
    @Input() embedded = false;
    @Input() compact = false;
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
            ticks: [7.0, 7.025, 7.125, 7.175, 7.3],
            rows: [
                { license: 'Extra', segments: [{ start: 7.0, end: 7.125, mode: 'data' }, { start: 7.125, end: 7.3, mode: 'phone' }] },
                { license: 'Advanced', segments: [{ start: 7.025, end: 7.125, mode: 'data' }, { start: 7.125, end: 7.3, mode: 'phone' }] },
                { license: 'General', segments: [{ start: 7.025, end: 7.125, mode: 'data' }, { start: 7.175, end: 7.3, mode: 'phone' }] },
                { license: 'Novice / Technician', power: '200 W PEP', segments: [{ start: 7.025, end: 7.125, mode: 'cw' }] },
            ],
        },
        {
            name: '20 meters', label: '14 MHz', start: 14.0, end: 14.35,
            ticks: [14.0, 14.025, 14.07, 14.15, 14.175, 14.225, 14.35],
            voluntaryCw: { start: 14.0, end: 14.07 },
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
        {
            name: '10 meters', label: '28 MHz', start: 28.0, end: 29.7,
            ticks: [28.0, 28.3, 28.5, 29.0, 29.7],
            rows: [
                { license: 'Extra', segments: [{ start: 28.0, end: 28.3, mode: 'data' }, { start: 28.3, end: 29.7, mode: 'phone' }] },
                { license: 'Advanced', segments: [{ start: 28.0, end: 28.3, mode: 'data' }, { start: 28.3, end: 29.7, mode: 'phone' }] },
                { license: 'General', segments: [{ start: 28.0, end: 28.3, mode: 'data' }, { start: 28.3, end: 29.7, mode: 'phone' }] },
                { license: 'Novice / Technician', power: '200 W PEP', segments: [{ start: 28.0, end: 28.3, mode: 'cw' }, { start: 28.3, end: 28.5, mode: 'phone' }] },
            ],
        },
    ];

    readonly vhfBands: HamBand[] = [
        {
            name: '2 meters', label: '144 MHz', start: 144, end: 148,
            ticks: [144, 144.1, 146, 148],
            rows: [
                { license: 'Technician', segments: [{ start: 144, end: 144.1, mode: 'cw' }, { start: 144.1, end: 148, mode: 'mixed' }] },
            ],
        },
        {
            name: '70cm', label: '420 MHz', start: 420, end: 450,
            ticks: [420, 430, 440, 450],
            rows: [
                { license: 'Technician', segments: [{ start: 420, end: 450, mode: 'mixed' }] },
            ],
        },
    ];

    readonly bandSections = [
        { title: 'HF', bands: this.bands },
        { title: 'VHF / UHF', bands: this.vhfBands },
    ];

    flatSegments(band: HamBand): FlatBandSegment[] {
        const boundaries = [...new Set([
            band.start,
            band.end,
            ...(band.voluntaryCw ? [band.voluntaryCw.start, band.voluntaryCw.end] : []),
            ...band.rows.flatMap(row => row.segments.flatMap(segment => [segment.start, segment.end])),
        ])].sort((a, b) => a - b);
        const rank = ['Technician', 'Novice / Technician', 'General', 'Advanced', 'Extra'];
        const result: FlatBandSegment[] = [];

        for (let index = 0; index < boundaries.length - 1; index++) {
            const start = boundaries[index];
            const end = boundaries[index + 1];
            const midpoint = (start + end) / 2;
            const available = band.rows
                .map(row => ({ row, segment: row.segments.find(segment => segment.start <= midpoint && segment.end >= midpoint) }))
                .filter(entry => entry.segment);
            const technicianCw = available.find(entry => entry.row.license.includes('Technician') && entry.segment?.mode === 'cw');
            const selected = technicianCw ?? rank
                .map(license => available.find(entry => entry.row.license === license))
                .find(entry => entry);

            if (!selected?.segment) continue;
            const license = selected.segment.mode === 'cw' ? '' : selected.row.license.includes('Technician') ? 'T' : selected.row.license.charAt(0);
            const voluntaryCw = Boolean(band.voluntaryCw && midpoint >= band.voluntaryCw.start && midpoint < band.voluntaryCw.end);
            const previous = result.at(-1);
            if (previous && previous.end === start && previous.mode === selected.segment.mode && previous.license === license && previous.voluntaryCw === voluntaryCw) {
                previous.end = end;
            } else {
                result.push({ start, end, mode: selected.segment.mode, license, voluntaryCw });
            }
        }

        return result;
    }

    position(value: number, band: HamBand): number {
        return ((value - band.start) / (band.end - band.start)) * 100;
    }

    width(segment: BandSegment, band: HamBand): number {
        return ((segment.end - segment.start) / (band.end - band.start)) * 100;
    }

    modeLabel(mode: Mode): string {
        return mode === 'data' ? 'RTTY and data' : mode === 'phone' ? 'Phone and image' : mode === 'mixed' ? 'All authorized modes' : 'CW only';
    }

    bandLabel(name: string): string {
        return name.replace(' meters', 'm');
    }
}
