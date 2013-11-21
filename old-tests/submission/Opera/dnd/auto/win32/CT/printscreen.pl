use Win32::Clipboard;
sub FindRGBColors
	{my ($n,$pageOffset) = (int(@_)/3,0);
	my @abcd = (-1,-1,-1,-1)x$n;
	if(Alive())
		{Win32::GuiTest::SendKeys('%{PRTSCN}');
		my $clipboard = Win32::Clipboard->new();
		my $img = $clipboard->GetBitmap;
		my $bitmapStart = unpack('V',substr($img,10,4));
		my ($width,$height) = unpack('ii',substr($img,18,8));
		my $dy = $width*4;
		my @bmp = ();
		for my $i (0..$n-1)
			{my $pattern = pack("C3",$_[3*$i+2],$_[3*$i+1],$_[3*$i]);
			$pattern =~ s/\\/\\\\/g;
			$pattern =~ s/([+|*?.\[\]\$^\/{}()])/\\$1/g;
			push(@bmp,$pattern);}
		for(my $y = 0; $y < $height-$pageOffset; $y++)
			{my $data = substr($img,$bitmapStart + $y*$dy,$dy);
			for(my $i=0; $i < $n; $i++)
				{if($data =~ /(^(?:.{4})*?$bmp[$i])/)
					{($abcd[4*$i],$abcd[4*$i+1]) = ((length($1)+1)/4,$height-$y-1);
					if($abcd[4*$i+2] == -1 and $data =~ /(^(?:.{4})*$bmp[$i])/)
						{($abcd[4*$i+2],$abcd[4*$i+3]) = ((length($1)+1)/4,$height-$y-1);}
					}
				}
			}
		}
	return @abcd;}