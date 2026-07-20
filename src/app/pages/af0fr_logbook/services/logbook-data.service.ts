import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    DxSummitApiSpot,
    PotaPark,
    PotaSpot,
    SstCallHistoryResult,
    ZipPlaceResponse,
} from '../models/logbook.model';

@Injectable()
export class LogbookDataService {
    private readonly http = inject(HttpClient);
    private readonly potaSpotsUrl = 'https://api.pota.app/spot/activator';
    private readonly zipUrl = 'https://api.zippopotam.us/us/';
    private readonly potaParksUrl = 'https://api.pota.app/program/parks/';

    getZipLocation(zip: string): Promise<ZipPlaceResponse> {
        return firstValueFrom(
            this.http.get<ZipPlaceResponse>(`${this.zipUrl}${encodeURIComponent(zip.trim())}`)
        );
    }

    getPotaSpots(): Promise<PotaSpot[]> {
        return firstValueFrom(this.http.get<PotaSpot[]>(this.potaSpotsUrl));
    }

    async getPotaParks(prefix: string): Promise<Map<string, PotaPark>> {
        const parks = await firstValueFrom(
            this.http.get<PotaPark[]>(`${this.potaParksUrl}${encodeURIComponent(prefix)}`)
        );

        return new Map(
            parks
                .filter((park): park is PotaPark & { reference: string } => !!park.reference)
                .map((park) => [park.reference, park])
        );
    }

    getDxSummitSpots(requestedLimit: number): Promise<DxSummitApiSpot[]> {
        const limit = Math.max(1, Math.min(Number(requestedLimit) || 50, 200));
        const backendUrl = `${environment.apiUrl}/dx-summit/spots?limit=${encodeURIComponent(String(limit))}`;
        return firstValueFrom(this.http.get<DxSummitApiSpot[]>(backendUrl));
    }

    getSstCallHistory(callsign: string): Promise<SstCallHistoryResult> {
        return firstValueFrom(this.http.get<SstCallHistoryResult>(
            `${environment.apiUrl}/sst/call-history/${encodeURIComponent(callsign.trim().toUpperCase())}`
        ));
    }
}
