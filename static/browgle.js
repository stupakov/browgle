jQuery(function(){ setup() });

function setup() {
    $('table#playfield td')
        .each( function(){this.innerHTML = "&nbsp;"} )
        .height(50);

    var ident = $.cookie('ident');
    if ( !ident ) {
        getIdentity();
    }
    else {
        postIdentity(ident);
    }
}

function postIdentity(ident) {
    showIdentity(ident);
}

function showIdentity(ident) {
    $('#user-list-div').show();
    $('table#user-list-table tr')
        .each(function() {
            $(this).append('<td></td>');
        });
    $('table#user-list-table tr:eq(0) td:last').get(0).innerHTML = ident;
}

function getIdentity() {
    $('#signin-div').show();
    $('input#ident')
        .val('')
        .focus()
        .blur(
            function() {
                var ident = this.value;
                if (ident.match(/[\w\.]+@[\w\.]+/)) {
                    $.cookie('ident', ident);
                    $('#signin-div').hide();
                    addUser(ident);
                }
            }
        )
}

function addUser(ident) {
    $('#user-list-div').show();
}

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
}
