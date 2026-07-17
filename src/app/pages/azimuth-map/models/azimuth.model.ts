export interface AzimuthLine {
    id: string;
    label: string;
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
    bearingDeg: number;
    distanceMiles: number;
    createdBy?: string | null;
    reportId?: string | null;
    reportIds?: string[];
    sourcePointId?: string | null;
    createdAt?: string;
}

export interface ReportPoint {
    id: string;
    label: string;
    lat: number;
    lng: number;
    createdBy?: string | null;
    reportId?: string | null;
    reportIds?: string[];
    createdAt?: string;
}

export type MapMarker =
    | { kind: 'point'; point: ReportPoint }
    | { kind: 'azimuth'; line: AzimuthLine };

export interface CallsignGroup {
    callsign: string;
    color: string;
    markers: MapMarker[];
    points: ReportPoint[];
    lines: AzimuthLine[];
}

export interface SightingReport {
    id: string;
    callsign: string;
    reportDate: string;
    reportTime: string;
    sourceLabel: string;
    frequencyMhz: string;
    notes?: string | null;
    createdAt?: string;
}

export interface RepeaterOption {
    value: string;
    label: string;
    sourceLabel: string;
    frequencyMhz: string;
}

export type AzimuthView = 'reports' | 'map';
