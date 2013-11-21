#!/usr/bin/perl
package CT;
use strict;
use warnings;
use Time::HiRes qw(sleep);
my ($winID,$winName,$winX,$winY,$winWidth,$winHeight,$baseURL);
sub GrabWindow
	{$winName = shift;
	Cycle();
	sleep(0.5);
	my $win = `xprop -root _NET_ACTIVE_WINDOW`;
	if($win  =~ / (0x[0-9a-fA-F]+)/)
		{$winID = $1;}
	else
		{die("Can't identify active window.\n");}
	my $winInfo = `xwininfo -id '$1'`;
	if($winInfo  =~ /xwininfo: Window id: .* \"(.*$winName.*)\"/)
		{print "Events will be sent to target window: \n$1\n";
		$winName = $1;
		if($winInfo  =~ /Absolute upper-left X:  (-?[0-9]{1,4})\n.*Absolute upper-left Y:  (-?[0-9]{1,4})/)
			{($winX,$winY) = ($1,$2);}
		else
			{die("Can't retreive window position.\n");}
		if($winInfo  =~ /Width: ([0-9]{1,4})\n.*Height: ([0-9]{1,4})/)
			{($winWidth, $winHeight) = ($1, $2);}
		else
			{die("Can't retreive window size.\n");}
		}
	else
		{die("Please focus target window before running this script.\n");}
	}
sub WinID
	{return $winID;}
sub WinSize
	{return ($winWidth,$winHeight);}
sub Alive
	{if(index(`xprop -root _NET_ACTIVE_WINDOW`,$winID) == -1)
		{Quit("Testing interrupted since target window lost focus.\n");}
	return 1;}
sub BaseURL
	{if(@_)
		{$baseURL = $_[0];}
	elsif($baseURL)
		{return $baseURL;}
	else
		{return '';}
	}
sub WaitSeconds
	{select(undef, undef, undef, shift);}
sub AbsoluteXY
	{my @out;
	for my $i (0..int(@_)-1)
		{$out[$i] = $_[$i] + (($i%2 == 0)?$winX:$winY);}
	return @out}
sub RelativeXY
	{my @out;
	for my $i (0..int(@_)-1)
		{$out[$i] = $_[$i] - (($i%2 == 0)?$winX:$winY);}
	return @out}
sub LeftButton()
	{return 1}
sub RightButton()
	{return 3}
sub MiddleButton()
	{return 2}
do 'CT/xlib.pl';# alternatives are guitest, xdotool, xlib, xte and xtest
do 'CT/xwd.pl';# alternatives are bmp, bmpref, imlib, png, visgrep, xwd and xwdref
do 'CT/keys.pl';
do 'CT/actions.pl';
do 'CT/colors.pl';
do 'CT/results.pl';
1;