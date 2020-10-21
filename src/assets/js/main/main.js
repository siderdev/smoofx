// Activate tooltip
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})
// Add focus into modal
$('#myModal').on('shown.bs.modal', function () {
    $('#myInput').trigger('focus')
})