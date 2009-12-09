(Browgle = function(){}).prototype = {

    currentUsers: [],

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

    setup: function() {
        this.xxxHooks();

        $('table.game_board td')
            .each( function(){this.innerHTML = "&nbsp;"} )
            .height(50)
            .width(50);

        var id = $.cookie('user_id');
        if ( !id ) {
            this.getIdentity();
        }
        else {
            this.postIdentity(id);
        }
    },

    postIdentity: function(id) {
        this.showIdentity(id);
    },

    showIdentity: function(id) {
        $('.user_list_pane').show();
        $('table.user_list tr')
            .each(function() {
                $(this).append('<td></td>');
            });
        $('table.user_list tr').eq(0).find('td:last').get(0).innerHTML =
            '<b>' + id + '</b>';
    },

    getIdentity: function() {
        var self = this;
        $('.signin_pane').show();
        $('input.user_id')
            .val('')
            .focus();
        $('form.user_id')
            .unbind('submit')
            .submit(
                function() {
                    var id = $(this).find('input').val();
                    if (id.match(/^[\w\.\-]+@[\w\.\-]+\.\w{2,4}$/)) {
                        $.cookie('user_id', id);
                        $('.signin_pane').hide();
                        self.addUser(id);
                        self.showIdentity(id);
                    }
                    else {
                        $('div.user_id_error').text(
                            "'" + id + "' is an invalid email address"
                        );
                    }
                    return false;
                }
            );
    },

    addUser: function(id) {
        $('.user_list_pane').show();
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
        var id = $.cookie('user_id');

        $('table.user_list tr:first td')
            .each(function(i) {
                if (this.textContent == id) {
                    $('table.user_list tr')
                        .find('td:eq(' + i + ')')
                        .remove();
                }
            });
                    
        $.cookie('user_id', null);
        $('.user_list_pane').hide();
        this.getIdentity();
    },

    xxxHooks: function() {
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

    'The': 'End'
};
