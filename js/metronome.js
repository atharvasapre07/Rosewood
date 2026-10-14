const MIN_BPM = 30;
const MAX_BPM = 300;

function updateBpm(bpm) {
    const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
    $('#bpm-slider').val(clamped);
    $('#bpm-value').text(clamped);
}

$('#bpm-slider').on('input', function () {
    updateBpm(Number($(this).val()));
});

updateBpm(Number($('#bpm-slider').val()));