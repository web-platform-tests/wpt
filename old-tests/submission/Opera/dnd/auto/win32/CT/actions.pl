sub DragAndDrop
	{my ($dragX,$dragY,$dropX,$dropY) = @_;
	MouseMove($dragX,$dragY);
	MouseDown();
	MouseMove($dragX,$dragY,$dragX,$dropY);
	MouseMove($dragX,$dropY,$dropX,$dropY);
	MouseUp();}
sub Select
	{my ($selectA,$selectB,$selectC,$selectD) = @_;
	MouseMove($selectA,$selectB);
	MouseDown();
	MouseMove($selectA,$selectB,$selectC,$selectB);
	MouseMove($selectC,$selectB,$selectC,$selectD);
	MouseUp();}
sub SwitchTabs
	{Keys(Ctrl,Tab);
	WaitSeconds(0.5);}
sub OpenNewTab
	{Keys(Ctrl,'t');
	WaitSeconds(0.5);}
sub CloseTab
	{Keys(Ctrl,'w');
	WaitSeconds(0.5);}
sub SelectAll
	{Keys(Ctrl,'a');}
sub Copy
	{Keys(Ctrl,'c');}
sub Paste
	{Keys(Ctrl,'v');}
sub Undo
	{Keys(Ctrl,'z');}
sub Redo
	{Keys(Ctrl,'y');	}
sub Back
	{my $n = (int(@_) > 0)?$_[0]:1;
	for my $i (1..abs($n))
		{Keys(Alt,Left);}
	}
sub Forward
	{my $n = (int(@_) > 0)?$_[0]:1;
	for my $i (1..abs($n))
		{Keys(Alt,Right);}
	}
sub HitEnter
	{KeyPress(Enter);}
sub Reload
	{KeyPress(F5);
	WaitSeconds(0.5);}
sub SpatNav
	{if(@_)
		{my $n = (int(@_) > 1)?$_[1]:1;
		for my $i (1..$n)
			{Keys(Shift,$_[0]);
			WaitSeconds(0.1);}
		}
	}
sub TabNav
	{my $n = (int(@_) > 0)?$_[0]:1;
	for my $i (1..abs($n))
		{if($n > 0)
			{Keys(Tab);}
		else
			{Keys(Shift,Tab);}
		WaitSeconds(0.2);}
	}
sub LoadPage
	{if(Alive())
		{my $tc = shift;
		my $baseURL = BaseURL();
		if($baseURL and not $tc =~ /^((?:file|ftp|https?):\/\/|(?:about|data|javascript|opera):)/)
			{$tc = $baseURL.$tc;}
		Keys(Ctrl,'l');
		Keys($tc);
		KeyPress(Enter);
		print "Loading page: ".$tc."\n";
		WaitSeconds(0.3);}
	}
sub Blank
	{LoadPage('about:blank');
	WaitSeconds(0.3);}
sub Say
	{LoadPage('data:text/html,'.shift);
	WaitSeconds(0.5);}