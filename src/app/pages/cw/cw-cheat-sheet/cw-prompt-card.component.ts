import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { PROMPT_FIELDS, PromptCardState, PromptStage, PromptTopic, renderPrompt } from './prompt-card';

@Component({
    selector: 'cw-prompt-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cw-prompt-card.component.html',
})
export class CwPromptCardComponent implements OnInit {
    @Input() details: Record<string, string> = {};
    @Output() fieldChange = new EventEmitter<{ field: string; value: string }>();
    readonly state = new PromptCardState();
    readonly fields = PROMPT_FIELDS;
    readonly topicStages: { id: PromptStage; label: string }[] = [{ id: 'additional', label: '02 · After opening' }, { id: 'ragchew', label: '03 · Ragchew' }];
    readonly help = ['PSE QRS', 'NAME AGN PSE', 'QTH AGN PSE', 'RST AGN PSE', 'NR AGN PSE', 'SRI QRM PSE RPT'];
    readonly wordingFields = [
        { key: 'cq' as const, label: 'Call CQ' }, { key: 'answer' as const, label: 'Answer CQ' },
        { key: 'exchange' as const, label: 'Your first exchange' },
        { key: 'acknowledge' as const, label: 'Acknowledge their exchange' }, { key: 'ragchewStart' as const, label: 'Ragchew starter' },
        { key: 'handBack' as const, label: 'Hand back with callsigns' }, { key: 'copyCheck' as const, label: 'Check their copy' },
        { key: 'close' as const, label: 'You finish the QSO' }, { key: 'replyClose' as const, label: 'Reply to their closing' },
    ];
    customizing = false;
    expandedTopicId = '';
    private readonly storageKey = 'cw-personal-prompt-card-v1';

    constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        try { this.state.restore(JSON.parse(localStorage.getItem(this.storageKey) ?? '{}')); }
        catch { /* Keep default prompts when storage is unavailable or invalid. */ }
    }

    render(text: string): string { return renderPrompt(text, this.details); }

    jumpTo(id: string, event: Event): void {
        event.preventDefault();
        if (!isPlatformBrowser(this.platformId)) return;
        const section = document.getElementById(id);
        section?.focus({ preventScroll: true });
        section?.scrollIntoView({ block: 'start' });
    }

    get exchange(): string {
        return [this.render(this.state.exchange),
            this.state.showSkcc ? this.render('SKCC NR {skccNumber}') : '',
            this.state.showLicw ? this.render('LICW NR {licwNumber}') : '',
        ].filter(Boolean).join('\n');
    }

    get activeFields(): { key: string; label: string }[] {
        const phrases = [this.state.cq, this.state.answer, this.state.exchange, this.state.acknowledge, this.state.ragchewStart, this.state.handBack, this.state.copyCheck, this.state.close, this.state.replyClose,
            ...this.state.selected.flatMap(topic => [topic.share, topic.ask])].join(' ');
        return this.fields.filter(field => new RegExp('\\{' + field.key + '\\}', 'i').test(phrases)
            || (field.key === 'skccNumber' && this.state.showSkcc) || (field.key === 'licwNumber' && this.state.showLicw));
    }

    setField(field: string, value: string): void { this.fieldChange.emit({ field, value }); }
    setWording(key: 'cq' | 'answer' | 'exchange' | 'acknowledge' | 'ragchewStart' | 'handBack' | 'copyCheck' | 'close' | 'replyClose', value: string): void { this.state[key] = value; this.persist(); }
    setClub(key: 'showSkcc' | 'showLicw', value: boolean): void { this.state[key] = value; this.persist(); }
    editTopic(topic: PromptTopic, field: 'title' | 'share' | 'ask', value: string): void { topic[field] = value; this.persist(); }
    setStage(topic: PromptTopic, value: string): void {
        if (value !== 'additional' && value !== 'ragchew') return;
        topic.stage = value; this.expandedTopicId = topic.id; this.persist();
    }
    toggle(topic: PromptTopic, enabled: boolean): void { topic.enabled = enabled; this.persist(); }
    move(id: string, direction: number): void { this.state.move(id, direction); this.persist(); }
    addCustom(): void { this.state.addCustom(); this.expandedTopicId = this.state.topics[this.state.topics.length - 1].id; this.persist(); }

    updateNotes(textarea: HTMLTextAreaElement): void {
        const value = textarea.value.toUpperCase();
        const start = textarea.value.slice(0, textarea.selectionStart).toUpperCase().length;
        const end = textarea.value.slice(0, textarea.selectionEnd).toUpperCase().length;
        this.setField('notes', value);
        if (textarea.value !== value) {
            textarea.value = value;
            textarea.setSelectionRange(start, end);
        }
    }

    private persist(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); }
        catch { /* The card remains usable without browser storage. */ }
    }
}
