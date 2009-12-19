/* To Do:
 *
 * Add word to list
 * Capture keystrokes for user input
 * Write a wordchecker function
 *
 */

/*
 * Browgle - A browser-based, multi-user B*ggle game.
 * 
 * Copyright (c) 2009 Alex Stupakov <stupakov@gmail.com>, Ingy döt Net <ingy@ingy.net>
 * Licensed under the MIT License.
 * See the License file.
 */

function XXX() {
    if (typeof(window.console) != 'undefined')
        console.log.apply(this, arguments)
}

Array.prototype.map = function(f) {
    var a = [];
    for (var i = 0, l = this.length; i < l; i++) {
        var e = f.call(this[i]);
        if (typeof(e) != 'undefined') {
            a.push(e);
        }
    }
    return a;
};

Array.prototype.grep = function(f) {
    var a = [];
    for (var i = 0, l = this.length; i < l; i++) {
        if (f.call(this[i])) {
            a.push(this[i]);
        }
    }
    return a;
};

(Browgle = function(){}).prototype = {

    is_setup: false,
    user_id: String(Math.random()),
    user_email: null,
    state: {
        users: [],
        players: [],
        game: {
            is_playing: false,
            dice_roll: [],
            words: [],
            played: {}
        }
    },
    user_info: {},
    letter_lookup: {},
    neighbors: {},

    init: function() {
        this.startLongPoll();
        this.showSigninScreen();
        this.addEventHandlers();
        this.setNeighbors();
    },

    setNeighbors: function() {
        var neighbors = this.neighbors;
        var offsets = [ [-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1] ];
        for (var i = 0; i < 16; i++) {
            var row = parseInt(i / 4);
            var col = i % 4;
            neighbors[i] = {};
            for (var o = 0; o < 8; o++) {
                var nrow = row + offsets[o][0];
                var ncol = col + offsets[o][1];
                if (nrow >= 0 && nrow <= 3 && ncol >= 0 && ncol <= 3) {
                    neighbors[i][nrow * 4 + ncol] = true;
                }
            }
        }
    },

    showSigninScreen: function() {
        var self = this;

        $('input.user_email').val('').focus();
        $('.word_input input').val('');
        $('.chat_input input').val('');

        $('form.signin')
            .unbind('submit')
            .submit(
                function() {
                    var email = $(this).find('input').val();
                    if (email.match(/^[\w\.\-]+@[\w\.\-]+\.\w{2,4}$/)) {
                        self.user_email = email;
                        self.postEvent({event: 'request_state'});
                        $('.signin_screen').hide();
                        $('.chat_messages').height(500);
                        $('table.game_board td')
                            .height(50)
                            .width(50);
                        $('.game_screen').show();
                        setTimeout(function() { self.setupFirstUser() }, 1000);
                    }
                    else {
                        $('div.signin_error').text(
                            "'" + email + "' is an invalid email address"
                        );
                    }
                    return false;
                }
            );
    },

    setupFirstUser: function() {
        if (this.is_setup) return;
        this.addUser(this.user_id, this.user_email);
        this.is_setup = true;
        // $('.game_begin input').click();
        $('.game_begin').show();
    },

    signOff: function() {
        if (this.is_setup) {
            if (this.getUser(this.user_id).is_player) {
                this.postEvent({
                    event: 'remove_player',
                    player_id: this.user_id
                });
            }
            this.postEvent({event: 'remove_user'});
        }
    },

    addEventHandlers: function() {
        var self = this;

        $('.chat_input')
            .submit(function() {
                try {
                var msg = $(this).find('input').val();
                $(this).find('input').val('').focus();
                self.postEvent({
                    event: 'chat_msg',
                    msg: msg
                });
                }catch(e) {console.log('ERROR:', e)}
                return false;
            });

        $('.game_begin input')
            .click(function() {
                self.postEvent({event: 'start_game'});
                self.rollDice();
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
            self.signOff();
            return false;
        }
    },

    isMasterUser: function() {
        return (this.user_id == this.state.users[0].user_id);
    },

    genImageHtml: function(email, id) {
        return '<img src="' +
            'http://www.gravatar.com/avatar/' + $.md5(email) +
            '" alt="' + email +
            '" title="' + email + ' - (' + id +
            ')" />';
    },

    addUser: function(user_id, user_email) {
        var self = this;

        var user = {
            user_id: user_id,
            user_email: user_email
        };
        this.state.users.push(user);
        this.user_info[user_id] = {};
       
        var img_html = this.genImageHtml(user_email, user_id);
        $('table.users')
            .append('<tr><td>' + img_html + '</td></tr>')
            .find('tr:last')
            .each(function() {
                if (! self.isMasterUser()) return;
                $(this).click(function() {
                    if (self.state.game.is_playing) return;
                    self.postEvent({
                        event: 'add_player',
                        player_id: user_id
                    });
                });
            })
    },

    removeUser: function(user_id) {
        var user = this.getUser(user_id);
        if (!user) return;
        var ii = user.user_num;

        this.state.users.splice(ii - 1, 1);
        delete(this.user_info[user_id]);

        $('table.users')
            .find('tr:eq(' + (ii - 1) + ')')
            .remove();
    },

    addPlayer: function(player_id) {
        var self = this;

        var user = this.getUser(player_id);
        if (user.is_player) return;

        var email = user.user_email;
        var html = this.genImageHtml(email, player_id);

        var td = this.user_info[player_id].player_td = $('table.players tr:eq(0)')
            .each(function() {
                $(this).append('<td>' + html + '</td>');
            })
            .find('td:last')[0];

        if (this.isMasterUser()) {
            $(td)
                .click(function() {
                    if (self.state.game.is_playing) return;
                    self.postEvent({
                        event: 'remove_player',
                        player_id: player_id
                    });
                });
        }

        this.state.players.push(player_id);
    
        if (this.state.players.length >= 2) {
            $('.game_begin').show();
        }
    },

    removePlayer: function(user_id) {
        var user = this.getUser(user_id);
        if (!(user && user.is_player)) return;

        var col = user.player_num;
        $('table.players tr')
            .find('td:eq(' + (col - 1) + ')')
            .remove();
        this.state.players.splice((col - 1), 1);
        delete this.user_info[user_id].player_td;

        if( this.state.players.length < 2 ) {
            $('.game_begin').hide();
        }
    },

    getUser: function(user_id) {
        for (var i = 0, l = this.state.users.length; i < l; i++) {
            var user = this.state.users[i];
            if (user.user_id == user_id) {
                user.user_num = i + 1;
                var td = this.user_info[user_id].player_td;
                user.is_player = Boolean(td);
                if (user.is_player) {
                    user.player_num = $(td).prevAll('td').size() + 1;
                }
                return user;
            }
        }
        return null;
    },

    getDice: function() {
        return [
            ['A', 'A', 'C', 'I', 'O', 'T'],
            ['A', 'B', 'I', 'L', 'T', 'Y'],
            ['A', 'B', 'J', 'M', 'O', 'Q'], //'Qu'],
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

    rollDice: function() {
        dice = this.getDice();
        roll = [];
        for (var i = 16; i > 0; i--) {
            var ii = parseInt(Math.random() * i);
            var die = dice.splice(ii, 1)[0];
            var iii = parseInt(Math.random() * 6);
            roll.push(die[iii]);
        }
        // roll = ['A', 'B', 'C', 'D','A', 'B', 'C', 'D','A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'];
        this.postEvent({
            event: 'dice_roll',
            'roll': $.toJSON(roll)
        });
    },

    insertDice: function(roll) {
        var $slots = $('table.game_board td');
        for (var i = 0, l = roll.length; i < l; i++) {
            $slots[i].textContent = roll[i];
        }

        for (var i = 0 ; i < 16; i++) {
            var letter = roll[i];
            if (! this.letter_lookup[letter]) {
                this.letter_lookup[letter] = [];
            }
            this.letter_lookup[letter].push(i);
        }
    },

    checkWord: function(word) {
        var paths = [[]];
        var lookup = this.letter_lookup;
        var neighbors = this.neighbors;
        for (var i = 0, l = word.length; i < l; i++) {
            var letter = word[i];
            if (! lookup[letter]) return false;
            var nums = lookup[letter];
            
            var paths2 = [];
            for (var ii = 0, ll = nums.length; ii < ll; ii++) {
                var p = function() {
                    if (i == 0 || (
                        neighbors[this[i - 1]][nums[ii]] &&
                        !(this.grep(function() { return(this == nums[ii]) }).length)
                    )) {
                        return this.concat(nums[ii]);
                    }
                }
                var a = paths.map(p);
                paths2 = paths2.concat(a);
            }
            paths = paths2;
            if (! paths.length) return false;
        }
        // XXX(paths);
        return paths[0];
    },

// Server communication
    postEvent: function(event) {
        // XXX('Posting event: ' + event.event);
        event.client_id = this.user_id;
        event.user_id = this.user_id;
        event.user_email = this.user_email;
        event.type = 'event';
        $.ajax({
            url: '/games/' + this.room + '/post',
            data: event,
            type: 'post',
            dataType: 'json',
            success: function(r) { }
        });
    },

    startLongPoll: function() {
        var self = this;
        $.ev.handlers.event = function(event) {
            // XXX(event['event'], event.user_id, event);
            var handler = self['handle_' + event['event']];
            if (handler) {
                handler.call(self, event);
            }
        };
        $.ev.loop('/games/' + this.room + '/poll?client_id=' + this.user_id);
    },

// Message handlers
    handle_request_state: function(event) {
        if (this.is_setup &&
            this.state.users[0].user_id == this.user_id
        ) {
            this.postEvent({
                event: 'current_state',
                state: $.toJSON(this.state),
                for_user: event.user_id
            });
        }
    },

    handle_current_state: function(event) {
        if (this.is_setup || event.for_user != this.user_id) return;
        var state = $.evalJSON(event.state);
        for (var i = 0, l = state.users.length; i < l; i++) {
            var user = state.users[i];
            this.addUser(user.user_id, user.user_email);
        }
        for (var i = 0, l = state.players.length; i < l; i++) {
            this.addPlayer(state.players[i]);
        }
        if (state.game.dice_roll.length) {
            this.insertDice(state.game.dice_roll);
        }
        this.is_setup = true;
        this.postEvent({event: 'add_user'});
    },
            

    handle_chat_msg: function(event) {
        var user = this.getUser(event.user_id); 
        var email = user.user_email;
        var id = user.user_id;
        var html = '<span class="msg">' + this.genImageHtml(email, id) + '&nbsp;' +
            event.msg + '</span><br />';
        $('.chat_messages').prepend(html);
    },

    handle_add_user: function(event) {
        this.addUser(event.user_id, event.user_email);
    },

    handle_remove_user: function(event) {
        this.removePlayer(event.user_id);
        this.removeUser(event.user_id);
    },

    handle_add_player: function(event) {
        this.addPlayer(event.player_id);
    },

    handle_remove_player: function(event) {
        this.removePlayer(event.player_id);
    },

    handle_start_game: function(event) {
        var self = this;
        $('.game_begin').hide();
        $('.game_title').hide();
        $('.chat_input').hide();
        $('.word_input').show();
        var $picture_row = $('table.players tr:first');
        var $score_row = $('table.players').prepend("<tr></tr>").find('tr:first');
        $picture_row.find('td').each(function() {
            $score_row.append('<td class="total_score">0</td>');
        });
        setTimeout(function() {
            $('.word_input input').focus();
        }, 1000);

        this.startKeyPress();

        this.state.game.is_playing = true;
    },

    handle_dice_roll: function(event) {
        var roll = this.state.game.dice_roll = $.evalJSON(event.roll);
        this.insertDice(roll);
    },

    handle_add_word: function(event) {
        var word = event.word;
        this.state.game.played[word] = true;
        var user = this.getUser(event.user_id);
        var col = user.player_num;
        var $table = $('table.players');
        var $last_row = $table.find('tr:last');
        var $td = $last_row.find('td:eq(' + (col - 1) + ')');
        if ($td.html() != "") {
            var a = [];
            $last_row
                .find('td')
                .each(function() { a.push(this) });
            
            var html = '<tr>' +
                    a.map(function() {return '<td></td>'})
                    .join('') +
                    '</tr>';
            $table.append(html)
        }
        var points = (({3:1, 4:1, 5:2, 6:3, 7:5})[word.length] || 11);
        try {
            $table.find('tr').find('td:eq(' + (col - 1) + ')')
                .each(function() {
                    if ($(this).html() == "") {
                        $(this).html(
                            '<span class="word">' + word +
                            '</span><span class="points">' + 
                            points +
                            '</span>'
                        );
                        throw("word inserted. see ya");
                    }
                })
        }
        catch(e) {}
        var $total_td = $table.find('tr:first').find('td:eq(' + (col - 1) + ')');
        $total_td.text(parseInt($total_td.text()) + points);
    },

    startKeyPress: function() {
        var self = this;
        document.onkeypress = function (e) {
            var key;
            if (e == null) {
                // IE
                key = event.keyCode
            }
            else {
                // Mozilla
                if (e.altKey || e.ctrlKey || e.metaKey) {
                    return true
                }
                key = e.charCode || e.keyCode;
            }
            
            if ( ( key >= 65 && key <= 90 )  || (key >= 97 && key <= 122 ) ) {
                if (key > 90) key -= 32;
                var letter = String.fromCharCode( key );
                var word = $('form.word_input input').val();
                var new_word = word + letter;
                var path = self.checkWord(new_word);
                // XXX('check', new_word, path);
                if (path) {
                    $('form.word_input input').val(new_word);
                    var $cells = $('table.game_board td').css('background-color', '#FFF');
                    for (var i = 0; i < path.length; i++) {
                        $($cells[path[i]]).css('background-color', '#888');
                    }
                }
                else {
                    self.flashInput();
                }
            }
            else if (key == 8) {
                var word = $('form.word_input input').val();
                word = word.substr(0, word.length - 1);
                $('form.word_input input').val(word);
                var $cells = $('table.game_board td').css('background-color', '#FFF');
                if (word.length > 0) {
                    var path = self.checkWord(word);
                    for (var i = 0; i < path.length; i++) {
                        $($cells[path[i]]).css('background-color', '#888');
                    }
                }
            }
            else if (key == 13) {
                var word = $('form.word_input input').val();
                $('form.word_input input').val('');
                var $cells = $('table.game_board td').css('background-color', '#FFF');
                if (word.length < 3 || self.state.game.played[word]) {
                    self.flashInput();
                    return false;
                }
                $.ajax({
                    url: "/word_lookup",
                    data: {word: word},
                    type: 'post',
                    dataType: 'json',
                    success: function(r) {
                        if (r.success) {
                            self.postEvent({
                                event: 'add_word',
                                'word': word
                            });
                        }
                        else {
                            self.flashInput();
                        }
                    }
                });
            }
            else {
                self.goto_number = '';
            }
            return false;
        };
    },

    flashInput: function() {
        $('form.word_input input').css('background-color', 'red');
        setTimeout(function() {
            $('form.word_input input').css('background-color', 'white');
        }, 200);
    },

    'The': 'End'
};
