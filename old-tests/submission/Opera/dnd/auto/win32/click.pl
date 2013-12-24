#!/usr/bin/perl
use strict;
use warnings;
use CT;
my ($winName,$baseURL) = @ARGV;
CT::GrabWindow($winName);
my %tests = (
	'contenteditable/006N.xhtml' => ['Drag and drop of selection to contenteditable element',3],
	'drop/021CN.xhtml' => ['Selection drag and drop: removing dropzone attribute ondragstart, "copy" case',3],
	'drop/021LN.xhtml' => ['Selection drag and drop: removing dropzone attribute ondragstart, "link" case',3],
	'drop/021MN.xhtml' => ['Selection drag and drop: removing dropzone attribute ondragstart, "move" case',3],
	'drop/027CN.xhtml' => ['Selection drag and drop: non matching values in dropzone, "copy" case',3],
	'drop/027LN.xhtml' => ['Selection drag and drop: non matching values in dropzone, "link" case',3],
	'drop/027MN.xhtml' => ['Selection drag and drop: non matching values in dropzone, "move" case',3],
	'events/016N.xhtml' => ['Selection drag and drop: events after dragenter is cancelled',3],
	'events/017N.xhtml' => ['Text input selection drag and drop: events after dragenter is cancelled',0,1,3],
	'events/019N.xhtml' => ['Selection drag and drop: events after drag is cancelled',3],
	'events/020N.xhtml' => ['Text input selection drag and drop: events after drag is cancelled',0,1,3],
	'selection/001N.xhtml' => ['Selection drag and drop from text input to block element',0,1,3],
	'selection/002N.xhtml' => ['Selection drag and drop from search input to block element',0,1,2,3],
	'selection/003N.xhtml' => ['Selection drag and drop from tel input to block element',0,1,2,3],
	'selection/004N.xhtml' => ['Selection drag and drop from url input to block element',0,1,3],
	'selection/005N.xhtml' => ['Selection drag and drop from email input to block element',0,1,3],
	'selection/006N.xhtml' => ['Selection drag and drop from number input to block element',0,1,2,3],
	'selection/007N.xhtml' => ['Selection drag and drop from short text input to block element',0,1,3],
	'selection/008N.xhtml' => ['Selection drag and drop from password input to block element',0,1,3],
	'selection/009N.xhtml' => ['Selection drag and drop from readonly text input to block element',0,1,3],
	'selection/010N.xhtml' => ['Selection drag and drop from texarea to block element',3],
	'selection/011N.xhtml' => ['Selection drag and drop from text input to textarea',0,1,3],
	'selection/012N.xhtml' => ['Selection drag and drop from search input to textarea',0,1,2,3],
	'selection/013N.xhtml' => ['Selection drag and drop from tel input to textarea',0,1,2,3],
	'selection/014N.xhtml' => ['Selection drag and drop from url input to textarea',0,1,3],
	'selection/015N.xhtml' => ['Selection drag and drop from email input to textarea',0,1,3],
	'selection/016N.xhtml' => ['Selection drag and drop from number input to textarea',0,1,2,3],
	'selection/017N.xhtml' => ['Selection drag and drop from short text input to textarea',0,1,3],
	'selection/018N.xhtml' => ['Selection drag and drop from password input to textarea',0,1,3],
	'selection/019N.xhtml' => ['Selection drag and drop from readonly input to textarea',0,1,3],
	'selection/020N.xhtml' => ['Selection drag and drop between textareas',3],
	'selection/021N.xhtml' => ['Selection drag and drop from text input to contenteditable element',0,1,3],
	'selection/022N.xhtml' => ['Selection drag and drop from search input to contenteditable element',0,1,2,3],
	'selection/023N.xhtml' => ['Selection drag and drop from tel input to contenteditable element',0,1,2,3],
	'selection/024N.xhtml' => ['Selection drag and drop from url input to contenteditable element',0,1,3],
	'selection/025N.xhtml' => ['Selection drag and drop from email input to contenteditable element',0,1,3],
	'selection/026N.xhtml' => ['Selection drag and drop from number input to contenteditable element',0,1,2,3],
	'selection/027N.xhtml' => ['Selection drag and drop from short text input to contenteditable element',0,1,3],
	'selection/028N.xhtml' => ['Selection drag and drop from password input to contenteditable element',0,1,3],
	'selection/029N.xhtml' => ['Selection drag and drop from readonly text input to contenteditable element',0,1,3],
	'selection/030N.xhtml' => ['Selection drag and drop from textarea to contenteditable element',3],
	'selection/071N.xhtml' => ['Selection drag and drop between text inputs of different size',0,1,3],
	'selection/072N.xhtml' => ['Selection drag and drop from search to text input',0,1,2,3],
	'selection/073N.xhtml' => ['Selection drag and drop from tel to text input',0,1,2,3],
	'selection/074N.xhtml' => ['Selection drag and drop from url to text input',0,1,3],
	'selection/075N.xhtml' => ['Selection drag and drop from email to text input',0,1,3],
	'selection/076N.xhtml' => ['Selection drag and drop from number to text input',0,1,2,3],
	'selection/077N.xhtml' => ['Selection drag and drop from short text input to another text input',0,1,3],
	'selection/078N.xhtml' => ['Selection drag and drop from password to text input',0,1,3],
	'selection/079N.xhtml' => ['Selection drag and drop from readonly text input to another text input',0,1,3],
	'selection/080N.xhtml' => ['Selection drag and drop from textarea to text input',1,3],
	'selection/109N.xhtml' => ['RTL text selection drag and drop from text input to RTL textarea',0,1,3],
	'selection/110N.xhtml' => ['RTL text selection drag and drop from text input to textarea',0,1,3],
	'selection/113N.xhtml' => ['RTL text selection drag and drop between textareas',3],
	'selection/114N.xhtml' => ['RTL text selection drag and drop between RTL textareas',3],
	'selection/115N.xhtml' => ['RTL text selection drag and drop between RTL inputs',0,1,3],
	'selection/116N.xhtml' => ['RTL text selection drag and drop between text inputs',0,1,3],
	'selection/119N.xhtml' => ['RTL text selection drag and drop from textarea to RTL text input',1,3],
	'selection/120N.xhtml' => ['RTL text selection drag and drop from textarea to text input',1,3],
	'selection/121N.xhtml' => ['RTL text selection drag and drop from RTL text input to contenteditable element',0,1,3],
	'selection/122N.xhtml' => ['RTL text selection drag and drop from text input to contenteditable element',0,1,3],
	'selection/123N.xhtml' => ['RTL text selection drag and drop from RTL element to contenteditable element',3],
	'selection/124N.xhtml' => ['RTL text selection drag and drop to contenteditable element',3],
	'selection/125N.xhtml' => ['RTL text selection drag and drop from textarea to RTL contenteditable element',3],
	'selection/126N.xhtml' => ['RTL text selection drag and drop from textarea to contenteditable element',3],
	'selection/127N.xhtml' => ['RTL text selection drag and drop from text input to RTL element',0,1,3],
	'selection/128N.xhtml' => ['RTL text selection drag and drop from text input to block element',0,1,3],
	'selection/131N.xhtml' => ['RTL text selection drag and drop from textarea to block element',3],
	'selection/132N.xhtml' => ['RTL text selection drag and drop from RTL textarea to block element',3],
	'selection/133N.xhtml' => ['Multielement selection drag and drop',4],
	'selection/134N.xhtml' => ['Drag and drop after selecting whole page content',4],
	'selection/138N.xhtml' => ['BiDi text selection drag and drop from text input to textarea',0,1,3],
	'selection/139N.xhtml' => ['BiDi text selection drag and drop between textareas',3],
	'selection/140N.xhtml' => ['BiDi text selection drag and drop between text inputs',0,1,3],
	'selection/141N.xhtml' => ['BiDi text selection drag and drop to contenteditable element',3],
	'selection/144N.xhtml' => ['Selection drag and drop from text input and text/plain aliases',0,1,3],
	'selection/145N.xhtml' => ['Selection drag and drop from inline element and text/plain aliases',3],
	'selection/151N.xhtml' => ['Dropping selection in readonly text input',3],
	'selection/152N.xhtml' => ['Dropping selection in readonly textarea',3],
	'selection/153N.xhtml' => ['Dropping selection from text input into readonly text input',0],
	'selection/154N.xhtml' => ['Dropping selection from text input into readonly textarea',0],
	'selection/155N.xhtml' => ['Selection drag and drop from readonly textarea to block element',3],
	'selection/156N.xhtml' => ['Selection drag and drop between text inputs',0,1,3],
	'selection/157N.xhtml' => ['Selection drag and drop between search inputs',0,1,2,3],
	'selection/158N.xhtml' => ['Selection drag and drop between tel inputs',0,1,2,3],
	'selection/159N.xhtml' => ['Selection drag and drop between url inputs',0,1,3],
	'selection/160N.xhtml' => ['Selection drag and drop between email inputs',0,1,3],
	'selection/161N.xhtml' => ['Selection drag and drop between number inputs',0,1,2,3],
	'selection/162N.xhtml' => ['Selection drag and drop between contenteditable elements',3],
	'svg/021N.xhtml' => ['Dragging selection from SVG text element to XHTML element',3],
	'svg/022N.xhtml' => ['Dragging selection from SVG editable text element to XHTML element',3],
	'svg/024N.xhtml' => ['Dragging selection from SVG text element to contenteditable element',3],
	'svg/025N.xhtml' => ['Dragging selection from editable SVG text element to contenteditable element',3],
	'svg/027N.xhtml' => ['Dragging selection from SVG text element to XHTML textarea',3],
	'svg/028N.xhtml' => ['Dragging selection from SVG editable text element to XHTML textarea',3],
);
foreach my $tc (sort keys %tests)
	{my ($url,@params) = ($baseURL.$tc,@{$tests{$tc}});
	my $title = shift(@params);
	CT::Blank();
	print "Testing TC: $title\n";
	CT::LoadPage($url);
	CT::WaitSeconds(0.5);
	my ($drag,$wait,$tail) = (0,0,0);
	until($wait == 6 or $drag == 1)
		{$wait++;
		my %abcd = CT::LocateColors('tan','steelblue');
		if(grep(/-1/,@{$abcd{'tan'}}))
			{if($wait == 6)
				{print "\nCan't locate draggable area\n";
				CT::Result(-1,$title."\n".$url);}
			else
				{if($tail == 0)
					{$tail = 1;
					print "Waiting for draggable area to appear";}
				else
					{print ".";}
				CT::WaitSeconds(0.5*$wait);}
			}
		elsif(grep(/-1/,@{$abcd{'steelblue'}}))
			{if($wait == 6)
				{print "\nCan't locate dropzone\n";
				CT::Result(-1,$title."\n".$url);}
			else
				{if($tail == 0)
					{$tail = 2;
					print "Waiting for dropzone to appear";}
				else
					{print ".";}
				CT::WaitSeconds(0.5*$wait);}
			}
		else
			{$drag = 1;
			if($tail != 0)
				{$tail = 0;
				print "\n";}
			my $continue = 0;
			for my $i (0..int(@params)-1)
				{print "Case $params[$i]\n";
				if($i != 0)
					{my $wait = 0;
					until($wait == 6 or $continue == 1)
						{$wait++;
						if(grep(/-1/,CT::FindColors('forestgreen')))
							{$continue = 1;}
						else
							{if($wait != 6)
								{CT::WaitSeconds(0.3*$wait);}
							else
								{CT::Result(-1,$title." (Case $params[$i])\n".$url);}
							}
						}
					}
				else
					{$continue = 1;}
				if($continue)
					{if($params[$i] == 0)
						{CT::Click(@{$abcd{'tan'}}[2]+5,@{$abcd{'tan'}}[3]+5);
						CT::TabNav();}
					elsif($params[$i] == 1)
						{CT::Click(@{$abcd{'tan'}}[0]+5,@{$abcd{'tan'}}[1]+5);
						CT::SelectAll();}
					else
						{CT::Click(@{$abcd{'tan'}}[0]+5,@{$abcd{'tan'}}[1]+5,$params[$i]);}
					CT::DragAndDrop(Center(@{$abcd{'tan'}}),Center(@{$abcd{'steelblue'}}));
					CT::Result(CT::Colors('forestgreen'),$title." (Case $params[$i])\n".$url);}
				if($i != int(@params)-1)
					{CT::Reload();
					CT::WaitSeconds(0.5)}
				}
			}
		}
	}
CT::Results();
sub Center
	{return (int(($_[0]+$_[2])/2),int(($_[1]+$_[3])/2));}