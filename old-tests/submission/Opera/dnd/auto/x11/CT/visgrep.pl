sub FindRGBColors
	{my ($n,$pageOffset,$winID) = (int(@_)/3,0,WinID());
	my @abcd = (-1,-1,-1,-1)x$n;
	if(Alive())
		{#system("gm import -silent -window $winID tc.png");
		system("scrot --focused tc.png");
		for(my $i=0; $i < $n; $i++)
			{RGB2PAT(@_[3*$i],@_[3*$i+1],@_[3*$i+2]);
			my $opt = ($pageOffset > 0)?" -Y $pageOffset":'';
			my $match = `visgrep$opt tc.png match.pat`;
			if($match =~ /^([0-9]+),([0-9]+) -1/)
				{(@abcd[4*$i],@abcd[4*$i+1]) = (int($1)+1, $2);}
			if($match =~ /\n([0-9]+),([0-9]+) -1$/)
				{(@abcd[4*$i+2],@abcd[4*$i+3]) = (int($1)+1, $2);}
			}
		}
	return @abcd;}
sub RGB2PAT
	{open(PAT,">match.pat");
	print PAT pack("A4","IMg!").pack("I2",1,1).pack("C4",@_,255);
	close PAT;}