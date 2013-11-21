#!/usr/bin/perl
package CT;
use strict;
use warnings;
use Win32::GuiTest;
my ($winID,$winName,$winX,$winY,$winWidth,$winHeight,$baseURL);
sub GrabWindow
	{$winName = shift;
	($winID) = Win32::GuiTest::FindWindowLike(undef,"(?<!\.pl )$winName") or die("Can not find target window.\n");
	$winName = Win32::GuiTest::GetWindowText($winID);
	Win32::GuiTest::SetForegroundWindow($winID);
	my @rect = Win32::GuiTest::GetWindowRect($winID);
	($winX,$winY,$winWidth,$winHeight) = ($rect[0],$rect[1],$rect[2]-$rect[0],$rect[3]-$rect[1]);
	print "Events will be sent to target window: \n$winName\n";}
sub WinID
	{return $winID;}
sub Alive
	{if(Win32::GuiTest::IsWindowVisible($winID))
		{return 1;}
	else
		{Quit("Testing interrupted since target window lost focus.\n");}
	}
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
sub Click
	{if(Alive())
		{my $n = (int(@_) == 3)?pop:1;
		Win32::GuiTest::MouseMoveAbsPix(AbsoluteXY(@_));
		for my $i (1..$n)
			{Win32::GuiTest::SendMouse("{LEFTCLICK}");}
		}
	}
sub MouseClick
	{if(Alive())
		{my $button = (int(@_) == 3)?pop:1;
		Win32::GuiTest::MouseMoveAbsPix(AbsoluteXY(@_));
		if($button == 2)
			{Win32::GuiTest::SendMouse("{MIDDLECLICK}");}
		elsif($button == 3)
			{Win32::GuiTest::SendMouse("{RIGHTCLICK}");}
		else
			{Win32::GuiTest::SendMouse("{LEFTCLICK}");}
		}
	}
sub MouseDown
	{if(@_ and $_[0] == 2)
		{Win32::GuiTest::SendMouse("{MIDDLEDOWN}");}
	elsif(@_ and $_[0] == 3)
		{Win32::GuiTest::SendMouse("{RIGHTDOWN}");}
	else
		{Win32::GuiTest::SendMouse("{LEFTDOWN}");}
	}
sub MouseUp
	{if(@_ and $_[0] == 2)
		{Win32::GuiTest::SendMouse("{MIDDLEUP}");}
	elsif(@_ and $_[0] == 3)
		{Win32::GuiTest::SendMouse("{RIGHTUP}");}
	else
		{Win32::GuiTest::SendMouse("{LEFTUP}");}
	}
sub MouseMove
	{if(Alive())
		{if(int(@_) == 4)
			{my ($startX,$startY,$stopX,$stopY) = AbsoluteXY(@_);
			my ($moveX,$moveY) = ($stopX-$startX,$stopY-$startY);
			my $n = (abs($moveX) >= abs($moveY))?abs($moveX):abs($moveY);
			if($n != 0)
				{for(my $i = 0; $i != $n+1; $i++)
					{Win32::GuiTest::MouseMoveAbsPix($startX + int($moveX*$i/$n),$startY + int($moveY*$i/$n));}
				}
			else
				{Win32::GuiTest::MouseMoveAbsPix(AbsoluteXY(splice(@_,0,2)));}
			}
		elsif(int(@_) == 2)
			{Win32::GuiTest::MouseMoveAbsPix(AbsoluteXY(@_));}
		}
	}
sub LeftButton()
	{return 1}
sub RightButton()
	{return 3}
sub MiddleButton()
	{return 2}
do 'CT/sendkeys.pl';# alternatives are sendkeys and sendrawkey
do 'CT/dibsect.pl';# alternatives are dibsect, dibsectref, printscreen and printscreenref
do 'CT/keys.pl';
do 'CT/actions.pl';
do 'CT/colors.pl';
do 'CT/results.pl';
1;