use strict;
use warnings;
use Tatsumaki::Error;
use Tatsumaki::Application;
use Time::HiRes;

package PollHandler;
use base qw(Tatsumaki::Handler);
__PACKAGE__->asynchronous(1);

use Tatsumaki::MessageQueue;

sub get {
    my($self, $channel) = @_;
    my $mq = Tatsumaki::MessageQueue->instance($channel);
    my $client_id = $self->request->param('client_id')
        or Tatsumaki::Error::HTTP->throw(500, "'client_id' needed");
    $client_id = rand(1) if $client_id eq 'dummy'; # for benchmarking stuff
    $mq->poll_once($client_id, sub { $self->on_new_event(@_) });
}

sub on_new_event {
    my($self, @events) = @_;
    $self->write(\@events);
    $self->finish;
}

package MultipartPollHandler;
use base qw(Tatsumaki::Handler);
__PACKAGE__->asynchronous(1);

sub get {
    my($self, $channel) = @_;

    my $client_id = $self->request->param('client_id') || rand(1);

    $self->multipart_xhr_push(1);

    my $mq = Tatsumaki::MessageQueue->instance($channel);
    $mq->poll($client_id, sub {
        my @events = @_;
        for my $event (@events) {
            $self->stream_write($event);
        }
    });
}

package PostHandler;
use base qw(Tatsumaki::Handler);
use HTML::Entities;
use Encode;

sub post {
    my($self, $channel) = @_;

    my $v = $self->request->params;
    my $html = $self->format_message($v->{text});
    my $mq = Tatsumaki::MessageQueue->instance($channel);
    $mq->publish({
        type => "message", html => $html, ident => $v->{ident},
        avatar => $v->{avatar}, name => $v->{name},
        address => $self->request->address,
        time => scalar Time::HiRes::gettimeofday,
    });
    $self->write({ success => 1 });
}

sub format_message {
    my($self, $text) = @_;
    $text =~ s{ (https?://\S+) | ([&<>"']+) }
              { $1 ? do { my $url = HTML::Entities::encode($1); qq(<a target="_blank" href="$url">$url</a>) } :
                $2 ? HTML::Entities::encode($2) : '' }egx;
    $text;
}

package GetHandler;
use base qw(Tatsumaki::Handler);

sub get {
    my($self, $channel) = @_;
    $self->render('browgle.html');
}

package main;
use File::Basename;

my $app = Tatsumaki::Application->new([
    "/poll" => 'PollHandler',
    "/mxhrpoll" => 'MultipartPollHandler',
    "/post" => 'PostHandler',
    "/" => 'GetHandler',
]);

# $app->template_path(dirname(__FILE__) . "/template");
$app->template_path(dirname(__FILE__));
$app->static_path(dirname(__FILE__) . "/static");

return $app;
