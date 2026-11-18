# AF0FR Method voice clips

These bundled MP3 recordings provide spoken introductions and letters without browser speech synthesis or a runtime speech service. Only requested clips are downloaded; decoded audio is reused during practice.

## Spoken letter names

`letter-A.mp3` through `letter-Z.mp3` are adapted from [English alphabet.ogg](https://commons.wikimedia.org/wiki/File:English_alphabet.ogg) by [Robotnick2](https://commons.wikimedia.org/wiki/User:Robotnick2), licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The recording was split into individual letters, filtered, and encoded as MP3. The edited clips are distributed under the same license.

## Spoken introductions

The `listen-*.mp3` clips were generated with Piper 1.8.0 and the en_US-ryan-high voice:
- Generator: https://github.com/OHF-Voice/piper1-gpl
- Model by Michael Hansen / Rhasspy: https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ryan/high/MODEL_CARD
- Dataset: RyanSpeech by Roholah Zandie and contributors, https://www.kaggle.com/datasets/roholazandie/ryanspeech
- Dataset license listed by the model card: CC BY-NC-SA 4.0, https://creativecommons.org/licenses/by-nc-sa/4.0/
- These synthetic, slowed and padded recordings are provided under CC BY-NC-SA 4.0 with attribution to the above sources.

The voice is synthetic. The model and Piper runtime are not distributed with the application.

To regenerate after changing the curriculum, install ffmpeg and create a separate Python environment:

```sh
python3 -m venv /tmp/af0fr-voice-venv
/tmp/af0fr-voice-venv/bin/pip install piper-tts==1.8.0
/tmp/af0fr-voice-venv/bin/python -m piper.download_voices --download-dir /tmp/af0fr-voice-model en_US-ryan-high
node scripts/generate-cw-voice.cjs /tmp/af0fr-voice-venv/bin/python /tmp/af0fr-voice-model/en_US-ryan-high.onnx
node --test tests/cw-af0fr-method.test.cjs
```

The generator derives catalog.json from the curriculum and updates the spoken introductions. The recorded `letter-*.mp3` assets are preserved. Introductions use explicit phonemes for letter names, including distinct A /eɪ/ and I /aɪ/.

Provide Instruction enables the introduction and prompts before letters. The introduction combines a listen-LETTER clip, three live Morse examples at word speed and the letter-LETTER clip. No spoken dit/dah recording is used. Playback adds 0.4 seconds of silence before and after each clip or Morse step; pauses are part of the playback position so pause/resume preserves them.

Piper uses `length_scale=1.45` for introductions. Generation preserves the full waveform and adds 120 ms of leading silence and 250 ms of trailing silence. Bump the voice URL revision when replacing recordings so browsers fetch the new clips.
