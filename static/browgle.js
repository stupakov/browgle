/*
 * Browgle - A browser-based, multi-user B*ggle game.
 * 
 * Copyright (c) 2009 Alex Stupakov <stupakov@gmail.com>, Ingy döt Net <ingy@ingy.net>
 * Licensed under the MIT License.
 * See the License file.
 */

function XXX() { console.log.apply(this, arguments) }

(Browgle = function(){}).prototype = {


    // add user to users [] and   user-client mapping 
    setup: false,
    busy: false,
    user_id: null,
    client_id: String(Math.random()),
    state: {
        users: [],
        players: []
    },

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
        $('table.game_board td')
            .height(50)
            .width(50);

        this.startLongPoll();

        this.showSigninScreen();

        this.addEventHandlers();
    },

    showSigninScreen: function() {
        var self = this;

        $('.game_screen').hide();
        $('.signin_screen').show();
        setTimeout(function() {
            $('.signin_screen input').focus();
        }, 500);

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
                            self.postEvent({event: 'request_state'});
                            $('.signin_screen').hide();
                            $('.game_screen').show();
                            setTimeout(function() { self.setupFirstUser() }, 1000);
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

    setupFirstUser: function() {
        if (this.setup) return;

        this.addUser(this.user_id, this.client_id);

        this.setup = true;
    },

    signOff: function() {
        window.location.reload(); 

    },

    addEventHandlers: function() {
        var self = this;

        $('.game_begin input')
            .click(function() {
                self.postEvent({event: 'start_game'});
                return false;
            });

        $('.roll_dice').click(function() {
            self.rollDice();
            return false;
        });

        $('.sign_off').click(function() {
            self.signOff();
            return false;
        });

        onunload = function() {
            if (self.setup) {
                self.postEvent({event: 'remove_user'});
            }
            return false;
        }
    },

    masterUser: function() {
        return (this.client_id == this.state.users[0].client_id);
    },

    addUser: function(user_id, client_id) {
        var self = this;

        var user = {
            user_id: user_id,
            client_id: client_id
        };
        this.state.users.push(user);
       
        var url = "http://www.gravatar.com/avatar/" + $.md5(user_id);
        var html =
            '<img src="' + url +
            '" alt="' + user_id +
            '" title="' + user_id +
            '" />';

        $('table.people')
            .append('<tr><td>' + html + '</td></tr>')
            .find('tr:last')
            .each(function() {
                user.people_row = this;
                if (! self.masterUser()) return;
                $(this).click(function() {
                    self.postEvent({
                        event: 'add_player',
                        player_id: client_id
                    });
                });
            })
    },

    removeUser: function(client_id) {
        var user = this.getUser(client_id);
        if (!user) return;
        var ii = user.num;

        this.state.users.splice(ii - 1, 1);

        if (user.player_td) {
            var col = $(user.player_td).prevAll('td').size();
            $('table.user_list tr').find('td:eq(' + col + ')')
                .remove();
            this.state.players.splice(col - 1, 1);
        }

        $('table.people')
            .find('tr:eq(' + (ii - 1) + ')')
            .remove();

        if( this.state.users.length < 2 ) {
            $('.game_begin').hide();
        }

    },

    addPlayer: function(player_id) {
        var user = this.getUser(player_id);
        if (user.player_td) return;

        var tr = user.people_row;
        var html = $(tr).find('td:eq(0)').html();

        user.player_td = $('table.user_list tr:eq(0)')
            .each(function() {
                $(this).append('<td>' + html + '</td>');
            })
            .find('td:last')[0];

        this.state.players.push(player_id);
    
        if (this.state.players.length >= 2) {
            $('.game_begin').show();
        }
    },

    getUser: function(client_id) {
        for (var i = 0, l = this.state.users.length; i < l; i++) {
            var user = this.state.users[i];
            if (user.client_id == client_id) {
                user.num = i + 1;
                return user;
            }
        }
        return null;
    },

    rollDice: function() {
        dice = this.getDice();
        roll = [];
        for (var i = 16; i > 0; i--) {
            var ii = parseInt(Math.random() * i);
            var die = dice.splice(ii, 1)[0];
            var iii = parseInt(Math.random() * 6);
            roll.push(die[iii]);
        }
        this.postEvent({
            event: 'dice_roll',
            'roll': $.toJSON(roll)
        });
    },

    checkWord: function(word) {
        return true;
    },

// Server communication
    postEvent: function(event) {
        XXX('Posting event: ' + event.event);
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
            XXX(event['event'], event.client_id, event);
            var handler = self['handle_' + event['event']];
            if (handler) {
                handler.call(self, event);
            }
        };
        $.ev.loop('/poll?client_id=' + this.client_id);
    },

// Message handlers
    handle_request_state: function(event) {
        if (this.setup &&
            this.state.users[0].client_id == this.client_id
        ) {
            this.postEvent({
                event: 'current_state',
                state: $.toJSON(this.state),
                for_client: event.client_id
            });
        }
    },

    handle_current_state: function(event) {
        if (this.setup || event.for_client != this.client_id) return;
        var state = $.evalJSON(event.state);
        for (var i = 0, l = state.users.length; i < l; i++) {
            var user = state.users[i];
            this.addUser(user.user_id, user.client_id);
        }
        for (var i = 0, l = state.players.length; i < l; i++) {
            this.addPlayer(state.players[i]);
        }
        this.setup = true;
        this.postEvent({event: 'add_user'});
    },
            

    handle_add_user: function(event) {
        this.addUser(event.user_id, event.client_id);
    },

    handle_remove_user: function(event) {
        this.removeUser(event.client_id);
    },

    handle_add_player: function(event) {
        this.addPlayer(event.player_id);
    },

    handle_start_game: function(event) {
        var self = this;
        $('.game_begin').hide();
        $('.game_title').hide();
        $('.word_input').show();
        this.rollDice();

        setTimeout(function() {
            $('.word_input input').focus();
        }, 1000);

        $('.word_input')
            .submit(function() {
                var word = $(this).find('input').val();
                if (! word.length) return;
                $(this).val('');
                self.postEvent({
                    event: 'add_word',
                    'word': word
                });
                return false;
            })
    },

    handle_dice_roll: function(event) {
        var roll = $.evalJSON(event.roll);
        var $slots = $('table.game_board td');
        for (var i = 0, l = roll.length; i < l; i++) {
            $slots[i].textContent = roll[i];
        }
    },

    handle_add_word: function(event) {
        var word = event.word;
        XXX(word);
    },

    'The': 'End'
};
