import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, interval, Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface GatewayCheckin {
    id: string;
    callsign: string;
    preferredSpeed: number | null;
    checkinType: 'direct' | 'relay' | 'online';
    relayedBy: string;
    enteredBy: string;
    createdAt: string;
    qsoStatus: 'open' | 'pending' | 'closed';
    closedBy: string;
    closedAt: string | null;
}

interface GatewayChat {
    id: string;
    callsign: string;
    message: string;
    createdAt: string;
}

interface GatewayBand {
    id: string;
    band: string;
    position: number;
    status: 'upcoming' | 'live_soon' | 'live' | 'closed';
    frequency: string;
    question: string;
    ncsCallsign: string;
    ncsQth: string;
    reportedBy: string;
    startedAt: string | null;
    endedAt: string | null;
    updatedAt: string;
    checkins: GatewayCheckin[];
    chat: GatewayChat[];
}

interface GatewaySession {
    id: string;
    status: 'live' | 'closed';
    scheduled: boolean;
    startedBy: string;
    announcement: string;
    startedAt: string;
    endedAt: string | null;
    updatedAt: string;
    bands: GatewayBand[];
}

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gateway-cw.page.html',
})
export class GatewayCwPage implements OnInit, OnDestroy {
    private readonly chatCallsignKey = 'gateway-cw-chat-callsign';
    session: GatewaySession | null = null;
    history: GatewaySession[] = [];
    loading = true;
    saving = false;
    error = '';
    showStart = false;
    confirmingClose = false;
    closeCallsign = '';
    revealedQuestions = new Set<string>();
    private poll?: Subscription;

    readonly thirdBandOptions = ['20m', '15m', '10m'];
    startForm = { callsign: '', qth: '', question: '', announcement: '', scheduled: false };
    startBands = [{ band: '80m', frequency: '' }, { band: '40m', frequency: '' }, { band: '20m', frequency: '' }];
    bandForms: Record<string, { callsign: string; frequency: string; question: string; ncsCallsign: string; ncsQth: string; announcement: string }> = {};
    checkinForms: Record<string, { callsign: string; preferredSpeed: number | null; checkinType: string }> = {};
    chatForms: Record<string, { callsign: string; message: string }> = {};
    private chatCallsign = '';

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this.chatCallsign = this.normalizeCallsign(localStorage.getItem(this.chatCallsignKey) ?? '');
        this.load(true);
        this.poll = interval(5_000).subscribe(() => {
            if (!document.hidden && !this.saving) this.load(false);
        });
    }

    ngOnDestroy(): void { this.poll?.unsubscribe(); }

    get liveBand(): GatewayBand | undefined { return this.session?.bands.find((band) => band.status === 'live'); }
    get soonBand(): GatewayBand | undefined { return this.session?.bands.find((band) => band.status === 'live_soon'); }
    get displayBand(): GatewayBand | undefined { return this.liveBand ?? this.soonBand; }
    get nextBand(): GatewayBand | undefined { return this.session?.bands.find((band) => band.status === 'upcoming'); }

    get nextScheduledNet(): string {
        const now = new Date();
        const firstNet = new Date('2026-09-04T01:00:00Z'); // September 3 at 8 PM CDT

        if (now < firstNet) {
            return 'Thursday, September 3 at 8:00 PM Central';
        }

        const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', weekday: 'short', hour: '2-digit', hour12: false });
        const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
        const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts['weekday']);
        let days = (4 - dayIndex + 7) % 7;
        if (days === 0 && Number(parts['hour']) >= 20) days = 7;
        const target = new Date(now.getTime() + days * 86_400_000);
        return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric' }).format(target) + ' at 8:00 PM Central';
    }

    load(initial = false): void {
        if (initial) this.loading = true;
        this.http.get<{ session: GatewaySession | null }>(`${environment.apiUrl}/gateway-cw/live`).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: ({ session }) => { this.session = session; this.prepareForms(); this.error = ''; },
            error: () => this.error = 'The live net service could not be reached.',
        });
        if (initial) {
            this.http.get<{ sessions: GatewaySession[] }>(`${environment.apiUrl}/gateway-cw/history`).subscribe({
                next: ({ sessions }) => this.history = sessions,
            });
        }
    }

    startNet(): void {
        if (!this.startForm.callsign.trim() || !this.startBands.length) return;
        this.startForm.callsign = this.normalizeCallsign(this.startForm.callsign);
        const payload = { ...this.startForm, bands: this.startBands.map((band) => ({ ...band })) };
        this.mutate(this.http.post<GatewaySession>(`${environment.apiUrl}/gateway-cw/sessions`, payload), () => {
            this.showStart = false;
            this.startForm = { callsign: '', qth: '', question: '', announcement: '', scheduled: false };
            this.startBands = [{ band: '80m', frequency: '' }, { band: '40m', frequency: '' }, { band: '20m', frequency: '' }];
        });
    }

    updateBand(band: GatewayBand): void {
        const form = this.bandForms[band.id];
        form.callsign = this.normalizeCallsign(form.callsign || band.ncsCallsign || this.session?.startedBy || this.chatCallsign);
        form.ncsCallsign = this.normalizeCallsign(form.ncsCallsign);
        if (!form.callsign) return;
        this.mutate(this.http.patch<GatewaySession>(`${environment.apiUrl}/gateway-cw/bands/${band.id}`, form));
    }

    activateBand(band: GatewayBand): void {
        const form = this.bandForms[band.id];
        form.callsign = this.normalizeCallsign(form.callsign || band.ncsCallsign || this.session?.startedBy || this.chatCallsign);
        if (!form.callsign) return;
        form.ncsCallsign = this.normalizeCallsign(form.ncsCallsign);
        this.mutate(this.http.post<GatewaySession>(`${environment.apiUrl}/gateway-cw/bands/${band.id}/activate`, form));
    }

    markLiveSoon(band: GatewayBand): void {
        this.mutate(this.http.post<GatewaySession>(`${environment.apiUrl}/gateway-cw/bands/${band.id}/live-soon`, {}));
    }

    addCheckin(band: GatewayBand): void {
        const form = this.checkinForms[band.id];
        if (!form.callsign.trim()) return;
        form.callsign = this.normalizeCallsign(form.callsign);
        const payload = { ...form, enteredBy: form.callsign, relayedBy: '' };
        this.mutate(this.http.post<GatewaySession>(`${environment.apiUrl}/gateway-cw/bands/${band.id}/checkins`, payload), () => {
            this.checkinForms[band.id] = { callsign: '', preferredSpeed: null, checkinType: 'direct' };
        });
    }

    addChat(band: GatewayBand): void {
        const form = this.chatForms[band.id];
        if (!form.callsign.trim() || !form.message.trim()) return;
        form.callsign = this.normalizeCallsign(form.callsign);
        this.rememberChatCallsign(form.callsign);
        this.mutate(this.http.post<GatewaySession>(`${environment.apiUrl}/gateway-cw/bands/${band.id}/chat`, form), () => form.message = '');
    }

    closeQso(checkin: GatewayCheckin, band: GatewayBand): void {
        const callsign = this.normalizeCallsign(band.ncsCallsign || this.session?.startedBy || this.chatCallsign || checkin.callsign);
        this.mutate(this.http.post<GatewaySession>(`${environment.apiUrl}/gateway-cw/checkins/${checkin.id}/close`, { callsign }));
    }

    rememberChatCallsign(value: string): void {
        this.chatCallsign = this.normalizeCallsign(value);
        localStorage.setItem(this.chatCallsignKey, this.chatCallsign);

        for (const form of Object.values(this.chatForms)) {
            form.callsign = this.chatCallsign;
        }
    }

    closeNet(): void {
        const actor = this.normalizeCallsign(this.closeCallsign);
        if (!actor || !this.session) return;
        this.mutate(this.http.post<GatewaySession>(`${environment.apiUrl}/gateway-cw/sessions/${this.session.id}/close`, { callsign: actor }), () => {
            this.confirmingClose = false;
            this.closeCallsign = '';
            this.session = null;
            this.load(true);
        });
    }

    revealQuestion(id: string): void { this.revealedQuestions.add(id); }

    formatTime(value: string | null): string {
        if (!value) return '—';
        return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
    }

    formatDate(value: string): string {
        return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
    }

    uniqueCount(session: GatewaySession): number {
        return new Set(session.bands.flatMap((band) => band.checkins.map((checkin) => checkin.callsign))).size;
    }

    trackBand(_index: number, band: GatewayBand): string { return band.id; }
    trackCheckin(_index: number, checkin: GatewayCheckin): string { return checkin.id; }
    trackChat(_index: number, message: GatewayChat): string { return message.id; }
    trackSession(_index: number, session: GatewaySession): string { return session.id; }

    private prepareForms(): void {
        for (const band of this.session?.bands ?? []) {
            this.bandForms[band.id] ??= { callsign: '', frequency: band.frequency, question: band.question, ncsCallsign: band.ncsCallsign, ncsQth: band.ncsQth, announcement: this.session?.announcement ?? '' };
            this.checkinForms[band.id] ??= { callsign: '', preferredSpeed: null, checkinType: 'direct' };
            this.chatForms[band.id] ??= { callsign: this.chatCallsign, message: '' };
        }
    }

    private normalizeCallsign(value: string): string {
        return value.trim().toUpperCase().replace(/Ø/g, '0');
    }

    private mutate(request: Observable<GatewaySession>, after?: () => void): void {
        this.saving = true;
        this.error = '';
        request.pipe(finalize(() => this.saving = false)).subscribe({
            next: (session) => { this.session = session; this.prepareForms(); after?.(); },
            error: (response) => this.error = this.apiErrorMessage(response),
        });
    }

    private apiErrorMessage(response: { error?: { detail?: unknown } }): string {
        const detail = response.error?.detail;

        if (typeof detail === 'string') return detail;

        if (Array.isArray(detail)) {
            const messages = detail
                .map((item) => {
                    if (!item || typeof item !== 'object') return '';
                    const error = item as { loc?: unknown[]; msg?: string };
                    const field = error.loc?.at(-1);
                    return `${field ? `${field}: ` : ''}${error.msg ?? ''}`;
                })
                .filter(Boolean);

            if (messages.length) return messages.join(' · ');
        }

        return 'That update could not be saved.';
    }
}
