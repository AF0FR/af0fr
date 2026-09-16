const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = (file) => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
}).outputText;
const methodExports = {};
vm.runInNewContext(compile('src/app/pages/cw/af0fr-method.ts'), { exports: methodExports });
const allVoice = Object.fromEntries(Object.keys(methodExports.DEFAULT_METHOD_VOICE_OPTIONS).map(key => [key, true]));
const componentCode = compile('src/app/pages/cw/af0fr_cw_qso.page.ts');

function createPage() {
    const timers = new Map();
    const storage = new Map();
    let nextTimer = 0;
    const schedule = (callback) => { timers.set(++nextTimer, callback); return nextTimer; };
    const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} });
    let activeTones = 0;
    const voice = { active: false, starts: [], requests: [], fail: false, pending: null };
    class AudioContext {
        currentTime = 0;
        destination = {};
        resume() { return Promise.resolve(); }
        close() { return Promise.resolve(); }
        async decodeAudioData() { return { duration: 1.2 }; }
        createBufferSource() {
            let started = false;
            return { connect() {},
                start(at, offset) { assert.equal(activeTones, 0); assert.equal(voice.active, false); started = true; voice.active = true; voice.starts.push(offset); },
                stop() { if (started) voice.active = false; started = false; }
            };
        }
        createGain() { return { gain: parameter(), connect() {} }; }
        createOscillator() {
            let started = false;
            return { frequency: parameter(), connect() {},
                start() { assert.equal(voice.active, false, 'No speech overlaps Morse'); started = true; activeTones++; },
                stop(at) { if (at === undefined && started) { activeTones--; started = false; } },
            };
        }
    }
    const decorator = () => () => {};
    const exports = {};
    const window = { AudioContext, setTimeout: schedule, setInterval: schedule, clearTimeout: (id) => timers.delete(id), clearInterval: (id) => timers.delete(id) };
    vm.runInNewContext(componentCode, {
        exports,
        require: (name) => name === './af0fr-method' ? methodExports : new Proxy({}, {
            get: (_, key) => ['Component', 'ViewChild', 'HostListener'].includes(key) ? decorator : {},
        }),
        window, URL, document: { baseURI: 'https://example.test/' },
        fetch: async url => {
            voice.requests.push(String(url));
            if (voice.pending) await voice.pending;
            if (voice.fail) throw new Error('offline');
            return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
        },
        localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
        crypto: require('node:crypto').webcrypto,
    });
    const Page = exports.Af0frCwQsoPage;
    Page.prototype.initializeOperatorState = function () {};
    Page.prototype.readPendingMetrics = () => [];
    const page = new Page({}, { run: callback => callback() });
    page.methodVoice = { ...allVoice };
    return { page, timers, voice };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
async function finishStep({ page, timers }) {
    await settle();
    const callback = timers.get(page.playbackTimer);
    assert.equal(typeof callback, 'function');
    callback();
    await settle();
}
async function finishElement(harness) {
    const initial = JSON.stringify(harness.page.methodPosition);
    let remaining = 200;
    do {
        assert.ok(remaining-- > 0, 'Element must finish');
        await finishStep(harness);
    } while (!harness.page.methodComplete && JSON.stringify(harness.page.methodPosition) === initial);
}

test('all elements follow Koch order, with unique Q signals and the approved pools', () => {
    const phases = methodExports.AF0FR_PHASES;
    const koch = 'KMURESNAPTLWIJZFOYVGQHBCDX';
    assert.equal(phases.length, 12);
    assert.equal(phases[0].elements.join(','), 'BK,SK,QRM,GM');
    assert.equal(phases[1].elements.join(','), 'TU,UR,QRS,QRQ,RPT');
    assert.equal(phases[6].elements.join(','), 'RIG,SRI,JIM,JOB');
    let previous = -1;
    for (const phase of phases) {
        assert.equal(phase.elements.length, phase.focusLetters.length);
        phase.elements.forEach((element, index) => {
            const focus = phase.focusLetters[index];
            assert.ok(element.includes(focus));
            assert.ok(koch.indexOf(focus) >= previous);
            previous = koch.indexOf(focus);
        });
    }
    const codes = phases.flatMap(phase => [...phase.elements]).filter(word => word.startsWith('Q'));
    assert.equal(codes.length, new Set(codes).size);
    assert.ok(!codes.includes('QRT'));
});

test('instruction uses real Morse and one switch controls all before cues', () => {
    const steps = methodExports.buildMethodSteps('BK', 'K', '-.-', 'medium', 5, 2, allVoice);
    assert.equal(steps[0].text, 'Listen for the K.');
    assert.equal(steps[1].kind, 'morse');
    assert.equal(steps[1].text, 'K');
    assert.equal(steps[1].part, 'instruction');
    assert.ok(steps.slice(1, 4).every(step => step.kind === 'morse' && step.text === 'K'));
    assert.equal(steps.filter(step => step.kind === 'morse' && step.part === 'instruction').length, 3);
    assert.equal(steps[4].text, 'K');
    assert.equal(steps.slice(5, 10).map(step => step.text).join(','), 'BK,BK,BK,BK,BK');
    assert.ok(steps.slice(5, 10).every(step => step.wpm === 20 && step.farnsworthWpm === 20));
    assert.equal(steps.slice(10).map(step => step.kind + ':' + step.text).join(','), 'speech:B,morse:B,morse:B,speech:K,morse:K,morse:K');
    assert.ok(!steps.some(step => step.kind === 'speech' && step.audioKey.startsWith('word-')));
    assert.ok(!steps.some(step => step.label.includes('after')));
    assert.ok(steps.filter(step => step.part === 'letter').every(step => step.wpm === 15 && step.farnsworthWpm === 8));
    const silentSteps = methodExports.buildMethodSteps('BK', 'K', '-.-', 'medium', 5, 1, { provideInstruction: false });
    assert.equal(silentSteps.length, 7);
    assert.ok(silentSteps.every(step => step.kind === 'morse' && step.part !== 'instruction'));
});

test('spoken instruction surrounds actual CW tones and respects pauses', async () => {
    const h = createPage();
    const { page, voice } = h;
    page.toggleMethod();
    assert.equal(page.methodSteps.length, 14);
    page.startExercise();
    await settle();
    assert.ok(voice.requests.at(-1).endsWith('listen-K.mp3?v=3'));
    assert.ok(Math.abs(page.playbackDuration - 2) < 1e-9);
    assert.equal(page.tagTimings[0].start, 0.4);
    await finishStep(h);
    assert.equal(page.methodStepIndex, 1);
    assert.equal(page.activeMethodTimelinePart, 'instruction');
    assert.equal(page.timeline.length, 3);
    assert.ok(Math.abs(page.timeline[0].duration - 0.18) < 1e-9);
    assert.equal(page.timeline[0].start, 0.4);
    const last = page.timeline.at(-1);
    assert.ok(page.playbackDuration - last.start - last.duration >= 0.4 - 1e-9);
    await finishStep(h);
    assert.equal(page.methodSteps[page.methodStepIndex].label, 'Instruction tone 2/3');
    await finishStep(h);
    assert.equal(page.methodSteps[page.methodStepIndex].label, 'Instruction tone 3/3');
    await finishStep(h);
    assert.ok(voice.requests.at(-1).endsWith('letter-K.mp3?v=3'));
    await finishStep(h);
    assert.equal(page.methodStepIndex, 5);
    assert.equal(page.methodSteps[5].part, 'word');
    assert.ok(!voice.requests.some(url => url.includes('word-')));
    page.jumpToMethodStep(11);
    assert.equal(page.methodSteps[11].text, 'B');
    assert.ok(Math.abs(page.timeline[0].duration - 0.24) < 1e-9);
    page.copy = 'BK';
    page.checkCopy();
    assert.equal(page.attempts, 0);
    page.ngOnDestroy();
});

test('phase repeats include all cues and letters before advancing, then stop at the end', async () => {
    const h = createPage();
    const { page, timers, voice } = h;
    page.toggleMethod();
    page.updateMethodRepeat('methodWordPlays', '2');
    page.updateMethodRepeat('methodLetterPlays', '2');
    page.updateMethodRepeat('methodPhasePasses', '2');
    page.startExercise();
    const expected = methodExports.AF0FR_PHASES.flatMap(phase => [...phase.elements, ...phase.elements]);
    for (const word of expected) {
        assert.equal(page.exercise, word);
        assert.equal(page.poolQsoDefinitions.length, page.contentTags.length);
        await finishElement(h);
    }
    assert.equal(page.methodComplete, true);
    assert.equal(page.isPlaying, false);
    assert.equal(page.methodPosition.phase, 11);
    assert.equal(voice.active, false);
    assert.equal(timers.size, 0);
    assert.equal(page.attempts, 0);
});

test('pause resumes recordings at their offset and reuses decoded clips', async () => {
    const h = createPage();
    const { page, voice } = h;
    page.toggleMethod();
    page.startExercise();
    await settle();
    page.audioContext.currentTime = 0.55;
    page.pause();
    assert.equal(voice.active, false);
    assert.ok(Math.abs(page.playbackPosition - 0.5) < 1e-9);
    page.play();
    await settle();
    assert.ok(Math.abs(voice.starts.at(-1) - 0.1) < 1e-9);
    assert.equal(voice.requests.length, 1);
    page.jumpToMethodStep(5);
    assert.equal(voice.active, false);
    page.audioContext.currentTime += 0.55;
    page.pause();
    assert.ok(Math.abs(page.playbackPosition - 0.5) < 1e-9);
    page.play();
    assert.equal(page.playbackOffset, page.playbackPosition);
    page.ngOnDestroy();
    assert.equal(h.timers.size, 0);
});

test('stopped or replaced pending voice requests cannot restart playback', async () => {
    for (const action of ['stop', 'phase']) {
        const { page, voice, timers } = createPage();
        let resolve;
        voice.pending = new Promise(done => { resolve = done; });
        page.toggleMethod();
        page.startExercise();
        await settle();
        if (action === 'stop') page.stop();
        else page.selectMethodPhase('6');
        resolve();
        await settle();
        assert.equal(voice.starts.length, 0);
        assert.equal(page.isPlaying, false);
        assert.equal(timers.size, 0);
    }
});

test('failed voice downloads pause and can be retried', async () => {
    const { page, voice } = createPage();
    voice.fail = true;
    page.toggleMethod();
    page.startExercise();
    await settle();
    assert.equal(page.isPaused, true);
    assert.match(page.methodSpeechMessage, /could not load/);
    voice.fail = false;
    page.play();
    await settle();
    assert.equal(voice.active, true);
    assert.equal(page.methodSpeechMessage, '');
    assert.equal(voice.requests.length, 2);
    page.ngOnDestroy();
});

test('speed modes, cues, and repeat counts persist without changing custom practice', () => {
    const { page } = createPage();
    page.mode = 'numbers';
    page.wpm = 23;
    page.farnsworthWpm = 12;
    page.audioEffect = 'challenging';
    page.toggleMethod();
    assert.equal(page.spacingVariation(), 1);
    for (const [mode, word, letter] of [['slow', '15/8', '10/5'], ['medium', '20/20', '15/8'], ['fast', '25/20', '18/10']]) {
        page.selectMethodSpeed(mode);
        const wordStep = page.methodSteps.find(step => step.part === 'word');
        const letterStep = page.methodSteps.find(step => step.part === 'letter');
        assert.equal(`${wordStep.wpm}/${wordStep.farnsworthWpm}`, word);
        assert.equal(`${letterStep.wpm}/${letterStep.farnsworthWpm}`, letter);
    }
    page.toggleMethodVoice('provideInstruction', false);
    assert.ok(!page.methodSteps.some(step => step.label === 'Say BK after'));
    page.updateMethodRepeat('methodLetterPlays', '3');
    const saved = page.currentUiState();
    assert.equal(saved.mode, 'numbers');
    assert.equal(saved.methodLetterPlays, 3);
    assert.equal(saved.methodVoice.provideInstruction, false);
    page.toggleMethod();
    assert.equal(page.mode, 'numbers');
    assert.equal(page.wpm, 23);
    assert.equal(page.farnsworthWpm, 12);
    assert.equal(page.audioEffect, 'challenging');
    const { page: restored } = createPage();
    restored.applyUiState(saved);
    assert.equal(restored.methodSpeed, 'fast');
    assert.equal(restored.methodLetterPlays, 3);
    assert.equal(restored.methodVoice.provideInstruction, false);
});

test('previous/replay navigation restarts at instruction and cleans up audio', async () => {
    const h = createPage();
    const { page, voice } = h;
    page.toggleMethod();
    page.startExercise();
    await finishElement(h);
    assert.equal(page.exercise, 'SK');
    page.previousMethodElement();
    await settle();
    assert.equal(page.exercise, 'BK');
    assert.equal(page.methodStepIndex, 0);
    assert.equal(page.canPreviousMethodElement, false);
    page.replayMethodElement();
    await settle();
    assert.equal(page.methodStepIndex, 0);
    page.ngOnDestroy();
    assert.equal(voice.active, false);
    assert.equal(page.isPlaying, false);
});

test('every curriculum voice cue has a bundled audio asset', () => {
    const assetDir = path.join(root, 'src/assets/cw-voice');
    const catalog = JSON.parse(fs.readFileSync(path.join(assetDir, 'catalog.json'), 'utf8'));
    for (const phase of methodExports.AF0FR_PHASES) {
        phase.elements.forEach((word, i) => {
            const steps = methodExports.buildMethodSteps(word, phase.focusLetters[i], '.-', 'medium', 1, 1, allVoice);
            for (const step of steps.filter(step => step.kind === 'speech')) {
                assert.ok(catalog[step.audioKey], step.audioKey);
                assert.ok(fs.statSync(path.join(assetDir, step.audioKey + '.mp3')).size > 500);
            }
        });
    }
});

test('voice defaults off and timeline highlights the current enabled part', () => {
    assert.ok(Object.values(methodExports.DEFAULT_METHOD_VOICE_OPTIONS).every(value => value === false));
    const { page } = createPage();
    page.toggleMethod();
    page.exercise = 'BK';
    page.isPlaying = true;
    for (let index = 0; index < page.methodSteps.length; index++) {
        page.methodStepIndex = index;
        const step = page.methodSteps[index];
        const part = page.methodTimelineParts.find(item => item.id === page.activeMethodTimelinePart);
        assert.ok(part);
        assert.equal(part.id, step.part);
    }
    page.stop();
    assert.equal(page.activeMethodTimelinePart, null);
    for (const key of Object.keys(allVoice)) page.toggleMethodVoice(key, false);
    assert.ok(page.methodSteps.every(step => step.kind === 'morse'));
});

test('toggling cues preserves the current element and Morse repeat', () => {
    const { page } = createPage();
    page.toggleMethod();
    page.startExercise();
    page.jumpToMethodStep(5);
    const currentLabel = page.methodSteps[page.methodStepIndex].label;
    page.toggleMethodVoice('provideInstruction', false);
    assert.equal(page.exercise, 'BK');
    assert.equal(page.isPlaying, true);
    assert.equal(page.methodSteps[page.methodStepIndex].label, currentLabel);
    page.pause();
    page.toggleMethodVoice('provideInstruction', true);
    assert.equal(page.isPaused, true);
    assert.equal(page.methodSteps[page.methodStepIndex].label, currentLabel);
    page.ngOnDestroy();
});

test('legacy before cues migrate to the single instruction option; after-only cues do not', () => {
    const { page } = createPage();
    page.applyUiState({ methodVoice: { sayWordBefore: true } });
    assert.equal(page.methodVoice.provideInstruction, true);
    page.applyUiState({ methodVoice: { sayWordAfter: true } });
    assert.equal(page.methodVoice.provideInstruction, false);
    page.applyUiState({ methodVoice: { provideInstruction: false, giveInstruction: true } });
    assert.equal(page.methodVoice.provideInstruction, false);
});

test('resume inside speech trailing silence does not replay the voice', async () => {
    const { page, voice } = createPage();
    page.toggleMethod();
    page.startExercise();
    await settle();
    page.audioContext.currentTime = 1.85;
    page.pause();
    const starts = voice.starts.length;
    page.play();
    await settle();
    assert.equal(voice.starts.length, starts);
    assert.equal(page.isPlaying, true);
    page.ngOnDestroy();
});
