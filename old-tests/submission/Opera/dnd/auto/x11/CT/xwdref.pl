my @bitmapRef;
my @bitmapRows;
my ($pageOffset, $reftestMode) = (0,0);
sub FindRGBColors
	{my ($n,$winID) = (int(@_)/3,WinID());
	my @abcd = (-1,-1,-1,-1)x$n;
	if(Alive())
		{open(TC,"xwd -nobdrs -screen -silent -id $winID|") or Quit("Can't load xwd data.\n");
		#open(TC,"gm import -silent -window $winID xwd:-|") or Quit("Can't load xwd data.\n");
		read(TC,my $data, 100);
		my @h = unpack('N'.100, $data);
		if(@h)
			{@bitmapRows = ();
			my ($headerSize,$byteOrder,$colors) = ($h[0],$h[7],$h[19]);
			my ($pxWidth,$pxHeight,$dx,$dy) = ($h[4],$h[5],$h[11]/8,$h[12]);
			read(TC, $data, $headerSize - 100 + 12*$colors + $pageOffset*$dy);
			my @xwd = ();
			for my $i (0..$n-1)
				{my $pattern = pack("C3",$_[3*$i+2-2*$byteOrder],$_[3*$i+1],$_[3*$i+2*$byteOrder]);
				$pattern =~ s/\\/\\\\/g;
				$pattern =~ s/([+|*?.\[\]\$^\/{}()])/\\$1/g;
				push(@xwd,$pattern);}
			for(my $y=$pageOffset; $y < $pxHeight; $y++)
				{read(TC, $data, $dy);
				if($reftestMode)
					{push(@bitmapRows,$data);}
				for(my $i=0; $i < $n; $i++)
					{if($data =~ /(^(?:.{$dx})*$xwd[$i])/)
						{($abcd[4*$i+2],$abcd[4*$i+3]) = ((length($1)+$dx-3)/$dx,$y);
						if($abcd[4*$i] == -1 and $data =~ /(^(?:.{$dx})*?$xwd[$i])/)
							{($abcd[4*$i],$abcd[4*$i+1]) = ((length($1)+$dx-3)/$dx,$y);}
						}
					}
				}
			}
		}
	return @abcd;}
sub SetPageOffset
	{$pageOffset = shift;}
sub SetReftestMode
	{$reftestMode = shift;}
sub SaveBitmap
	{@bitmapRef = @bitmapRows;}
sub CompareBitmaps
	{for my $i (0..int(@bitmapRef)-1)
		{if($bitmapRows[$i] ne $bitmapRef[$i])
			{print "Line $i did not match reference\n";
			return 0;}
		}
	return 1;}