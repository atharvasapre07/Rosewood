const MIN_BPM = 30;
const MAX_BPM = 300;

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