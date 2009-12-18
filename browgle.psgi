use strict;
use warnings;
use Tatsumaki::Error;
use Tatsumaki::Application;
use Time::HiRes;

package MessageQueue;
use base qw(Tatsumaki::MessageQueue);

sub append_backlog {
    my($self, @events) = @_;
    $self->backlog([]);
}

package PollHandler;
use base qw(Tatsumaki::Handler);
__PACKAGE__->asynchronous(1);

sub get {
    my ($self) = @_;
    my $mq = MessageQueue->instance('Browgle');
    my $client_id = $self->request->param('client_id')
        or Tatsumaki::Error::HTTP->throw(500, "'client_id' needed");
    $mq->poll_once($client_id, sub { $self->on_new_event(@_) });
}

sub on_new_event {
    my ($self, @events) = @_;
    $self->write(\@events);
    $self->finish;
}

package PostHandler;
use base qw(Tatsumaki::Handler);
sub post {
    my ($self) = @_;

    my $v = $self->request->params;
    $v->{time} = scalar Time::HiRes::gettimeofday;
    $v->{address} = $self->request->address;
    my $mq = MessageQueue->instance('Browgle');
    $mq->publish($v);
    $self->write({ success => 1 });
}

package WordHandler;
use base qw(Tatsumaki::Handler);

sub post {
    my ($self) = @_;
    my $word = $self->request->param('word');
    $word =~ s/(\W|_)//g; #get rid of non-alphanumeric characters to prevent injection attacks;
    my $result = int( check_word($word) );
    $self->write({ success => $result });
}      

sub check_word {
    my $word = uc(shift);
    my $dict = "./dict";
    return `grep \^$word\$ $dict` ne "";
}

package GetHandler;
use base qw(Tatsumaki::Handler);

sub get {
    my ($self) = @_;
    $self->render('browgle.html');
}

package main;
use File::Basename;

my $app = Tatsumaki::Application->new([
    "/poll" => 'PollHandler',
    "/post" => 'PostHandler',
    "/word" => 'WordHandler',
    "/" => 'GetHandler',
]);

# $app->template_path(dirname(__FILE__) . "/template");
$app->template_path(dirname(__FILE__));
$app->static_path(dirname(__FILE__) . "/static");

return $app;
