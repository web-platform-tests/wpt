use Image::Imlib2;
sub FindRGBColors
	{my ($n,$pageOffset,$winID,$winWidth,$winHeight) = (int(@_)/3,0,WinID(),WinSize());
	my @abcd = (-1,-1,-1,-1)x$n;
	if(Alive())
		{#system("gm import -silent -window $winID tc.png");
		system("scrot --focused tc.png");
		my $img = Image::Imlib2->load("tc.png");
		if($pageOffset > 0)
			{$img = $img->crop(0,$pageOffset,$winWidth,$winHeight-$pageOffset);}
		for(my $i=0; $i < $n; $i++)
			{$img->set_colour(@_[3*$i],@_[3*$i+1],@_[3*$i+2],255);
			if($img->find_colour)
				{my ($x, $y) = $img->find_colour;
				(@abcd[4*$i],@abcd[4*$i+1]) = ($x,$y+$pageOffset-1);}
			}
		$img->flip_horizontal();
		$img->flip_vertical();
		for(my $i=0; $i < $n; $i++)
			{$img->set_colour(@_[3*$i],@_[3*$i+1],@_[3*$i+2],255);
			if($img->find_colour)
				{my ($x, $y) = $img->find_colour;
				(@abcd[4*$i+2],@abcd[4*$i+3]) = ($winWidth-$x+1,$winHeight-$y);}
			}
		}
	return @abcd;}
