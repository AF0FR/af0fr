import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    DxSummitApiSpot,
    PotaPark,
    PotaSpot,
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

    async getDxSummitSpots(directUrl: string, requestedLimit: number): Promise<DxSummitApiSpot[]> {
        const limit = Math.max(1, Math.min(Number(requestedLimit) || 50, 200));
        const backendUrl = `${environment.apiUrl}/dx-summit/spots?limit=${encodeURIComponent(String(limit))}`;

        try {
            return await firstValueFrom(this.http.get<DxSummitApiSpot[]>(backendUrl));
        } catch (backendError) {
            console.warn('DX Summit backend proxy failed, trying direct API', backendError);
            const url = `${directUrl}?limit=${encodeURIComponent(String(limit))}&limit_time=true&refresh=${Date.now()}`;
            return firstValueFrom(this.http.get<DxSummitApiSpot[]>(url));
        }
    }
}
