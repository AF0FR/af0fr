// Usage: node scripts/generate-cw-voice.cjs /path/to/python /path/to/voice.onnx
// Requires piper-tts==1.8.0 in that Python environment and ffmpeg on PATH.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/app/pages/cw/af0fr-method.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exported });
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const patterns = ['.-','-...','-.-.','-..','.','..-.','--.','....','..','.---','-.-','.-..','--','-.','---','.--.','--.-','.-.','...','-','..-','...-','.--','-..-','-.--','--..'];
const cues = {};
for (const phase of exported.AF0FR_PHASES) {
    phase.elements.forEach((word, index) => {
        const focus = phase.focusLetters[index];
        for (const step of exported.buildMethodSteps(word, focus, patterns[letters.indexOf(focus)], 'medium', 1, 1, Object.fromEntries(Object.keys(exported.DEFAULT_METHOD_VOICE_OPTIONS).map(key => [key, true])))) {
            if (step.kind === 'speech') cues[step.audioKey] = step.text;
        }
    });
}
const output = path.join(root, 'src/assets/cw-voice');
fs.mkdirSync(output, { recursive: true });
const catalog = path.join(output, 'catalog.json');
fs.writeFileSync(catalog, JSON.stringify(cues, null, 2) + '\n');
if (!process.argv[2] || !process.argv[3]) throw new Error('Provide the Python executable and Piper ONNX voice model.');
const result = spawnSync(process.argv[2], [path.join(__dirname, 'generate-cw-voice.py'), process.argv[3], catalog, output], { stdio: 'inherit' });
process.exit(result.status ?? 1);
