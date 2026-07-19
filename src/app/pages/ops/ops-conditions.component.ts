import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
    selector: 'ops-conditions',
    standalone: true,
    imports: [NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './ops-conditions.component.html',
})
export class OpsConditionsComponent implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly cdr = inject(ChangeDetectorRef);
    loading = false;
    error = '';
    kp = '—';
    solarFlux = '—';
    temperature = '—';
    wind = '—';
    sunrise = '—';
    sunset = '—';
    updated = '';

    ngOnInit(): void { void this.refresh(); }

    get recommendation(): string {
        const kp = Number(this.kp);
        const flux = Number(this.solarFlux);
        if (kp >= 5) return 'Disturbed: favor lower bands and regional paths.';
        if (flux >= 150) return 'Strong high-band potential; try 10–20m.';
        if (flux >= 100) return 'Moderate conditions; try 15–40m.';
        return 'Favor 20–80m; check spots before changing bands.';
    }

    async refresh(): Promise<void> {
        this.loading = true;
        this.error = '';
        try {
            const [kpRows, fluxRows, weather] = await Promise.all([
                firstValueFrom(this.http.get<string[][]>('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')),
                firstValueFrom(this.http.get<Array<Record<string, unknown>>>('https://services.swpc.noaa.gov/json/f107_cm_flux.json')),
                firstValueFrom(this.http.get<any>('https://api.open-meteo.com/v1/forecast?latitude=38.47&longitude=-90.30&current=temperature_2m,wind_speed_10m&daily=sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC')),
            ]);
            this.kp = kpRows.at(-1)?.[1] ?? '—';
            this.solarFlux = String(fluxRows.at(-1)?.['flux'] ?? '—');
            this.temperature = weather.current?.temperature_2m != null ? `${Math.round(weather.current.temperature_2m)}°F` : '—';
            this.wind = weather.current?.wind_speed_10m != null ? `${Math.round(weather.current.wind_speed_10m)} mph` : '—';
            this.sunrise = String(weather.daily?.sunrise?.[0] ?? '').slice(11) || '—';
            this.sunset = String(weather.daily?.sunset?.[0] ?? '').slice(11) || '—';
            this.updated = new Date().toISOString().slice(11, 16) + 'Z';
        } catch (error) {
            console.error(error);
            this.error = 'Conditions unavailable; logging remains online.';
        } finally {
            this.loading = false;
            this.cdr.markForCheck();
        }
    }
}
