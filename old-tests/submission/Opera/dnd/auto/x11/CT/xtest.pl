use X11::Protocol;
my $X = X11::Protocol->new;
$X->init_extension('XTEST') or print "XTEST extension not available";
sub Cycle
	{my $c = (@_)?shift:1;
	$X->XTestFakeInput(name => 'KeyPress', detail => 64);
	for my $i (1..$c)
		{sleep(0.01);
		$X->XTestFakeInput(name => 'KeyPress', detail => 23);
		sleep(0.01);
		$X->XTestFakeInput(name => 'KeyRelease', detail => 23);}
	$X->XTestFakeInput(name => 'KeyRelease', detail => 64);}
sub KeyPress
	{if(@_ and Alive())
		{my $key = CharToKeyCode(shift);
		$X->XTestFakeInput(name => 'KeyPress', detail => $key);
		sleep(0.01);
		$X->XTestFakeInput(name => 'KeyRelease', detail => $key);
		sleep(0.01);}
	}
sub KeyDown
	{if(@_ and Alive())
		{my $key = CharToKeyCode(shift);
		$X->XTestFakeInput(name => 'KeyPress', detail => $key);
		sleep(0.01);}
	}
sub KeyUp
	{if(@_ and Alive())
		{my $key = CharToKeyCode(shift);
		$X->XTestFakeInput(name => 'KeyRelease', detail => $key);
		sleep(0.01);}
	}
sub Keys
	{if(@_ and Alive())
		{my $key = pop;
		my @keys = @_;
		for my $k (@keys)
			{$X->XTestFakeInput(name => 'KeyPress', detail => CharToKeyCode($k));
			sleep(0.01);}
		@keys = reverse(@keys);
		if($key =~ /^[A-Z]$/)
			{ShiftKey(lc($key));}
		else
			{if($key =~ /\x00(.*)/)
				{my $key = CharToKeyCode($key);
				$X->XTestFakeInput(name => 'KeyPress', detail => $key);
				sleep(0.01);
				$X->XTestFakeInput(name => 'KeyRelease', detail => $key);
				sleep(0.01);}
			else
				{for my $i (0..length($key)-1)
					{my $k = substr($key,$i,1);
					if($k =~ /^[A-Z]$/)
						{ShiftKey(lc($k));}
					elsif($k =~ /^[\!\@\#\$\%\^\&\*\(\)_\+\{\}\:"\~\|<>\?]$/)
						{ShiftKey($k);}
					else
						{my $k = CharToKeyCode($k);
						$X->XTestFakeInput(name => 'KeyPress', detail => $k);
						sleep(0.01);
						$X->XTestFakeInput(name => 'KeyRelease', detail => $k);
						sleep(0.01);}
					}
				}
			}
		for my $k (@keys)
			{$X->XTestFakeInput(name => 'KeyRelease', detail => CharToKeyCode($k));
			sleep(0.01);}
		}
	}
sub ShiftKey
	{my $key = CharToKeyCode(shift);
	$X->XTestFakeInput(name => 'KeyPress', detail => 50);
	sleep(0.01);
	$X->XTestFakeInput(name => 'KeyPress', detail => $key);
	sleep(0.01);
	$X->XTestFakeInput(name => 'KeyRelease', detail => $key);
	sleep(0.01);
	$X->XTestFakeInput(name => 'KeyRelease', detail => 50);
	sleep(0.01);}
sub CharToKeyCode
	{my $key = shift;
	if($key =~ /([0-9]+)\x00/)
		{return $1;}
	elsif($key =~ /^[A-Z]$/)
		{return CharToKeyCode(lc($key));}
	elsif($key =~ /^[0\-=\[ \]\;\'`\\,\.\/]$/)
		{my @keycodes = (19,20,21,34,65,35,47,48,49,51,59,60,61);
		return $keycodes[index('0-=[ ];\'`\\,./',$key)];}
	elsif($key =~ /^[\!\@\#\$\%\^\&\*\(\)_\+\{\}\:"\~\|<>\?]$/)
		{my @keycodes = (10,11,12,13,14,15,16,17,18,19,20,21,34,35,47,48,49,51,59,60,61);
		return $keycodes[index('!@#$%^&*()_+{}:"~|<>?',$key)];}
	elsif($key =~ /^[1-9]$/)
		{return $key + 9;}
	elsif($key =~ /^[qwertyuiop]$/)
		{return 24 + index('qwertyuiop',$key);}
	elsif($key =~ /^[asdfghjkl]$/)
		{return 38 + index('asdfghjkl',$key);}
	elsif($key =~ /^[zxcvbnm]$/)
		{return 52 + index('zxcvbnm',$key);}
	}
sub Click
	{if(Alive())
		{my $n = (int(@_) == 3)?pop:1;
		my ($x,$y) = AbsoluteXY(@_);
		$X->XTestFakeInput(name => 'MotionNotify', root_x => $x, root_y => $y);
		for my $i (1..$n)
			{$X->XTestFakeInput(name => 'ButtonPress', detail => 1);
			sleep(0.01);
			$X->XTestFakeInput(name => 'ButtonRelease', detail => 1);}
		}
	}
sub MouseClick
	{if(Alive())
		{my $button = (int(@_) == 3)?pop:1;
		my ($x,$y) = AbsoluteXY(@_);
		$X->XTestFakeInput(name => 'MotionNotify', root_x => $x, root_y => $y);
		sleep(0.01);
		$X->XTestFakeInput(name => 'ButtonPress', detail => $button);
		sleep(0.01);
		$X->XTestFakeInput(name => 'ButtonRelease', detail => $button);}
	}
sub MouseDown
	{my $button = (int(@_) == 1)?shift:1;
	$X->XTestFakeInput(name => 'ButtonPress', detail => $button);
	sleep(0.01);}
sub MouseUp
	{my $button = (int(@_) == 1)?shift:1;
	$X->XTestFakeInput(name => 'ButtonRelease', detail => $button);
	sleep(0.01);}
sub MouseMove
	{if(Alive())
		{if(int(@_) == 4)
			{my ($startX,$startY,$stopX,$stopY) = AbsoluteXY(@_);
			my ($moveX,$moveY) = ($stopX-$startX,$stopY-$startY);
			my $n = (abs($moveX) >= abs($moveY))?abs($moveX):abs($moveY);
			if($n != 0)
				{for(my $i = 0; $i != $n+1; $i++)
					{$X->XTestFakeInput(name => 'MotionNotify', root_x => $startX + int($moveX*$i/$n), root_y => $startY + int($moveY*$i/$n));
					sleep(0.01);}
				}
			else
				{my ($x,$y) = AbsoluteXY(splice(@_,0,2));
				$X->XTestFakeInput(name => 'MotionNotify', root_x => $x, root_y => $y);
				sleep(0.01);}
			}
		elsif(int(@_) == 2)
			{my ($x,$y) = AbsoluteXY(@_);
			$X->XTestFakeInput(name => 'MotionNotify', root_x => $x, root_y => $y);
			sleep(0.01);}
		}
	}
