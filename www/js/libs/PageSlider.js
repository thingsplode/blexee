/* Notes:
 * - History management is currently done using window.location.hash.  This could easily be changed to use Push State instead.
 * - jQuery dependency for now. This could also be easily removed.
 */

function PageSlider(container) {

    var container = container,
            currentPage,
            stateHistory = [];

    // Use this function if you want PageSlider to automatically determine the sliding direction based on the state history
    this.slidePage = function (page) {

        var l = stateHistory.length,
                state = window.location.hash;

        if (l === 0) {
            stateHistory.push(state);
            this.slidePageFrom(page);
            return;
        }
        if (state === stateHistory[l - 2]) {
            stateHistory.pop();
            this.slidePageFrom(page, 'left');
        } else {
            stateHistory.push(state);
            this.slidePageFrom(page, 'right');
        }

    };

    // Use this function directly if you want to control the sliding direction outside PageSlider
    this.slidePageFrom = function (page, from) {

        //container.append(page);
        container.html(page);

        if (!currentPage || !from) {
            console.log("SETTING CURRENT PAGE");
            page.attr("class", "sliderpage center");
            currentPage = page;
            return;
        }

        console.log('Current Page: ' + currentPage.attr("class"));
        console.log('New Page: ' + page.attr("class"));

        // Position the page at the starting position of the animation
        page.attr("class", "sliderpage " + from);


        currentPage.on('webkitTransitionEnd', function (e) {
            var target = $(e.target);
            var evtTargetClass = target.attr("class");
            if (evtTargetClass.indexOf('sliderpage') > -1) {
                console.log('target (to be removed) class ->' + target.attr("class"));
                target.remove();
            } else {
                console.log('target will not be removed | class -> [' + target.attr("class") + ']');
            }
        });

        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        //console.log('container -> '+JSON.stringify(container));
        container[0].offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        page.attr("class", "sliderpage transition center");
        currentPage.attr("class", "sliderpage transition " + (from === "left" ? "right" : "left"));
        currentPage = page;
    };

}