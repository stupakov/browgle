(Browgle = function(){}).prototype = {

    user_id: null,
    client_id: String(Math.random()),
    // current_users: [],

    getDice: function() {
        return [
            ['A', 'A', 'C', 'I', 'O', 'T'],
            ['A', 'B', 'I', 'L', 'T', 'Y'],
            ['A', 'B', 'J', 'M', 'O', 'Qu'],
            ['A', 'C', 'D', 'E', 'M', 'P'],
            ['A', 'C', 'E', 'L', 'R', 'S'],
            ['A', 'D', 'E', 'N', 'V', 'Z'],
            ['A', 'H', 'M', 'O', 'R', 'S'],
            ['B', 'F', 'I', 'O', 'R', 'X'],
            ['D', 'E', 'N', 'S', 'O', 'W'],
            ['D', 'K', 'N', 'O', 'U', 'T'],
            ['E', 'E', 'F', 'H', 'I', 'Y'],
            ['E', 'G', 'I', 'N', 'T', 'V'],
            ['E', 'G', 'K', 'L', 'U', 'Y'],
            ['E', 'H', 'I', 'N', 'P', 'S'],
            ['E', 'L', 'P', 'S', 'T', 'U'],
            ['G', 'I', 'L', 'R', 'U', 'W']
        ];
    },

    // This function gets called when the page is first loaded. It should only
    // be called once. It sets up the game.
    init: function() {
        var self = this;

        $('table.game_board td')
            .height(50)
            .width(50);

        this.debugHooks(); // XXX

        this.startLongPoll();

        $('.game_screen').hide();
        $('.signin_screen').show();
        this.setupSigninScreen();

        onunload = function() {
            self.postEvent({event: 'remove_user'});
            self.postEvent({event: 'remove_client'});
            return false;
        }
    },

    setupSigninScreen: function() {
        var self = this;
        $('input.user_id')
            .val('')
            .focus();
        $('form.signin')
            .unbind('submit')
            .submit(
                function() {
                    try {
                        var id = $(this).find('input').val();
                        if (id.match(/^[\w\.\-]+@[\w\.\-]+\.\w{2,4}$/)) {
                            self.user_id = id;
                            self.postEvent({event: 'add_user'});
                            $('.signin_screen').hide();
                            $('.game_screen').show();
                        }
                        else {
                            $('div.signin_error').text(
                                "'" + id + "' is an invalid email address"
                            );
                        }
                    }
                    catch(e) {}
                    return false;
                }
            );
    },

    rollDice: function() {
        dice = this.getDice();
        var $slots = $('table.game_board td');
        for (var i = 16; i > 0; i--) {
            var ii = parseInt(Math.random() * i);
            var die = dice.splice(ii, 1)[0];
            var iii = parseInt(Math.random() * 6);
            $slots[i - 1].textContent = die[iii];
        }
    },

    checkWord: function(word) {
        return true;
    },

    signOff: function() {
        window.location.reload(); 

    },

    // XXX
    debugHooks: function() {
        var self = this;

        $('.roll_dice').click(function() {
            self.rollDice();
            return false;
        });

        $('.sign_off').click(function() {
            self.signOff();
            return false;
        });
    },

    postEvent: function(event) {
        event.user_id = this.user_id;
        event.client_id = this.client_id;
        event.type = 'event';
        $.ajax({
            url: "/post",
            data: event,
            type: 'post',
            dataType: 'json',
            success: function(r) { }
        });
    },

    startLongPoll: function() {
        var self = this;
        $.ev.handlers.event = function(event) {
            console.log(event['event'], event.client_id);
            var handler = self['handle_' + event['event']];
            if (handler) {
                handler.call(self, event);
            }
        };
        $.ev.loop('/poll?client_id=' + this.client_id);
    },

    handle_add_user: function(event) {
        var id = event.user_id;
        $('table.user_list tr')
            .each(function() {
                $(this).append('<td></td>');
            });
        var url = "http://www.gravatar.com/avatar/" + $.md5(id);
        var html =
            '<img src="' + url +
            '" alt="' + id +
            '" title="' + id +
            '" />';
        $('table.user_list tr').eq(0)
            .find('td:last').get(0).innerHTML = html;
    },

    handle_remove_user: function(event) {
        var id = event.user_id;

        $('table.user_list tr:first td img')
            .each(function(i) {
                if ($(this).attr('alt') == id) {
                    $('table.user_list tr')
                        .find('td:eq(' + (i + 1) + ')')
                        .remove();
                }
            });
    },

    'The': 'End'
};
