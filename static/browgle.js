(Browgle = function(){}).prototype = {

    dice: [
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
    ],

    setup: function() {

        $('table.game_board td')
            .each( function(){this.innerHTML = "&nbsp;"} )
            .height(50);

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
        var self = this;
        $('.user_list_pane').show();
        $('table.user_list tr')
            .each(function() {
                $(this).append('<td></td>');
            });
        $('table.user_list tr').eq(0).find('td:last').get(0).innerHTML =
            '<a href="#">' + id + '</a>';
        $('table.user_list a')
            .click(
                function() {
                    $.cookie('user_id', null);
                    $('.user_list_pane').hide();
                    self.getIdentity();
                }
            );
    },

    getIdentity: function() {
        var self = this;
        $('.signin_pane').show();
        $('input.user_id')
            .val('')
            .focus();
        $('form.user_id')
            .submit(
                function() {
                    var id = $(this).find('input').val();
                    if (id.match(/[\w\.]+@[\w\.]+/)) {
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

};

/******************************************** Old Code

var cookieName = 'tatsumaki_chat_ident';
function doPost(el1, el) {
  var ident = el1.attr('value');
  if (ident) $.cookie(cookieName, ident, { path: '/chat' });
  var text = el.attr('value');
  if (!text) return;
  $.ajax({
    url: "/chat/foo/post",
    data: { ident: ident, text: text },
    type: 'post',
    dataType: 'json',
    success: function(r) { }
  });
  el.attr('value', '');
  return;
}

function oldCode() {
  var onNewEvent = function(e) {
    try {
      var src    = e.avatar || ("http://www.gravatar.com/avatar/" + $.md5(e.ident || 'foo'));
      var name   = e.name   || e.ident || 'Anonymous';
      var avatar = $('<img/>').attr('src', src).attr('alt', name);
      if (e.ident) {
        var link = e.ident.match(/https?:/) ? e.ident : 'mailto:' + e.ident;
        avatar = $('<a/>').attr('href', link).attr('target', '_blank').append(avatar);
      }
      avatar = $('<td/>').addClass('avatar').append(avatar);

      var message = $('<td/>').addClass('chat-message');
      if (e.text) message.text(e.text);
      if (e.html) message.html(e.html);
      message.find('a').oembed(null, { embedMethod: "append", maxWidth: 500 });
      var name = e.name || (e.ident ? e.ident.split('@')[0] : null);
      if (name)
        message.prepend($('<span/>').addClass('name').text(name+ ': '));

      var date = new Date(e.time * 1000);
      var meta = $('<td/>').addClass('meta').append(
        '(' +
        '<span class="pretty-time" title="' + date.toUTCString() + '">' + date.toDateString() + '</span>' +
        ' from ' + e.address + ')'
      );
      $('.pretty-time', meta).prettyDate();
      $('#messages').prepend($('<tr/>').addClass('message').append(avatar).append(message).append(meta));
    } catch(e) { if (console) console.log(e) };
  }

  if (typeof DUI != 'undefined') {
    var s = new DUI.Stream();
    s.listen('application/json', function(payload) {
      var event = eval('(' + payload + ')');
      onNewEvent(event);
    });
    s.load('/chat/foo/mxhrpoll');
  } else {
    $.ev.handlers.message = onNewEvent;
    $.ev.loop('/chat/foo/poll?client_id=' + Math.random());
  }

  if ($.cookie(cookieName))
    $('#ident').attr('value', $.cookie(cookieName));

  window.setInterval(function(){ $(".pretty-time").prettyDate() }, 1000 * 30);
  */
