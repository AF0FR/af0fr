const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/pages/cw/cw-cheat-sheet', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
}).outputText;
const model = {};
vm.runInNewContext(compile('prompt-card.ts'), { exports: model });
const { PromptCardState, renderPrompt } = model;
const details = { ownCall: 'AF0FR', otherCall: 'W1AW', ownName: 'TAYLOR', qth: 'MO', rst: '559', greeting: 'GM', skccNumber: '31263' };

test('the default card pairs two topics and uses explicit CW labels', () => {
    const card = new PromptCardState();
    assert.deepEqual(Array.from(card.selected, topic => topic.id), ['station', 'weather']);
    assert.ok(card.selected.every(topic => topic.share && topic.ask));
    assert.match(renderPrompt(card.exchange, details), /UR RST 559 BT QTH MO BT OP TAYLOR/);
    assert.match(renderPrompt(card.close, details), /W1AW DE AF0FR SK$/);
});

test('reordering chosen topics skips hidden topics and preserves their wording', () => {
    const card = new PromptCardState();
    card.topics.find(topic => topic.id === 'projects').enabled = true;
    card.topics.find(topic => topic.id === 'projects').stage = 'additional';
    card.move('projects', -1);
    assert.deepEqual(Array.from(card.selected, topic => topic.id), ['station', 'projects', 'weather']);
    card.move('station', -1);
    assert.equal(card.selected[0].id, 'station');
    assert.equal(card.topics.find(topic => topic.id === 'key').share, 'KEY HR {key}');
});

test('customization survives reload, including hidden and custom phrases', () => {
    const card = new PromptCardState();
    card.topics[0].share = 'RIG HR KX3';
    card.topics[0].enabled = false;
    card.addCustom();
    card.topics.at(-1).title = 'Building';
    card.topics.at(-1).share = 'JUST BUILT A KEY';
    card.showLicw = true;
    const restored = new PromptCardState();
    restored.restore(JSON.parse(JSON.stringify(card)));
    assert.equal(restored.topics[0].share, 'RIG HR KX3');
    assert.equal(restored.topics[0].enabled, false);
    assert.equal(restored.selected.at(-1).share, 'JUST BUILT A KEY');
    assert.equal(restored.showLicw, true);
    restored.addCustom();
    assert.notEqual(restored.topics.at(-1).id, restored.topics.at(-2).id);
});

test('invalid storage cannot introduce duplicate topics or break the card', () => {
    const card = new PromptCardState();
    card.restore(null);
    card.restore({ topics: [null, { id: 'broken' }] });
    assert.equal(card.selected.length, 2);
    const topic = { ...card.topics[0] };
    card.restore({ topics: [topic, topic] });
    assert.equal(card.topics.length, 1);
});

test('live values replace tokens without inventing missing data', () => {
    assert.equal(renderPrompt('OP {OWNNAME} BT RIG {rig}', details), 'OP TAYLOR BT RIG <RIG>');
    assert.equal(renderPrompt('my own phrase', {}), 'MY OWN PHRASE');
    assert.equal(renderPrompt('{ownCall}', { ownCall: '   ' }), '<YOUR CALL>');
});

function component(storage = new Map()) {
    const exports = {};
    const decorator = () => () => {};
    vm.runInNewContext(compile('cw-prompt-card.component.ts'), {
        exports,
        require: name => name === './prompt-card' ? model : name === '@angular/common' ? { isPlatformBrowser: () => true } : {
            Component: decorator, Input: decorator, Output: decorator, Inject: decorator,
            ChangeDetectionStrategy: {}, EventEmitter: class { emit(value) { this.last = value; } },
        },
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    });
    const card = new exports.CwPromptCardComponent('browser');
    card.details = details;
    card.ngOnInit();
    return card;
}

test('setup fields follow chosen phrases and club numbers', () => {
    const card = component();
    assert.ok(card.activeFields.some(field => field.key === 'rig'));
    assert.ok(!card.activeFields.some(field => field.key === 'recentProject'));
    card.toggle(card.state.topics.find(topic => topic.id === 'projects'), true);
    assert.ok(card.activeFields.some(field => field.key === 'recentProject'));
    card.setClub('showSkcc', false);
    assert.ok(!card.activeFields.some(field => field.key === 'skccNumber'));
    assert.doesNotMatch(card.exchange, /SKCC/);
});

test('saved customization opens directly into the on-air card', () => {
    const storage = new Map();
    const first = component(storage);
    first.customizing = true;
    first.setWording('close', 'TU 73 {ownCall} SK');
    first.addCustom();
    first.editTopic(first.state.topics.at(-1), 'title', 'My antenna');
    assert.equal(first.expandedTopicId, first.state.topics.at(-1).id);
    const restored = component(storage);
    assert.equal(restored.customizing, false);
    assert.equal(restored.state.close, 'TU 73 {ownCall} SK');
    assert.equal(restored.state.topics.at(-1).title, 'My antenna');
});

test('notes preserve the cursor and do not change the outgoing report', () => {
    const card = component();
    const textarea = { value: 'their rst 579', selectionStart: 5, selectionEnd: 5,
        setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; } };
    card.updateNotes(textarea);
    assert.equal(card.fieldChange.last.field, 'notes');
    assert.equal(card.fieldChange.last.value, 'THEIR RST 579');
    assert.equal(textarea.selectionStart, 5);
    assert.match(card.exchange, /UR RST 559/);
});

test('corrupt or unavailable browser storage leaves a usable card', () => {
    const corrupt = component(new Map([['cw-personal-prompt-card-v1', '{invalid']]));
    assert.equal(corrupt.state.selected.length, 2);
    const unavailable = component({ get() { throw Error('Denied'); }, set() { throw Error('Denied'); } });
    unavailable.setWording('close', 'TU 73');
    assert.equal(unavailable.state.close, 'TU 73');
});


test('handoff and both closing paths use the current callsigns and appropriate endings', () => {
    const state = new PromptCardState();
    assert.equal(renderPrompt(state.handBack, details), 'W1AW DE AF0FR KN');
    assert.equal(renderPrompt(state.copyCheck, details), 'HW CPY? BK');
    assert.match(renderPrompt(state.close, details), /TNX FER QSO[\s\S]*W1AW DE AF0FR SK$/);
    assert.equal(renderPrompt(state.replyClose, details), 'TU 73\nW1AW DE AF0FR SK');
});

test('new guidance preserves older saved wording and persists edits independently', () => {
    const storage = new Map([['cw-personal-prompt-card-v1', JSON.stringify({ close: 'MY CUSTOM CLOSING SK' })]]);
    const card = component(storage);
    assert.equal(card.state.close, 'MY CUSTOM CLOSING SK');
    assert.equal(card.state.replyClose, 'TU 73\n{otherCall} DE {ownCall} SK');
    card.setWording('handBack', 'HW? {otherCall} DE {ownCall} KN');
    card.setWording('replyClose', 'TU FER QSO 73 {ownCall} SK');
    const restored = component(storage);
    assert.equal(restored.state.handBack, 'HW? {otherCall} DE {ownCall} KN');
    assert.equal(restored.state.replyClose, 'TU FER QSO 73 {ownCall} SK');
    assert.equal(restored.state.close, 'MY CUSTOM CLOSING SK');
});


test('older topic cards migrate into the QSO flow without losing wording or selection', () => {
    const card = new PromptCardState();
    card.restore({ topics: [
        { id: 'station', title: 'Station', share: 'RIG HR KX3', ask: 'HW UR RIG?', enabled: true },
        { id: 'projects', title: 'Projects', share: 'MY CUSTOM PROJECT', ask: 'DO U BUILD?', enabled: true },
        { id: 'custom-1', title: 'Custom', share: 'CUSTOM WORDING', ask: '', enabled: false },
    ] });
    assert.deepEqual(Array.from(card.selectedFor('additional'), topic => topic.id), ['station']);
    assert.deepEqual(Array.from(card.selectedFor('ragchew'), topic => topic.id), ['projects']);
    assert.equal(card.topics[1].share, 'MY CUSTOM PROJECT');
    assert.equal(card.topics[2].enabled, false);
    assert.match(card.acknowledge, /TNX FER RPRT/);
    assert.match(card.ragchewStart, /BK$/);
});

test('topic placement persists and reordering stays within the same stage', () => {
    const storage = new Map();
    const card = component(storage);
    const station = card.state.topics.find(topic => topic.id === 'station');
    card.setStage(station, 'ragchew');
    card.toggle(card.state.topics.find(topic => topic.id === 'projects'), true);
    card.move('projects', -1);
    assert.deepEqual(Array.from(card.state.selectedFor('ragchew'), topic => topic.id), ['projects', 'station']);
    assert.deepEqual(Array.from(card.state.selectedFor('additional'), topic => topic.id), ['weather']);
    card.move('projects', -1);
    assert.deepEqual(Array.from(card.state.selectedFor('ragchew'), topic => topic.id), ['projects', 'station']);
    const restored = component(storage);
    assert.deepEqual(Array.from(restored.state.selectedFor('ragchew'), topic => topic.id), ['projects', 'station']);
    restored.setStage(restored.state.topics[0], 'invalid');
    assert.ok(restored.state.topics.every(topic => ['additional', 'ragchew'].includes(topic.stage)));
});

test('follow-on prompts and custom ragchew starter can be personalized independently', () => {
    const storage = new Map();
    const card = component(storage);
    card.setWording('acknowledge', 'R TNX {otherName}');
    card.setWording('ragchewStart', 'HW U LIKE UR {rig}? BK');
    const restored = component(storage);
    assert.equal(restored.state.acknowledge, 'R TNX {otherName}');
    assert.equal(restored.state.ragchewStart, 'HW U LIKE UR {rig}? BK');
});
