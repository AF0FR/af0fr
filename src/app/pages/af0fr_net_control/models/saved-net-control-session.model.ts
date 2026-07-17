import { LogEntry } from './log-entry.model';
import { Station } from './station.model';

export interface SavedNetControlSession {
    id: string;
    name: string;
    savedAt: string;
    openingScript: string;
    trafficPrompt: string;
    lateCheckinPrompt: string;
    closingScript: string;
    stations: Station[];
    queue: Station[];
    logEntries: LogEntry[];
}

export interface NetControlSharedPayload
    extends Omit<SavedNetControlSession, 'id' | 'name' | 'savedAt'> {
    savedSessions?: SavedNetControlSession[];
}

export interface NetControlStateResponse {
    payload: NetControlSharedPayload;
    updatedAt: string;
}
