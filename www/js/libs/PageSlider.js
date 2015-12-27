/* Notes:
 * - History management is currently done using window.location.hash.  This could easily be changed to use Push State instead.
 * - jQuery dependency for now. This could also be easily removed.
 * 
 * http://coenraets.org/blog/2013/03/hardware-accelerated-page-transitions-for-mobile-web-apps-phonegap-apps/
 */

function PageSlider(container) {

    var container = container,
            currentPage,
            stateHistory = [];

    // Use this function if you want PageSlider to automatically determine the sliding direction based on the state history
    this.slidePage = function (page) {

        var l = stateHistory.length, state;

        state = window.location.hash;

        if (l === 0) {
            stateHistory.push(state);
            this.slidePageFrom(page);
            return;
        } else if (stateHistory[l - 1] === state) {
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

        container.append(page);
        //container.html(page);

        if (!currentPage || !from) {
            page.attr("class", "page center");
            page.find('.page-content').attr("class", "page-content active");
            currentPage = page;
            return;
        }
        
        currentPage.bind('webkitTransitionEnd', function (e) {
            $(e.target).remove();
        });
        
        //currentPage.data("url_hash", window.location.hash);
        
        
        // Position the page at the starting position of the animation
        page.attr("class", "page " + from);

        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        container[0].offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        page.attr("class", "page transition center");
        page.find('.page-content').attr("class", "page-content active");
        
        currentPage.attr("class", "page transition " + (from === "left" ? "right" : "left"));
        currentPage.find('.page-content').attr("class", "page-content");
        currentPage = page;
    };

}