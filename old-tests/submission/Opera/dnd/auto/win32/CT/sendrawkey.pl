sub KeyPress
	{if(@_ and Alive())
		{my $key = shift;
		if($key =~ /^[A-Z~\!\@\#\$\%\^\&\*\(\)_\+\{\}\|\:"<>\?]$/)
			{ShiftKey(KeyCode($key))}
		else
			{PressKey(KeyCode($key))}
		}
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
		{my $key = pop;
		my @keys = @_;
		for my $i (0..int(@keys)-1)
			{Win32::GuiTest::SendRawKey(KeyCode($keys[$i]),0);}
		if($key =~ /\x00([0-9]{2,3})/)
			{PressKey($1)}
		else
			{for my $i (0..length($key)-1)
				{my $k = substr($key,$i,1);
				if($k =~ /^[A-Z~\!\@\#\$\%\^\&\*\(\)_\+\{\}\|\:"<>\?]$/)
					{ShiftKey(KeyCode($k))}
				else
					{PressKey(KeyCode($k))}
				}
			}
		@keys = reverse(@keys);
		for my $i (0..int(@keys)-1)
			{Win32::GuiTest::SendRawKey(KeyCode($keys[$i]),2);}
		}
	}
sub ShiftKey
	{my $key = shift;
	Win32::GuiTest::SendRawKey(16,0x0000);
	Win32::GuiTest::SendRawKey($key,($key > 37 and $key < 41)?0x0001:0x0000);
	Win32::GuiTest::SendRawKey($key,0x0002);
	Win32::GuiTest::SendRawKey(16,0x0002);}
sub PressKey
	{my $key = shift;
	Win32::GuiTest::SendRawKey($key,($key > 37 and $key < 41)?0x0001:0x0000);
	Win32::GuiTest::SendRawKey($key,0x0002);}
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