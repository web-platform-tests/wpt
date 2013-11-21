my $pass = 0;
my @fail;
my @skip;
sub Quit
	{Results();
	die(shift);}
sub Result
	{my ($result,$title) = @_;
	if($result == 1)
		{print "PASS\n";
		$pass++;}
	elsif($result == 0)
		{print "FAIL\n";
		push(@fail,$title);}
	else
		{push(@skip,$title);}
	}
sub Results
	{my $tests = $pass + int(@fail);
	print "\n$pass tests out of $tests passed.\n";
	if(@fail)
		{if(int(@fail) > 1)
			{print "The following ".int(@fail)." tests failed:\n";
			print join("\n",@fail);
			print "\n";}
		else
			{print "The following test failed:\n$fail[0]\n";}
		}
	if(@skip)
		{if(int(@skip) > 1)
			{print "The following ".int(@skip)." tests skipped:\n";
			print join("\n",@skip);
			print "\n";}
		else
			{print "The following test skipped:\n$skip[0]\n";}
		}
	my $testTime = time - $^T;
	if($testTime > 60)
		{my $testMin = int($testTime/60);
		my $testSec = $testTime%60;
		if($testSec == 0)
			{print "Testing took $testMin minutes."}
		else
			{print "Testing took $testMin minutes and $testSec seconds."}
		}
	else
		{print "Testing took $testTime seconds."}
	if($tests > 1)
		{my $averageTime = int($testTime*100/$tests)/100;
		print " $averageTime seconds per test.\n";}
	else
		{print "\n";}
	}