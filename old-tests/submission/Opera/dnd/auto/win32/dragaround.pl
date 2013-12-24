#!/usr/bin/perl
use strict;
use warnings;
use CT;
my ($winName,$baseURL) = @ARGV;
CT::GrabWindow($winName);
my %tests = (
	'canvas/001.xhtml' => 'Canvas drag and drop carrying image as dataURL',
	'canvas/002.xhtml' => 'Drag and drop: dropping block element onto canvas',
	'contenteditable/001.xhtml' => 'Drag and drop of link to contenteditable element',
	'contenteditable/006.xhtml' => 'Drag and drop of selection to contenteditable element',
	'contenteditable/006N.xhtml' => 'Drag and drop of selection to contenteditable element',
	'datastore/023.xhtml' => 'dataTransfer.clearData and reload during block element drag and drop',
	'datastore/029.xhtml' => 'Clear datastore data during block element drag and drop',
	'datastore/030.xhtml' => 'Clear datastore data during canvas drag and drop',
	'drop/021C.xhtml' => 'Selection drag and drop: removing dropzone attribute ondragstart, "copy" case',
	'drop/021CN.xhtml' => 'Selection drag and drop: removing dropzone attribute ondragstart, "copy" case',
	'drop/021L.xhtml' => 'Selection drag and drop: removing dropzone attribute ondragstart, "link" case',
	'drop/021LN.xhtml' => 'Selection drag and drop: removing dropzone attribute ondragstart, "link" case',
	'drop/021M.xhtml' => 'Selection drag and drop: removing dropzone attribute ondragstart, "move" case',
	'drop/021MN.xhtml' => 'Selection drag and drop: removing dropzone attribute ondragstart, "move" case',
	'drop/027C.xhtml' => 'Selection drag and drop: non matching values in dropzone, "copy" case',
	'drop/027CN.xhtml' => 'Selection drag and drop: non matching values in dropzone, "copy" case',
	'drop/027L.xhtml' => 'Selection drag and drop: non matching values in dropzone, "link" case',
	'drop/027LN.xhtml' => 'Selection drag and drop: non matching values in dropzone, "link" case',
	'drop/027M.xhtml' => 'Selection drag and drop: non matching values in dropzone, "move" case',
	'drop/027MN.xhtml' => 'Selection drag and drop: non matching values in dropzone, "move" case',
	'events/016.xhtml' => 'Selection drag and drop: events after dragenter is cancelled',
	'events/016N.xhtml' => 'Selection drag and drop: events after dragenter is cancelled',
	'events/017.xhtml' => 'Text input selection drag and drop: events after dragenter is cancelled',
	'events/017N.xhtml' => 'Text input selection drag and drop: events after dragenter is cancelled',
	'events/018.xhtml' => 'Link drag and drop: events after dragenter is cancelled',
	'events/019.xhtml' => 'Selection drag and drop: events after drag is cancelled',
	'events/019N.xhtml' => 'Selection drag and drop: events after drag is cancelled',
	'events/020.xhtml' => 'Text input selection drag and drop: events after drag is cancelled',
	'events/020N.xhtml' => 'Text input selection drag and drop: events after drag is cancelled',
	'events/021.xhtml' => 'Link drag and drop: events after drag is cancelled',
	'events/027.xhtml' => 'PNG image drag and drop: "return false" should not cancel event',
	'events/028.xhtml' => 'Link drag and drop: "return false" should not cancel event',
	'images/001.xhtml' => 'Image drag and drop',
	'images/002.xhtml' => 'dataURL image drag and drop',
	'images/004.xhtml' => 'Object with image drag and drop',
	'images/005.xhtml' => 'JPG image drag and drop',
	'overlay/022.xhtml' => 'Block element drag and drop: changing draggable attribute',
	'overlay/023.xhtml' => 'Link drag and drop: changing draggable attribute',
	'overlay/024.xhtml' => 'PNG image drag and drop: changing draggable attribute',
	'overlay/025.xhtml' => 'SVG image drag and drop: changing draggable attribute',
	'reload/001.xhtml' => 'Reload during Canvas drag and drop roundtrip',
	'reload/002.xhtml' => 'Reload during PNG image drag and drop roundtrip',
	'reload/002D.xhtml' => 'Reload during PNG image drag and drop roundtrip',
	'reload/003.xhtml' => 'Reload during SVG image drag and drop roundtrip',
	'reload/003D.xhtml' => 'Reload during SVG image drag and drop roundtrip',
	'reload/004.xhtml' => 'Reload during text input selection drag and drop roundtrip',
	'reload/004D.xhtml' => 'Reload during text input selection drag and drop roundtrip',
	'reload/004DN.xhtml' => 'Reload during text input selection drag and drop roundtrip',
	'reload/004N.xhtml' => 'Reload during text input selection drag and drop roundtrip',
	'reload/005.xhtml' => 'Reload during selection drag and drop roundtrip',
	'reload/005R.xhtml' => 'Reload during selection drag and drop roundtrip',
	'reload/005RN.xhtml' => 'Reload during selection drag and drop roundtrip',
	'reload/006.xhtml' => 'Reload during link drag and drop roundtrip',
	'reload/006D.xhtml' => 'Reload during link drag and drop roundtrip',
	'reload/006R.xhtml' => 'Reload during link drag and drop roundtrip',
	'reload/007.xhtml' => 'Drag and drop roundtrip with text/plain data',
	'reload/007R.xhtml' => 'Reload during drag and drop roundtrip with text/plain data',
	'reload/008.xhtml' => 'Drag and drop roundtrip with text/uri-list data',
	'reload/008R.xhtml' => 'Reload during drag and drop roundtrip with text/uri-list data',
	'roundtrip/001.xhtml' => 'Canvas drag and drop roundtrip',
	'roundtrip/002.xhtml' => 'PNG image drag and drop roundtrip',
	'roundtrip/002D.xhtml' => 'PNG image drag and drop roundtrip',
	'roundtrip/003.xhtml' => 'SVG image drag and drop roundtrip',
	'roundtrip/003D.xhtml' => 'SVG image drag and drop roundtrip',
	'roundtrip/004.xhtml' => 'Text input selection drag and drop roundtrip',
	'roundtrip/004N.xhtml' => 'Text input selection drag and drop roundtrip',
	'roundtrip/005.xhtml' => 'Selection drag and drop roundtrip',
	'roundtrip/005R.xhtml' => 'Selection drag and drop roundtrip',
	'roundtrip/005RN.xhtml' => 'Selection drag and drop roundtrip',
	'roundtrip/006.xhtml' => 'Link drag and drop roundtrip',
	'roundtrip/006D.xhtml' => 'Link drag and drop roundtrip',
	'roundtrip/006R.xhtml' => 'Link drag and drop roundtrip',
	'roundtrip/007.xhtml' => 'Drag and drop roundtrip with text/plain data',
	'roundtrip/007R.xhtml' => 'Drag and drop roundtrip with text/plain data',
	'roundtrip/008.xhtml' => 'Drag and drop roundtrip with text/uri-list data',
	'roundtrip/008R.xhtml' => 'Drag and drop roundtrip with text/uri-list data',
	'selection/001.xhtml' => 'Selection drag and drop from text input to block element',
	'selection/001N.xhtml' => 'Selection drag and drop from text input to block element',
	'selection/002.xhtml' => 'Selection drag and drop from search input to block element',
	'selection/002N.xhtml' => 'Selection drag and drop from search input to block element',
	'selection/003.xhtml' => 'Selection drag and drop from tel input to block element',
	'selection/003N.xhtml' => 'Selection drag and drop from tel input to block element',
	'selection/004.xhtml' => 'Selection drag and drop from url input to block element',
	'selection/004N.xhtml' => 'Selection drag and drop from url input to block element',
	'selection/005.xhtml' => 'Selection drag and drop from email input to block element',
	'selection/005N.xhtml' => 'Selection drag and drop from email input to block element',
	'selection/006.xhtml' => 'Selection drag and drop from number input to block element',
	'selection/006N.xhtml' => 'Selection drag and drop from number input to block element',
	'selection/007.xhtml' => 'Selection drag and drop from short text input to block element',
	'selection/007N.xhtml' => 'Selection drag and drop from short text input to block element',
	'selection/008.xhtml' => 'Selection drag and drop from password input to block element',
	'selection/008N.xhtml' => 'Selection drag and drop from password input to block element',
	'selection/009.xhtml' => 'Selection drag and drop from readonly text input to block element',
	'selection/009N.xhtml' => 'Selection drag and drop from readonly text input to block element',
	'selection/010.xhtml' => 'Selection drag and drop from texarea to block element',
	'selection/010N.xhtml' => 'Selection drag and drop from texarea to block element',
	'selection/011.xhtml' => 'Selection drag and drop from text input to textarea',
	'selection/011N.xhtml' => 'Selection drag and drop from text input to textarea',
	'selection/012.xhtml' => 'Selection drag and drop from search input to textarea',
	'selection/012N.xhtml' => 'Selection drag and drop from search input to textarea',
	'selection/013.xhtml' => 'Selection drag and drop from tel input to textarea',
	'selection/013N.xhtml' => 'Selection drag and drop from tel input to textarea',
	'selection/014.xhtml' => 'Selection drag and drop from url input to textarea',
	'selection/014N.xhtml' => 'Selection drag and drop from url input to textarea',
	'selection/015.xhtml' => 'Selection drag and drop from email input to textarea',
	'selection/015N.xhtml' => 'Selection drag and drop from email input to textarea',
	'selection/016.xhtml' => 'Selection drag and drop from number input to textarea',
	'selection/016N.xhtml' => 'Selection drag and drop from number input to textarea',
	'selection/017.xhtml' => 'Selection drag and drop from short text input to textarea',
	'selection/017N.xhtml' => 'Selection drag and drop from short text input to textarea',
	'selection/018.xhtml' => 'Selection drag and drop from password input to textarea',
	'selection/018N.xhtml' => 'Selection drag and drop from password input to textarea',
	'selection/019.xhtml' => 'Selection drag and drop from readonly input to textarea',
	'selection/019N.xhtml' => 'Selection drag and drop from readonly input to textarea',
	'selection/020.xhtml' => 'Selection drag and drop between textareas',
	'selection/020N.xhtml' => 'Selection drag and drop between textareas',
	'selection/021.xhtml' => 'Selection drag and drop from text input to contenteditable element',
	'selection/021N.xhtml' => 'Selection drag and drop from text input to contenteditable element',
	'selection/022.xhtml' => 'Selection drag and drop from search input to contenteditable element',
	'selection/022N.xhtml' => 'Selection drag and drop from search input to contenteditable element',
	'selection/023.xhtml' => 'Selection drag and drop from tel input to contenteditable element',
	'selection/023N.xhtml' => 'Selection drag and drop from tel input to contenteditable element',
	'selection/024.xhtml' => 'Selection drag and drop from url input to contenteditable element',
	'selection/024N.xhtml' => 'Selection drag and drop from url input to contenteditable element',
	'selection/025.xhtml' => 'Selection drag and drop from email input to contenteditable element',
	'selection/025N.xhtml' => 'Selection drag and drop from email input to contenteditable element',
	'selection/026.xhtml' => 'Selection drag and drop from number input to contenteditable element',
	'selection/026N.xhtml' => 'Selection drag and drop from number input to contenteditable element',
	'selection/027.xhtml' => 'Selection drag and drop from short text input to contenteditable element',
	'selection/027N.xhtml' => 'Selection drag and drop from short text input to contenteditable element',
	'selection/028.xhtml' => 'Selection drag and drop from password input to contenteditable element',
	'selection/028N.xhtml' => 'Selection drag and drop from password input to contenteditable element',
	'selection/029.xhtml' => 'Selection drag and drop from readonly text input to contenteditable element',
	'selection/029N.xhtml' => 'Selection drag and drop from readonly text input to contenteditable element',
	'selection/030.xhtml' => 'Selection drag and drop from textarea to contenteditable element',
	'selection/030N.xhtml' => 'Selection drag and drop from textarea to contenteditable element',
	'selection/031.xhtml' => 'Dragging two lines of text selection from textarea to block element',
	'selection/032.xhtml' => 'Dragging multiline text selection from textarea to block element',
	'selection/033.xhtml' => 'Dragging two lines of text selection between textareas',
	'selection/034.xhtml' => 'Dragging multiline text selection between textareas',
	'selection/035.xhtml' => 'Dragging two lines of text selection from textarea to contenteditable element',
	'selection/036.xhtml' => 'Dragging multiline text selection from textarea to contenteditable element',
	'selection/071.xhtml' => 'Selection drag and drop between text inputs of different size',
	'selection/071N.xhtml' => 'Selection drag and drop between text inputs of different size',
	'selection/072.xhtml' => 'Selection drag and drop from search to text input',
	'selection/072N.xhtml' => 'Selection drag and drop from search to text input',
	'selection/073.xhtml' => 'Selection drag and drop from tel to text input',
	'selection/073N.xhtml' => 'Selection drag and drop from tel to text input',
	'selection/074.xhtml' => 'Selection drag and drop from url to text input',
	'selection/074N.xhtml' => 'Selection drag and drop from url to text input',
	'selection/075.xhtml' => 'Selection drag and drop from email to text input',
	'selection/075N.xhtml' => 'Selection drag and drop from email to text input',
	'selection/076.xhtml' => 'Selection drag and drop from number to text input',
	'selection/076N.xhtml' => 'Selection drag and drop from number to text input',
	'selection/077.xhtml' => 'Selection drag and drop from short text input to another text input',
	'selection/077N.xhtml' => 'Selection drag and drop from short text input to another text input',
	'selection/078.xhtml' => 'Selection drag and drop from password to text input',
	'selection/078N.xhtml' => 'Selection drag and drop from password to text input',
	'selection/079.xhtml' => 'Selection drag and drop from readonly text input to another text input',
	'selection/079N.xhtml' => 'Selection drag and drop from readonly text input to another text input',
	'selection/080.xhtml' => 'Selection drag and drop from textarea to text input',
	'selection/080N.xhtml' => 'Selection drag and drop from textarea to text input',
	'selection/081.xhtml' => 'Events during selection drag and drop to text input',
	'selection/081N.xhtml' => 'Events during selection drag and drop to text input',
	'selection/082.xhtml' => 'Events during selection drag and drop to search input',
	'selection/082N.xhtml' => 'Events during selection drag and drop to search input',
	'selection/083.xhtml' => 'Events during selection drag and drop to tel input',
	'selection/083N.xhtml' => 'Events during selection drag and drop to tel input',
	'selection/084.xhtml' => 'Events during selection drag and drop to url input',
	'selection/084N.xhtml' => 'Events during selection drag and drop to url input',
	'selection/085.xhtml' => 'Events during selection drag and drop to email input',
	'selection/085N.xhtml' => 'Events during selection drag and drop to email input',
	'selection/086.xhtml' => 'Events during selection drag and drop to number input',
	'selection/086N.xhtml' => 'Events during selection drag and drop to number input',
	'selection/109.xhtml' => 'RTL text selection drag and drop from text input to RTL textarea',
	'selection/110.xhtml' => 'RTL text selection drag and drop from text input to textarea',
	'selection/111.xhtml' => 'RTL text selection drag and drop from RTL element to textarea',
	'selection/112.xhtml' => 'RTL text selection drag and drop to textarea',
	'selection/112N.xhtml' => 'RTL text selection drag and drop to textarea',
	'selection/113.xhtml' => 'RTL text selection drag and drop between textareas',
	'selection/113N.xhtml' => 'RTL text selection drag and drop between textareas',
	'selection/114.xhtml' => 'RTL text selection drag and drop between RTL textareas',
	'selection/114N.xhtml' => 'RTL text selection drag and drop between RTL textareas',
	'selection/115.xhtml' => 'RTL text selection drag and drop between RTL inputs',
	'selection/116.xhtml' => 'RTL text selection drag and drop between text inputs',
	'selection/117.xhtml' => 'RTL text selection drag and drop from RTL element to text input',
	'selection/118.xhtml' => 'RTL text selection drag and drop to text input',
	'selection/118N.xhtml' => 'RTL text selection drag and drop to text input',
	'selection/119.xhtml' => 'RTL text selection drag and drop from textarea to RTL text input',
	'selection/119N.xhtml' => 'RTL text selection drag and drop from textarea to RTL text input',
	'selection/120.xhtml' => 'RTL text selection drag and drop from textarea to text input',
	'selection/120N.xhtml' => 'RTL text selection drag and drop from textarea to text input',
	'selection/121.xhtml' => 'RTL text selection drag and drop from RTL text input to contenteditable element',
	'selection/121N.xhtml' => 'RTL text selection drag and drop from RTL text input to contenteditable element',
	'selection/122.xhtml' => 'RTL text selection drag and drop from text input to contenteditable element',
	'selection/122N.xhtml' => 'RTL text selection drag and drop from text input to contenteditable element',
	'selection/123.xhtml' => 'RTL text selection drag and drop from RTL element to contenteditable element',
	'selection/124.xhtml' => 'RTL text selection drag and drop to contenteditable element',
	'selection/124N.xhtml' => 'RTL text selection drag and drop to contenteditable element',
	'selection/125.xhtml' => 'RTL text selection drag and drop from textarea to RTL contenteditable element',
	'selection/125N.xhtml' => 'RTL text selection drag and drop from textarea to RTL contenteditable element',
	'selection/126.xhtml' => 'RTL text selection drag and drop from textarea to contenteditable element',
	'selection/126N.xhtml' => 'RTL text selection drag and drop from textarea to contenteditable element',
	'selection/127.xhtml' => 'RTL text selection drag and drop from text input to RTL element',
	'selection/127N.xhtml' => 'RTL text selection drag and drop from text input to RTL element',
	'selection/128.xhtml' => 'RTL text selection drag and drop from text input to block element',
	'selection/128N.xhtml' => 'RTL text selection drag and drop from text input to block element',
	'selection/129.xhtml' => 'RTL text selection drag and drop from RTL element to another RTL element',
	'selection/130.xhtml' => 'RTL text selection drag and drop to block element',
	'selection/130N.xhtml' => 'RTL text selection drag and drop to block element',
	'selection/131.xhtml' => 'RTL text selection drag and drop from textarea to block element',
	'selection/131N.xhtml' => 'RTL text selection drag and drop from textarea to block element',
	'selection/132.xhtml' => 'RTL text selection drag and drop from RTL textarea to block element',
	'selection/132N.xhtml' => 'RTL text selection drag and drop from RTL textarea to block element',
	'selection/133.xhtml' => 'Multielement selection drag and drop',
	'selection/134N.xhtml' => 'Drag and drop after selecting whole page content',
	'selection/136.xhtml' => 'BiDi text selection drag and drop to textarea',
	'selection/136N.xhtml' => 'BiDi text selection drag and drop to textarea',
	'selection/137.xhtml' => 'Multielement BiDi text selection drag and drop to textarea',
	'selection/137N.xhtml' => 'Multielement BiDi text selection drag and drop to textarea',
	'selection/138.xhtml' => 'BiDi text selection drag and drop from text input to textarea',
	'selection/138N.xhtml' => 'BiDi text selection drag and drop from text input to textarea',
	'selection/139.xhtml' => 'BiDi text selection drag and drop between textareas',
	'selection/139N.xhtml' => 'BiDi text selection drag and drop between textareas',
	'selection/140.xhtml' => 'BiDi text selection drag and drop between text inputs',
	'selection/140N.xhtml' => 'BiDi text selection drag and drop between text inputs',
	'selection/141.xhtml' => 'BiDi text selection drag and drop to contenteditable element',
	'selection/141N.xhtml' => 'BiDi text selection drag and drop to contenteditable element',
	'selection/142.xhtml' => 'BiDi text selection drag and drop to block element',
	'selection/142N.xhtml' => 'BiDi text selection drag and drop to block element',
	'selection/143.xhtml' => 'Large text selection drag and drop',
	'selection/144.xhtml' => 'Selection drag and drop from text input and text/plain aliases',
	'selection/144N.xhtml' => 'Selection drag and drop from text input and text/plain aliases',
	'selection/145.xhtml' => 'Selection drag and drop from inline element and text/plain aliases',
	'selection/145N.xhtml' => 'Selection drag and drop from inline element and text/plain aliases',
	'selection/146.xhtml' => 'Selection drag and drop and text/plain aliases',
	'selection/146N.xhtml' => 'Selection drag and drop and text/plain aliases',
	'selection/151.xhtml' => 'Dropping selection in readonly text input',
	'selection/151N.xhtml' => 'Dropping selection in readonly text input',
	'selection/152.xhtml' => 'Dropping selection in readonly textarea',
	'selection/152N.xhtml' => 'Dropping selection in readonly textarea',
	'selection/153.xhtml' => 'Dropping selection from text input into readonly text input',
	'selection/153N.xhtml' => 'Dropping selection from text input into readonly text input',
	'selection/154.xhtml' => 'Dropping selection from text input into readonly textarea',
	'selection/154N.xhtml' => 'Dropping selection from text input into readonly textarea',
	'selection/155.xhtml' => 'Selection drag and drop from readonly textarea to block element',
	'selection/155N.xhtml' => 'Selection drag and drop from readonly textarea to block element',
	'selection/156.xhtml' => 'Selection drag and drop between text inputs',
	'selection/156N.xhtml' => 'Selection drag and drop between text inputs',
	'selection/157.xhtml' => 'Selection drag and drop between search inputs',
	'selection/157N.xhtml' => 'Selection drag and drop between search inputs',
	'selection/158.xhtml' => 'Selection drag and drop between tel inputs',
	'selection/158N.xhtml' => 'Selection drag and drop between tel inputs',
	'selection/159.xhtml' => 'Selection drag and drop between url inputs',
	'selection/159N.xhtml' => 'Selection drag and drop between url inputs',
	'selection/160.xhtml' => 'Selection drag and drop between email inputs',
	'selection/160N.xhtml' => 'Selection drag and drop between email inputs',
	'selection/161.xhtml' => 'Selection drag and drop between number inputs',
	'selection/161N.xhtml' => 'Selection drag and drop between number inputs',
	'selection/162.xhtml' => 'Selection drag and drop between contenteditable elements',
	'selection/162A.xhtml' => 'Selection drag and drop between contenteditable elements',
	'selection/162N.xhtml' => 'Selection drag and drop between contenteditable elements',
	'selection/171.xhtml' => 'Dragging text selection from scrollable container to block element',
	'selection/171N.xhtml' => 'Dragging text selection from scrollable container to block element',
	'svg/021.xhtml' => 'Dragging selection from SVG text element to XHTML element',
	'svg/022.xhtml' => 'Dragging selection from SVG editable text element to XHTML element',
	'svg/024.xhtml' => 'Dragging selection from SVG text element to contenteditable element',
	'svg/025.xhtml' => 'Dragging selection from editable SVG text element to contenteditable element',
	'svg/027.xhtml' => 'Dragging selection from SVG text element to XHTML textarea',
	'svg/028.xhtml' => 'Dragging selection from SVG editable text element to XHTML textarea',
	'svg/030.xhtml' => 'SVG image drag and drop',
	'svg/031.xhtml' => 'SVG dataURL image drag and drop',
	);
foreach my $tc (sort keys %tests)
	{my ($url,$title) = ($baseURL.$tc,$tests{$tc});
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
			{if($tail == 1)
				{$tail = 0;
				print "\n";}
			if($wait == 6)
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
			if($tc =~ /N\.xhtml$/)
				{my @tan = @{$abcd{'tan'}};
				CT::Select($tan[0]+2,MiddleY(@{$abcd{'tan'}}),$tan[2],MiddleY(@{$abcd{'tan'}}));}
			my ($left,$top) = CT::RelativeXY(1,1);
			CT::MouseMove(Center(@{$abcd{'tan'}}));
			CT::MouseDown();
			CT::MouseMove(Center(@{$abcd{'tan'}}),MiddleX(@{$abcd{'tan'}}),$top);
			CT::MouseMove(MiddleX(@{$abcd{'tan'}}),$top,$left,$top);
			if($tc =~ /scrollbars|images\/0(1[5-8]|2[1-4]).xhtml$/)
				{CT::MouseMove($left,$top,$left,@{$abcd{'steelblue'}}[1]+8);
				CT::MouseMove($left,@{$abcd{'steelblue'}}[1]+8,@{$abcd{'steelblue'}}[0]+8,@{$abcd{'steelblue'}}[1]+8);}
			else
				{CT::MouseMove($left,$top,$left,MiddleY(@{$abcd{'steelblue'}}));
				CT::MouseMove($left,MiddleY(@{$abcd{'steelblue'}}),Center(@{$abcd{'steelblue'}}));}
			CT::MouseUp();
			if($tc =~ /contenteditable\/00[16]N?\.xhtml$/)
				{CT::Click(Center(@{$abcd{'steelblue'}}));}
			elsif($tc =~ /selection\/08[1-6]N?\.xhtml$/)
				{CT::Click(Center(@{$abcd{'tan'}}));}
			CT::Result(CT::Colors('forestgreen'),$title."\n".$url);}
		}
	}
CT::Results();
sub MiddleX
	{return int(($_[0]+$_[2])/2);}
sub MiddleY
	{return int(($_[1]+$_[3])/2);}
sub Center
	{return (MiddleX(@_),MiddleY(@_));}