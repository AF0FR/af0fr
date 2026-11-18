export type PromptStage = 'additional' | 'ragchew';

export interface PromptTopic {
    id: string;
    title: string;
    share: string;
    ask: string;
    enabled: boolean;
    stage: PromptStage;
}

export const PROMPT_FIELDS: { key: string; label: string }[] = [
    { key: 'ownCall', label: 'Your call' }, { key: 'ownName', label: 'Your name / OP' },
    { key: 'qth', label: 'Your QTH' }, { key: 'greeting', label: 'Greeting' },
    { key: 'skccNumber', label: 'Your SKCC number' }, { key: 'licwNumber', label: 'Your LICW number' },
    { key: 'rig', label: 'Your rig' }, { key: 'antenna', label: 'Your antenna' },
    { key: 'power', label: 'Power (W)' }, { key: 'key', label: 'Your key / paddle' },
    { key: 'weather', label: 'Your weather' }, { key: 'recentProject', label: 'Your project' },
    { key: 'yearsCw', label: 'Years on CW' }, { key: 'hobby', label: 'Your hobby' },
    { key: 'operatingSchedule', label: 'When you operate' },
];

const PLACEHOLDERS: Record<string, string> = {
    ownCall: 'YOUR CALL', otherCall: 'THEIR CALL', ownName: 'YOUR NAME', otherName: 'THEIR NAME',
    qth: 'QTH', rst: 'RST', skccNumber: 'SKCC NR', licwNumber: 'LICW NR',
    recentProject: 'PROJECT', yearsCw: 'YEARS', operatingSchedule: 'TIME / BAND',
};

export function renderPrompt(text: string, details: Record<string, string>): string {
    return text.replace(/\{(\w+)\}/g, (_, key: string) => {
        const field = Object.keys(details).find(field => field.toLowerCase() === key.toLowerCase())
            ?? Object.keys(PLACEHOLDERS).find(field => field.toLowerCase() === key.toLowerCase()) ?? key;
        return details[field]?.trim() || `<${PLACEHOLDERS[field] ?? field}>`;
    }).toUpperCase();
}

export class PromptCardState {
    cq = 'CQ CQ DE {ownCall} {ownCall} K';
    answer = '{otherCall} DE {ownCall} AR';
    exchange = '{greeting}\nUR RST {rst} BT QTH {qth} BT OP {ownName}';
    acknowledge = 'R TNX FER RPRT';
    ragchewStart = 'WHAT GOT U INTO HAM RADIO? BK';
    handBack = '{otherCall} DE {ownCall} KN';
    copyCheck = 'HW CPY? BK';
    close = 'TNX FER QSO BT 73 ES HPE CU AGN\n{otherCall} DE {ownCall} SK';
    replyClose = 'TU 73\n{otherCall} DE {ownCall} SK';
    showSkcc = true;
    showLicw = false;
    topics: PromptTopic[] = [
        { id: 'station', stage: 'additional', title: 'Station', share: 'RIG HR {rig} BT ANT {antenna}', ask: 'HW UR RIG? BK', enabled: true },
        { id: 'weather', stage: 'additional', title: 'Weather', share: 'WX HR {weather}', ask: 'HW WX UR QTH? BK', enabled: true },
        { id: 'key', stage: 'ragchew', title: 'Key / paddle', share: 'KEY HR {key}', ask: 'WHAT KEY U USING? BK', enabled: false },
        { id: 'projects', stage: 'ragchew', title: 'Projects', share: 'NW WRKING ON {recentProject}', ask: 'BUILT ANYTHING LATELY? BK', enabled: false },
        { id: 'cw', stage: 'ragchew', title: 'CW', share: 'CW FER {yearsCw} YRS', ask: 'WHAT GOT U INTO CW? BK', enabled: false },
        { id: 'hobbies', stage: 'ragchew', title: 'Hobbies', share: 'OTHER HOBBY IS {hobby}', ask: 'ANY OTHER HOBBIES? BK', enabled: false },
        { id: 'portable', stage: 'ragchew', title: 'Portable', share: 'I LIKE PORTABLE CW', ask: 'U WORK PORTABLE? BK', enabled: false },
        { id: 'next', stage: 'ragchew', title: 'Next time', share: 'QRV {operatingSchedule}', ask: 'WHEN U QRV? BK', enabled: false },
    ];

    get selected(): PromptTopic[] { return this.topics.filter(topic => topic.enabled); }
    get available(): PromptTopic[] { return this.topics.filter(topic => !topic.enabled); }

    selectedFor(stage: PromptStage): PromptTopic[] { return this.selected.filter(topic => topic.stage === stage); }

    move(id: string, offset: number): void {
        const source = this.topics.find(topic => topic.id === id);
        if (!source) return;
        const visible = this.selectedFor(source.stage);
        const index = visible.findIndex(topic => topic.id === id);
        const destination = visible[index + offset];
        if (index < 0 || !destination) return;
        const sourceIndex = this.topics.findIndex(topic => topic.id === id);
        const targetIndex = this.topics.indexOf(destination);
        [this.topics[sourceIndex], this.topics[targetIndex]] = [this.topics[targetIndex], this.topics[sourceIndex]];
    }

    addCustom(): void {
        let index = 1;
        while (this.topics.some(topic => topic.id === `custom-${index}`)) index++;
        this.topics.push({ id: `custom-${index}`, title: 'My topic', share: '', ask: '', enabled: true, stage: 'ragchew' });
    }

    restore(value: unknown): void {
        if (!value || typeof value !== 'object') return;
        const saved = value as Record<string, unknown>;
        for (const key of ['cq', 'answer', 'exchange', 'acknowledge', 'ragchewStart', 'handBack', 'copyCheck', 'close', 'replyClose'] as const) {
            if (typeof saved[key] === 'string') this[key] = saved[key];
        }
        for (const key of ['showSkcc', 'showLicw'] as const) {
            if (typeof saved[key] === 'boolean') this[key] = saved[key];
        }
        if (!Array.isArray(saved['topics'])) return;
        const ids = new Set<string>();
        const topics = saved['topics'].filter((topic: unknown): topic is PromptTopic => {
            if (!topic || typeof topic !== 'object') return false;
            const item = topic as PromptTopic;
            if (typeof item.id !== 'string' || !item.id || ids.has(item.id)
                || typeof item.title !== 'string' || typeof item.share !== 'string'
                || typeof item.ask !== 'string' || typeof item.enabled !== 'boolean') return false;
            ids.add(item.id);
            return true;
        });
        if (topics.length) this.topics = topics.map(topic => ({ ...topic,
            stage: topic.stage === 'additional' || topic.stage === 'ragchew' ? topic.stage
                : ['station', 'weather'].includes(topic.id) ? 'additional' : 'ragchew',
        }));
    }
}
