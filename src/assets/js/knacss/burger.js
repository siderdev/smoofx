/**!
 Navigation Button Toggle class
 */
(function () {

    // old browser or not ?
    if (!('querySelector' in document && 'addEventListener' in window)) {
        return;
    }
    window.document.documentElement.className += ' js-enabled';

    function toggleNav() {

        // Define targets by their class or id
        var button = document.querySelector('.nav-button');
        var target = document.querySelector('body > nav');

        // click-touch event
        if (button) {
            button.addEventListener('click',
                function (e) {
                    button.classList.toggle('is-active');
                    target.classList.toggle('is-opened');
                    e.preventDefault();
                }, false);
        }
    } // end toggleNav()

    toggleNav();
}());