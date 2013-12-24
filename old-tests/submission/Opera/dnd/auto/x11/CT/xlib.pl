use X11::Xlib;
my $display = X11::Xlib->new();
sub Cycle
	{my $c = (@_)?shift:1;
	$display->XTestFakeKeyEvent(64, 1, 50);
	for my $i (1..$c)
		{$display->XTestFakeKeyEvent(23, 1, 50);
		$display->XTestFakeKeyEvent(23, 0, 50);}
	$display->XTestFakeKeyEvent(64, 0, 50);
	$display->XFlush;
	$display->XSync();}
sub KeyPress
	{if(@_ and Alive())
		{my $key = CharToKeyCode(shift);
		$display->XTestFakeKeyEvent($key, 1, 20);
		$display->XTestFakeKeyEvent($key, 0, 20);
		$display->XFlush;
		$display->XSync();}
	}
sub KeyDown
	{if(@_ and Alive())
		{my $key = CharToKeyCode(shift);
		$display->XTestFakeKeyEvent($key, 1, 20);
		$display->XFlush;
		$display->XSync();}
	}
sub KeyUp
	{if(@_ and Alive())
		{my $key = CharToKeyCode(shift);
		$display->XTestFakeKeyEvent($key, 0, 20);
		$display->XFlush;
		$display->XSync();}
	}
sub Keys
	{if(@_ and Alive())
		{my $key = pop;
		my @keys = @_;
		for my $k (@keys)
			{$display->XTestFakeKeyEvent(CharToKeyCode($k), 1, 20);}
		@keys = reverse(@keys);
		if($key =~ /^[A-Z]$/)
			{ShiftKey(lc($key));}
		else
			{if($key =~ /\x00(.*)/)
				{my $key = CharToKeyCode($key);
				$display->XTestFakeKeyEvent($key, 1, 20);
				$display->XTestFakeKeyEvent($key, 0, 20);}
			else
				{for my $i (0..length($key)-1)
					{my $k = substr($key,$i,1);
					if($k =~ /^[A-Z]$/)
						{ShiftKey(lc($k));}
					elsif($k =~ /^[\!\@\#\$\%\^\&\*\(\)_\+\{\}\:"\~\|<>\?]$/)
						{ShiftKey($k);}
					else
						{my $k = CharToKeyCode($k);
						$display->XTestFakeKeyEvent($k, 1, 0);
						$display->XTestFakeKeyEvent($k, 0, 0);}
					}
				}
			}
		for my $k (@keys)
			{$display->XTestFakeKeyEvent(CharToKeyCode($k), 0, 20);}
		$display->XFlush;
		$display->XSync();}
	}
sub ShiftKey
	{my $key = CharToKeyCode(shift);
	$display->XTestFakeKeyEvent(50, 1, 0);
	$display->XTestFakeKeyEvent($key, 1, 0);
	$display->XTestFakeKeyEvent($key, 0, 0);
	$display->XTestFakeKeyEvent(50, 0, 0);}
sub CharToKeyCode
	{my $key = shift;
	if($key =~ /\x00(.*)/)
		{return $display->XKeysymToKeycode(XStringToKeysym($1));}
	elsif($key =~ /^[A-Z]$/)
		{return $display->XKeysymToKeycode(XStringToKeysym(lc($key)));}
	elsif($key =~ /^[\-=\[ \]\;\'`\\,\.\/]$/)
		{my @keycodes = (20,21,34,65,35,47,48,49,51,59,60,61);
		return $keycodes[index('-=[ ];\'`\\,./',$key)];}
	elsif($key =~ /^[\!\@\#\$\%\^\&\*\(\)_\+\{\}\:"\~\|<>\?]$/)
		{my @keycodes = (10,11,12,13,14,15,16,17,18,19,20,21,34,35,47,48,49,51,59,60,61);
		return $keycodes[index('!@#$%^&*()_+{}:"~|<>?',$key)];}
	else
		{return $display->XKeysymToKeycode(XStringToKeysym($key));}
	}
sub Click
	{if(Alive())
		{my $n = (int(@_) == 3)?pop:1;
		$display->XTestFakeMotionEvent(0,AbsoluteXY(@_),10);
		for my $i (1..$n)
			{$display->XTestFakeButtonEvent(1, 1, 10);
			$display->XTestFakeButtonEvent(1, 0, 10);}
		$display->XFlush;
		$display->XSync();}
	}
sub MouseClick
	{if(Alive())
		{my $button = (int(@_) == 3)?pop:1;
		$display->XTestFakeMotionEvent(0,AbsoluteXY(@_),10);
		$display->XTestFakeButtonEvent($button, 1, 10);
		$display->XTestFakeButtonEvent($button, 0, 10);
		$display->XFlush;
		$display->XSync();}
	}
sub MouseDown
	{my $button = (int(@_) == 1)?shift:1;
	$display->XTestFakeButtonEvent($button, 1, 10);
	$display->XFlush;
	$display->XSync();}
sub MouseUp
	{my $button = (int(@_) == 1)?shift:1;
	$display->XTestFakeButtonEvent($button, 0, 10);
	$display->XFlush;
	$display->XSync();}
sub MouseMove
	{if(Alive())
		{if(int(@_) == 4)
			{my ($startX,$startY,$stopX,$stopY) = AbsoluteXY(@_);
			my ($moveX,$moveY) = ($stopX-$startX,$stopY-$startY);
			my $n = (abs($moveX) >= abs($moveY))?abs($moveX):abs($moveY);
			if($n != 0)
				{for(my $i = 0; $i != $n+1; $i++)
					{$display->XTestFakeMotionEvent(0,$startX + int($moveX*$i/$n),$startY + int($moveY*$i/$n),5);}
				}
			else
				{$display->XTestFakeMotionEvent(0,AbsoluteXY(splice(@_,0,2)),10);}
			$display->XFlush;
			$display->XSync();}
		elsif(int(@_) == 2)
			{$display->XTestFakeMotionEvent(0,AbsoluteXY(@_),10);
			$display->XFlush;
			$display->XSync();}
		}
	}
