sub FindRGBColors
	{my ($n,$pageOffset) = (int(@_)/3,0);
	my @abcd = (-1,-1,-1,-1)x$n;
	if(Alive())
		{my $screen = new Win32::GuiTest::DibSect;
		$screen->CopyWindow(WinID());
		$screen->SaveAs("tc.bmp");
		open(TC,"<tc.bmp") or Quit("Can't load bitmap.\n");
		read(TC,my $data, 10);
		read(TC,$data, 4);
		my $bitmapStart = unpack('V',$data);
		read(TC,$data, 4);
		read(TC,$data, 8);
		my ($width,$height) = unpack('ii',$data);
		read(TC,$data, 8);
		my $dy = $width*3;
		if($dy%4 != 0)
			{$dy = $dy + 4 - ($dy)%4;}
		read(TC,$data, $bitmapStart - 34);
		my @bmp = ();
		for my $i (0..$n-1)
			{my $pattern = pack("C3",$_[3*$i+2],$_[3*$i+1],$_[3*$i]);
			$pattern =~ s/\\/\\\\/g;
			$pattern =~ s/([+|*?.\[\]\$^\/{}()])/\\$1/g;
			push(@bmp,$pattern);}
		for(my $y = 0; $y < $height-$pageOffset; $y++)
			{read(TC,$data,$dy);
			for(my $i=0; $i < $n; $i++)
				{if($data =~ /(^(?:...)*?$bmp[$i])/)
					{($abcd[4*$i],$abcd[4*$i+1]) = (length($1)/3+1,$height-$y-1);
					if($abcd[4*$i+2] == -1 and $data =~ /(^(?:...)*$bmp[$i])/)
						{($abcd[4*$i+2],$abcd[4*$i+3]) = (length($1)/3+1,$height-$y-1);}
					}
				}
			}
		close TC;}
	return @abcd;}