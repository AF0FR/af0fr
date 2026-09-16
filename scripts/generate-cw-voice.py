"""Generate static speech assets; Piper and its model are build-time tools only."""
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
from piper import PiperVoice, SynthesisConfig

model, catalog, output = map(Path, sys.argv[1:])
voice = PiperVoice.load(str(model))
cues = json.loads(catalog.read_text())
# Explicit phonemes avoid ambiguous spellings such as "ay" being read as "eye".
letter_phonemes = dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ', [
    'eɪj',        # A
    'biː',       # B
    'siː',       # C
    'diː',       # D
    'iː',        # E
    'ɛf',        # F
    'dʒiː',      # G
    'eɪtʃ',      # H
    'aɪ',        # I
    'dʒeɪ',      # J

    'keɪ',       # K
    'ɛl',        # L
    'ɛm',        # M
    'ɛn',        # N
    'oʊ',        # O
    'piː',       # P
    'kjuː',      # Q
    'ɑɹ',        # R
    'ɛs',        # S
    'tiː',       # T

    'juː',       # U
    'viː',       # V
    'ˈdʌbəljuː', # W
    'ɛks',       # X
    'waɪ',       # Y
    'ziː',       # Z
]))
assert letter_phonemes['A'] != letter_phonemes['I']
for index, (key, text) in enumerate(cues.items(), 1):
    letter = key.split('-')[1]
    phonemes = letter_phonemes[letter]
    missing = set(phonemes) - voice.config.phoneme_id_map.keys()
    if missing:
        raise ValueError(f'Unsupported phonemes for {letter}: {missing}')
    if key.startswith('letter-'):
        spoken = '[[' + phonemes + '.]]'
        scale = 1.8
    elif key.startswith('listen-'):
        spoken = 'Listen for the [[' + phonemes + '.]]'
        scale = 1.45
    else:
        raise ValueError(f'Unexpected voice cue: {key}')
    config = SynthesisConfig(length_scale=scale, noise_scale=0.4, noise_w_scale=0.6)
    with tempfile.TemporaryDirectory(prefix='af0fr-cue-') as temporary:
        wav_path = Path(temporary) / 'cue.wav'
        with wave.open(str(wav_path), 'wb') as wav:
            voice.synthesize_wav(spoken, wav, syn_config=config)
        # Preserve the full synthesized waveform: quiet consonants must not be trimmed.
        subprocess.run([
            'ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav_path),
            '-af', 'adelay=120:all=1,apad=pad_dur=0.25',
            '-codec:a', 'libmp3lame', '-b:a', '64k', str(output / (key + '.mp3')),
        ], check=True)
    print(f'{index}/{len(cues)} {key}', flush=True)
