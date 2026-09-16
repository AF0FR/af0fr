export type MethodSpeed = 'slow' | 'medium' | 'fast';

export interface MethodPhase {
    elements: readonly string[];
    focusLetters: readonly string[];
}

export interface MethodPosition {
    phase: number;
    element: number;
    pass: number;
}

export const AF0FR_PHASES: readonly MethodPhase[] = [
    { elements: ['BK', 'SK', 'QRM', 'GM'], focusLetters: ['K', 'K', 'M', 'M'] },
    { elements: ['TU', 'UR', 'QRS', 'QRQ', 'RPT'], focusLetters: ['U', 'U', 'R', 'R', 'R'] },
    { elements: ['DE', 'ES', 'QSO', 'QSL', 'PSE'], focusLetters: ['E', 'E', 'S', 'S', 'S'] },
    { elements: ['QRN', 'AGN', 'NAME', 'ANT'], focusLetters: ['N', 'N', 'A', 'A'] },
    { elements: ['QRP', 'PWR', 'QTH', 'TU'], focusLetters: ['P', 'P', 'T', 'T'] },
    { elements: ['QRL', 'CALL', 'WX', 'HW'], focusLetters: ['L', 'L', 'W', 'W'] },
    { elements: ['RIG', 'SRI', 'JIM', 'JOB'], focusLetters: ['I', 'I', 'J', 'J'] },
    { elements: ['QRZ', 'FB', 'FER'], focusLetters: ['Z', 'F', 'F'] },
    { elements: ['OP', 'QSY', 'CPY'], focusLetters: ['O', 'Y', 'Y'] },
    { elements: ['VY', 'GM', 'GE', 'CQ', 'HR'], focusLetters: ['V', 'G', 'G', 'Q', 'H'] },
    { elements: ['QSB', 'BK', 'BT', 'CQ', 'CALL'], focusLetters: ['B', 'B', 'B', 'C', 'C'] },
    { elements: ['DE', 'WX', 'DX'], focusLetters: ['D', 'X', 'X'] },
];

export const AF0FR_SPEEDS: Record<MethodSpeed, { label: string; word: readonly [number, number]; letter: readonly [number, number] }> = {
    slow: { label: 'Slow', word: [15, 8], letter: [10, 5] },
    medium: { label: 'Medium (recommended)', word: [20, 20], letter: [15, 8] },
    fast: { label: 'Fast', word: [25, 20], letter: [18, 10] },
};

export function nextMethodPosition(position: MethodPosition, phasePasses: number): MethodPosition | null {
    if (position.element + 1 < AF0FR_PHASES[position.phase].elements.length) {
        return { ...position, element: position.element + 1 };
    }
    if (position.pass + 1 < phasePasses) return { ...position, element: 0, pass: position.pass + 1 };
    if (position.phase + 1 < AF0FR_PHASES.length) return { phase: position.phase + 1, element: 0, pass: 0 };
    return null;
}

export function previousMethodPosition(position: MethodPosition, phasePasses: number): MethodPosition | null {
    if (position.element > 0) return { ...position, element: position.element - 1 };
    if (position.pass > 0) return { ...position, element: AF0FR_PHASES[position.phase].elements.length - 1, pass: position.pass - 1 };
    if (position.phase > 0) return { phase: position.phase - 1, element: AF0FR_PHASES[position.phase - 1].elements.length - 1, pass: phasePasses - 1 };
    return null;
}

export interface MethodVoiceOptions {
    provideInstruction: boolean;
}

export const DEFAULT_METHOD_VOICE_OPTIONS: MethodVoiceOptions = {
    provideInstruction: false,
};

// Silence on each side of every spoken cue and Morse playback step.
export const METHOD_PAUSE_SECONDS = 0.4;

export type MethodPlaybackStep =
    | { kind: 'speech'; label: string; text: string; audioKey: string; part: 'instruction' | 'sayLetterBefore' }
    | { kind: 'morse'; label: string; text: string; wpm: number; farnsworthWpm: number; part: 'instruction' | 'word' | 'letter' };

export function buildMethodSteps(
    word: string,
    focusLetter: string,
    _focusPattern: string,
    speed: MethodSpeed,
    wordPlays: number,
    letterPlays: number,
    voice: MethodVoiceOptions,
): MethodPlaybackStep[] {
    const steps: MethodPlaybackStep[] = [];
    const preset = AF0FR_SPEEDS[speed];
    if (voice.provideInstruction) {
        steps.push({ kind: 'speech', audioKey: `listen-${focusLetter}`, label: 'Listen for the letter', text: `Listen for the ${focusLetter}.`, part: 'instruction' });
        for (let play = 0; play < 3; play += 1) {
            steps.push({ kind: 'morse', label: `Instruction tone ${play + 1}/3`, text: focusLetter, wpm: preset.word[0], farnsworthWpm: preset.word[1], part: 'instruction' });
        }
        steps.push({ kind: 'speech', audioKey: `letter-${focusLetter}`, label: 'Name the focus letter', text: focusLetter, part: 'instruction' });
    }
    for (let play = 0; play < wordPlays; play += 1) {
        steps.push({ kind: 'morse', label: `${word} · word ${play + 1}/${wordPlays}`, text: word, wpm: preset.word[0], farnsworthWpm: preset.word[1], part: 'word' });
    }
    for (const letter of word) {
        if (voice.provideInstruction) steps.push({ kind: 'speech', audioKey: `letter-${letter}`, label: `Say ${letter} before`, text: letter, part: 'sayLetterBefore' });
        for (let play = 0; play < letterPlays; play += 1) {
            steps.push({ kind: 'morse', label: `${letter} · letter ${play + 1}/${letterPlays}`, text: letter, wpm: preset.letter[0], farnsworthWpm: preset.letter[1], part: 'letter' });
        }
    }
    return steps;
}
