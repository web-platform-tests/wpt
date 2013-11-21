sub KeyPress
	{if(@_ and Alive())
		{Win32::GuiTest::SendKeys(KeyName(shift));}
	}
sub KeyDown
	{if(@_ and Alive())
		{Win32::GuiTest::SendRawKey(KeyCode(shift),0x0000);}
	}
sub KeyUp
	{if(@_ and Alive())
		{Win32::GuiTest::SendRawKey(KeyCode(shift),0x0002);}
	}
sub Keys
	{if(@_ and Alive())
		{my $key = KeyName(pop);
		my $modifiers = join('',@_);
		if($modifiers =~ /SHIFT\x00/)
			{$key = "+($key)";}
		if($modifiers =~ /ALT\x00/)
			{$key = "%($key)";}
		if($modifiers =~ /CTRL\x00/)
			{$key = "^($key)";}
		Win32::GuiTest::SendKeys($key,0);}
	}
sub KeyName
	{my $key = shift;
	if($key =~ /([A-Z0-9]+)\x00/)
		{return '{'.$1.'}';}
	else
		{$key =~ s/([\~\+\^\%\{\}\(\)])/{$1}/g;
		return $key;}
	}
sub KeyCode
	{my $key = shift;
	if($key =~ /^[a-z]$/)
		{return unpack('C',uc($key));}
	elsif($key =~ /^[A-Z0-9]$/)
		{return unpack('C',$key);}
	elsif($key =~ /^[`\-=\[ \]\;\'\\,\.\/]$/)
		{my @keycodes = (192,189,187,219,32,221,220,186,222,188,190,191);
		return $keycodes[index('`-=[ ]\\;\',./',$key)];}
	elsif($key =~ /^[~\!\@\#\$\%\^\&\*\(\)_\+\{\}\|\:"<>\?]$/)
		{my @keycodes = (192,49,50,51,52,53,54,55,56,57,48,189,187,219,221,220,186,222,188,190,191);
		return $keycodes[index('~!@#$%^&*()_+{}|:"<>?',$key)];}
	elsif($key =~ /\x00([0-9]{2,3})/)
		{return $1;}
	}