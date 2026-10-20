const MIN_BPM = 30;
const MAX_BPM = 300;
let audioCtx = null;

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

function updateBpm(bpm) {
    const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
    $('#bpm-slider').val(clamped);
    $('#bpm-value').text(clamped);
    $('.tempo-name').text(getTempoName(clamped));
}

$('#bpm-slider').on('input', function () {
    updateBpm(Number($(this).val()));
});

updateBpm(Number($('#bpm-slider').val()));

$('#bpm-up').on('click', function () {
    updateBpm(Number($('#bpm-slider').val()) + 1);
});

$('#bpm-down').on('click', function () {
    updateBpm(Number($('#bpm-slider').val()) - 1);
});

function getTempoName(bpm) {
    const tempo = TEMPO_NAMES.find(t => t.max >= bpm);
    return tempo ? tempo.name : 'Unknown';
}

function playClick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 1000;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.06);
}

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;

let isPlaying = false;
let nextNoteTime = 0;
let timerId = null;

function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_SEC) {
        playClick(nextNoteTime);
        nextNoteTime += 60 / Number($('#bpm-slider').val());
    }
}

function startMetronome() {
    isPlaying = true;
    nextNoteTime = audioCtx.currentTime + 0.05;
    scheduler();
    timerId = setInterval(scheduler, LOOKAHEAD_MS);
}

function stopMetronome() {
    isPlaying = false;
    clearInterval(timerId);
}

$('#start-btn').on('click', function () {
    if (!audioCtx) {
        audioCtx = new AudioContext();
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
