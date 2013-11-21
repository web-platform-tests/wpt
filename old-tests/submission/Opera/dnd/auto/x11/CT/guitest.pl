use X11::GUITest;
sub Cycle
	{my $c = (@_)?shift:1;
	X11::GUITest::SendKeys('%('.("\t"x$c).')');}
sub KeyPress
	{if(@_ and Alive())
		{X11::GUITest::PressReleaseKey(KeyName($_[0]));}
	}
sub KeyDown
	{if(@_ and Alive())
		{X11::GUITest::PressKey(KeyName($_[0]));}
	}
sub KeyUp
	{if(@_ and Alive())
		{X11::GUITest::ReleaseKey(KeyName($_[0]));}
	}
sub Keys
	{if(@_ and Alive())
		{my $key = pop;
		my @keys = @_;
		for my $k (@keys)
			{X11::GUITest::PressKey(KeyName($k));}
		@keys = reverse(@keys);
		X11::GUITest::SendKeys(KeyName($key,'{','}'));
		for my $k (@keys)
			{X11::GUITest::ReleaseKey(KeyName($k));}
		}
	}
sub KeyName
	{my ($key,$left,$right) = @_;
	if($key =~ /\x00(.*)/)
		{if(int(@_) == 3)
			{return $left.$1.$right;}
		else
			{return $1;}
		}
	else
		{$key = X11::GUITest::QuoteStringForSendKeys($key);
		if(X11::GUITest::QuoteStringForSendKeys('#') ne '{#}')
			{$key =~ s/\#/{#}/g}
		return $key;}
	}
sub Click
	{if(Alive())
		{my $n = (int(@_) == 3)?pop:1;
		X11::GUITest::MoveMouseAbs(AbsoluteXY(@_));
		for my $i (1..$n)
			{X11::GUITest::ClickMouseButton(X11::GUITest::M_LEFT);}
		}
	}
sub MouseClick
	{if(Alive())
		{my $button = (int(@_) == 3)?pop:1;
		X11::GUITest::MoveMouseAbs(AbsoluteXY(@_));
		if($button == 2)
			{X11::GUITest::ClickMouseButton(X11::GUITest::M_MIDDLE);}
		elsif($button == 3)
			{X11::GUITest::ClickMouseButton(X11::GUITest::M_RIGHT);}
		else
			{X11::GUITest::ClickMouseButton(X11::GUITest::M_LEFT);}
		}
	}
sub MouseDown
	{if(@_ and $_[0] == 2)
		{X11::GUITest::PressMouseButton(X11::GUITest::M_MIDDLE);}
	elsif(@_ and $_[0] == 3)
		{X11::GUITest::PressMouseButton(X11::GUITest::M_RIGHT);}
	else
		{X11::GUITest::PressMouseButton(X11::GUITest::M_LEFT);}
	}
sub MouseUp
	{if(@_ and $_[0] == 2)
		{X11::GUITest::ReleaseMouseButton(X11::GUITest::M_MIDDLE);}
	elsif(@_ and $_[0] == 3)
		{X11::GUITest::ReleaseMouseButton(X11::GUITest::M_RIGHT);}
	else
		{X11::GUITest::ReleaseMouseButton(X11::GUITest::M_LEFT);}
	}
sub MouseMove
	{if(Alive())
		{if(int(@_) == 4)
			{my ($startX,$startY,$stopX,$stopY) = AbsoluteXY(@_);
			my ($moveX,$moveY) = ($stopX-$startX,$stopY-$startY);
			my $n = (abs($moveX) >= abs($moveY))?abs($moveX):abs($moveY);
			if($n != 0)
				{for(my $i = 0; $i != $n+1; $i++)
					{X11::GUITest::MoveMouseAbs($startX + int($moveX*$i/$n),$startY + int($moveY*$i/$n));}
				}
			else
				{X11::GUITest::MoveMouseAbs(AbsoluteXY(splice(@_,0,2)));}
			}
		elsif(int(@_) == 2)
			{X11::GUITest::MoveMouseAbs(AbsoluteXY(@_));}
		}
	}