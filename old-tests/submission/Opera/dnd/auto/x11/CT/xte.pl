my $inverseDragSpeed = 5000;
sub Cycle
	{my $c = (@_)?shift:1;
	system("xte 'keydown Alt_L' 'usleep 50000' ".("'key Tab'  'usleep 50000' "x$c)."'keyup Alt_L'");}
sub KeyPress
	{if(@_ and Alive())
		{my $key = KeyName($_[0]);
		system("xte 'key $key' 'usleep 50000'");}
	}
sub KeyDown
	{if(@_ and Alive())
		{my $key = KeyName($_[0]);
		system("xte 'keydown $key' 'usleep 50000'");}
	}
sub KeyUp
	{if(@_ and Alive())
		{my $key = KeyName($_[0]);
		system("xte 'keyup $key' 'usleep 50000'");}
	}
sub Keys
	{if(@_ and Alive())
		{my ($command,$key) = ('xte',pop);
		my @keys = @_;
		for my $k (@keys)
			{$k = KeyName($k);
			$command .= " 'keydown $k' 'usleep 50000'";}
		@keys = reverse(@keys);
		if($key =~ /\x00(.*)/)
			{$command .= " 'key $1' 'usleep 50000'";}
		else
			{$key = EscapeChars($key);
			$command .= " $key";}
		for my $k (@keys)
			{$k = KeyName($k);
			$command .= " 'keyup $k' 'usleep 50000'";}
		system("$command");}
	}
sub EscapeChars
	{my ($key,$str,$command) = (shift,'','');
	for my $i (0..length($key)-1)
		{my $k = substr($key,$i,1);
		if($k eq "'")
			{if($str)
				{$command .= "'str $str' ";}
			$command .= "'key apostrophe' ";
			$str = '';}
		elsif($k eq '\\')
			{if($str)
				{$command .= "'str $str' ";}
			$command .= "'key backslash' ";
			$str = '';}
		else
			{$str .= $k;}
		}
	if($str)
		{$command .= "'str $str' ";}
	return $command."'usleep 50000'";}
sub KeyName
	{my $key = shift;
	if($key =~ /\x00(.*)/)
		{return $1;}
	elsif($key eq "'")
		{return 'apostrophe';}
	elsif($key eq '\\')
		{return 'backslash';}
	else
		{return $key;}
	}
sub Click
	{if(Alive())
		{my $n = (int(@_) == 3)?pop:1;
		my ($x,$y) = AbsoluteXY(@_);
		my $events = "'mousemove $x $y' 'usleep 50000'";
		for my $i (1..$n)
			{$events .= " 'mouseclick 1' 'usleep 50000'";}
		system("xte $events");}
	}
sub MouseClick
	{if(Alive())
		{my $button = (int(@_) == 3)?pop:1;
		my ($x,$y) = AbsoluteXY(@_);
		system("xte 'mousemove $x $y' 'usleep 50000' 'mouseclick $button' 'usleep 50000'");}
	}
sub MouseDown
	{my $button = (int(@_) == 1)?shift:1;
	system("xte 'mousedown $button' 'usleep 50000'");}
sub MouseUp
	{my $button = (int(@_) == 1)?shift:1;
	system("xte 'mouseup $button' 'usleep 50000'");}
sub MouseMove
	{if(Alive())
		{my $events = '';
		if(int(@_) == 4)
			{my ($startX,$startY,$stopX,$stopY) = AbsoluteXY(@_);
			my ($moveX,$moveY) = ($stopX-$startX,$stopY-$startY);
			my $n = (abs($moveX) >= abs($moveY))?abs($moveX):abs($moveY);
			if($n != 0)
				{for(my $i = 0; $i != $n+1; $i++)
					{my ($x,$y) = ($startX + int($moveX*$i/$n),$startY + int($moveY*$i/$n));
					$events .= " 'mousemove $x $y' 'usleep $inverseDragSpeed'";}
				}
			else
				{my ($x,$y) = AbsoluteXY(splice(@_,0,2));
				$events .= " 'mousemove $x $y' 'usleep $inverseDragSpeed'";}
			}
		elsif(int(@_) == 2)
			{my ($x,$y) = AbsoluteXY(@_);
			$events .= " 'mousemove $x $y' 'usleep $inverseDragSpeed'";}
		system("xte$events");}
	}
