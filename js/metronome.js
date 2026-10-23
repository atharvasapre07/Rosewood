const MIN_BPM = 30;
const MAX_BPM = 300;
const MIN_BEATS = 1;
const MAX_BEATS = 12;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const BEAT_STATES = ['accent', 'normal', 'muted'];

const TEMPO_NAMES = [
    { max: 40,       name: 'Grave' },
    { max: 60,       name: 'Largo' },
    { max: 66,       name: 'Larghetto' },
    { max: 76,       name: 'Adagio' },
    { max: 108,      name: 'Andante' },
    { max: 120,      name: 'Moderato' },
    { max: 128,      name: 'Allegretto' },
    { max: 168,      name: 'Allegro' },
    { max: 176,      name: 'Vivace' },
    { max: 200,      name: 'Presto' },
    { max: Infinity, name: 'Prestissimo' }
];

const CLICK_SOUNDS = {
    accent: { freq: 1500, volume: 0.4 },
    normal: { freq: 1000, volume: 0.25 },
    muted:  { freq: 0,    volume: 0 },
    sub:    { freq: 800,  volume: 0.12 }
};

let audioCtx = null;
let masterGain = null;
let isPlaying = false;
let nextNoteTime = 0;
let timerId = null;
let currentBeat = 0;
let currentTick = 0;

function getTempoName(bpm) {
    const tempo = TEMPO_NAMES.find(t => t.max >= bpm);
    return tempo ? tempo.name : 'Unknown';
}

function updateBpm(bpm) {
    const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
    $('#bpm-slider').val(clamped);
    $('#bpm-value').text(clamped);
    $('.tempo-name').text(getTempoName(clamped));
}

function setBeats(count) {
    const clamped = Math.min(MAX_BEATS, Math.max(MIN_BEATS, count));
    let current = $('.beat').length;

    while (current < clamped) {
        current++;
        $('.beats').append(`
            <div class="beat">
                <button class="beat-btn" data-state="normal" aria-label="Beat ${current}, normal"></button>
                <span class="beat-number">${current}</span>
            </div>
        `);
    }

    while (current > clamped) {
        $('.beat').last().remove();
        current--;
    }

    $('#beats-value').text(clamped);
}

function playClick(time, state) {
    if (state === 'muted') return;
    const sound = CLICK_SOUNDS[state];

    let volume = sound.volume;
    if (state === 'sub') {
        volume = CLICK_SOUNDS.accent.volume * Number($('#sub-volume').val()) / 100;
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = $('#wave').val();
    osc.frequency.value = sound.freq;

    osc.connect(gain);
    gain.connect(masterGain);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.06);
}

function updateMasterVolume() {
    if (!masterGain) return;
    const volume = Number($('#master-volume').val()) / 100;
    masterGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.01);
}

function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_SEC) {
        const beatCount = $('.beat-btn').length;
        if (currentBeat >= beatCount) currentBeat = 0;

        const ticks = Number($('#subdivision').val()) || 2;
        const state = currentTick === 0
            ? $('.beat-btn').eq(currentBeat).attr('data-state')
            : 'sub';

        playClick(nextNoteTime, state);
        nextNoteTime += 60 / Number($('#bpm-slider').val()) / ticks;

        currentTick++;
        if (currentTick >= ticks) {
            currentTick = 0;
            currentBeat = (currentBeat + 1) % beatCount;
        }
    }
}

function startMetronome() {
    isPlaying = true;
    currentBeat = 0;
    currentTick = 0;
    nextNoteTime = audioCtx.currentTime + 0.05;
    scheduler();
    timerId = setInterval(scheduler, LOOKAHEAD_MS);
}

function stopMetronome() {
    isPlaying = false;
    clearInterval(timerId);
}

$('#bpm-slider').on('input', function () {
    updateBpm(Number($(this).val()));
});

$('#bpm-up').on('click', function () {
    updateBpm(Number($('#bpm-slider').val()) + 1);
});

$('#bpm-down').on('click', function () {
    updateBpm(Number($('#bpm-slider').val()) - 1);
});

$('#beats-up').on('click', function () {
    setBeats($('.beat').length + 1);
});

$('#beats-down').on('click', function () {
    setBeats($('.beat').length - 1);
});

$('#master-volume').on('input', updateMasterVolume);

$('.beats').on('click', '.beat-btn', function () {
    const current = $(this).attr('data-state');
    const next = BEAT_STATES[(BEAT_STATES.indexOf(current) + 1) % BEAT_STATES.length];
    const beatNumber = $('.beat-btn').index(this) + 1;

    $(this).attr('data-state', next);
    $(this).attr('aria-label', `Beat ${beatNumber}, ${next}`);
});

$('#start-btn').on('click', function () {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        updateMasterVolume();
    }
    audioCtx.resume();

    if (isPlaying) {
        stopMetronome();
        $(this).text('Start');
    } else {
        startMetronome();
        $(this).text('Stop');
    }
});

updateBpm(Number($('#bpm-slider').val()));