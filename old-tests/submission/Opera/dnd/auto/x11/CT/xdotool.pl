sub Cycle
	{my $c = (@_)?shift:1;
	for my $i (1..$c)
		{system("xdotool key alt+Tab");}
	}
sub KeyPress
	{if(@_ and Alive())
		{my $key = KeyName(shift);
		system("xdotool key $key");}
	}
sub KeyDown
	{if(@_ and Alive())
		{my $key = KeyName(shift);
		system("xdotool keydown $key");}
	}
sub KeyUp
	{if(@_ and Alive())
		{my $key = KeyName(shift);
		system("xdotool keyup $key");}
	}
sub Keys
	{if(@_ and Alive())
		{my $key = pop;
		my @keys = @_;
		for my $k (@keys)
			{my $k = KeyName($k);
			system("xdotool keydown $k");}
		@keys = reverse(@keys);
		if($key =~ /\x00(.*)/)
			{system("xdotool key $1");}
		else
			{KeyStrokes($key);}
		for my $k (@keys)
			{my $k = KeyName($k);
			system("xdotool keyup $k");}
		}
	}
sub KeyStrokes
	{my ($key,$type) = (shift,'');
	for my $i (0..length($key)-1)
		{my $k = substr($key,$i,1);
		if($k eq "'")
			{if($type)
				{system("xdotool type '$type'");}
			system("xdotool key apostrophe");;
			$type = '';}
		else
			{$type .= $k;}
		}
	if($type)
		{system("xdotool type '$type'");}
	}
sub KeyName
	{my $key = shift;
	if($key =~ /\x00(.*)/)
		{return $1;}
	elsif($key eq "'")
		{return 'apostrophe';}
	else
		{return $key;}
	}
sub Click
	{if(Alive())
		{my $n = (int(@_) == 3)?pop:1;
		my ($x,$y) = AbsoluteXY(@_);
		system("xdotool mousemove --sync $x $y click --repeat $n --delay 50 1");}
	}
sub MouseClick
	{if(Alive())
		{my $button = (int(@_) == 3)?pop:1;
		my ($x,$y) = AbsoluteXY(@_);
		system("xdotool mousemove --sync $x $y click $button");}
	}
sub MouseDown
	{my $button = (int(@_) == 1)?shift:1;
	system("xdotool mousedown $button");}
sub MouseUp
	{my $button = (int(@_) == 1)?shift:1;
	system("xdotool mouseup $button");}
sub MouseMove
	{if(Alive())
		{if(int(@_) == 4)
			{my ($startX,$startY,$stopX,$stopY) = AbsoluteXY(@_);
			my ($moveX,$moveY) = ($stopX-$startX,$stopY-$startY);
			my $n = (abs($moveX) >= abs($moveY))?abs($moveX):abs($moveY);
			if($n != 0)
				{for(my $i = 0; $i != $n+1; $i++)
					{my ($x,$y) = ($startX + int($moveX*$i/$n),$startY + int($moveY*$i/$n));
					system("xdotool mousemove --sync $x $y");}
				}
			else
				{my ($x,$y) = (AbsoluteXY(splice(@_,0,2)));
				system("xdotool mousemove --sync $x $y");}
			}
		elsif(int(@_) == 2)
			{my ($x,$y) = (AbsoluteXY(@_));
			system("xdotool mousemove --sync $x $y");}
		}
	}