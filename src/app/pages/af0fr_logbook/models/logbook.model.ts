export type LogbookView = 'qsoEntry' | 'sessionLog' | 'spots' | 'dxSummit';
export type ContestMode = 'GENERAL' | 'SST';
export type OpsLogCategory = 'standard' | 'sst' | 'pota' | 'fieldDay';

export interface LogbookEntry {
    id: string;
    contest: ContestMode;
    callsign: string;
    qsoDate: string;
    timeOn: string;
    band: string;
    frequency: string;
    mode: string;
    rstSent: string;
    rstReceived: string;
    name: string;
    qth: string;
    state: string;
    country: string;
    parkReference: string;
    notes: string;
}

export interface SstMultiplierMark {
    key: string;
    label: string;
    column: 'S/P' | 'DXc';
}

export interface SstEntryRow {
    entry: LogbookEntry;
    multipliers: SstMultiplierMark[];
    spMultiplier: SstMultiplierMark | null;
    dxcMultiplier: SstMultiplierMark | null;
}

export interface NamedLogbook {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    entries: LogbookEntry[];
    category: OpsLogCategory;
}

export interface PotaSpotRow {
    miles: number;
    activator: string;
    reference: string;
    park: string;
    location: string;
    frequency: string;
    band: string;
    mode: string;
    comments: string;
}

export interface PotaSkipCounts {
    inactive: number;
    program: number;
    mode: number;
    band: number;
    noCoordinates: number;
    duplicates: number;
}

export interface DxSpotRow {
    time: string;
    spotter: string;
    frequency: string;
    callsign: string;
    comment: string;
    band: string;
    mode: string;
    country: string;
    miles: number | null;
}

export interface ZipPlaceResponse {
    places: Array<{ latitude: string; longitude: string }>;
}

export interface PotaSpot {
    activator?: string;
    reference?: string;
    frequency?: number | string;
    mode?: string;
    comments?: string;
    comment?: string;
    spotterComments?: string;
    locationDesc?: string;
    name?: string;
}

export interface PotaPark {
    reference?: string;
    name?: string;
    latitude?: number | string;
    longitude?: number | string;
    locationDesc?: string;
}

export interface DxSummitApiSpot {
    de_call?: string;
    dx_call?: string;
    frequency?: number | string;
    time?: string;
    info?: string | null;
    dx_country?: string | null;
    dx_latitude?: number | string | null;
    dx_longitude?: number | string | null;
}

export interface SstCallHistoryResult {
    callsign: string;
    found: boolean;
    name?: string;
    spc?: string;
    notes?: string;
    source?: string;
}
