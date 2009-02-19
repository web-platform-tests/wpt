#
# CSS Test Suite specManager
# Version 1.0
#
# Copyright (c) 2009 by Tom Harms
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307
# USA

package specManager;
use strict;
use utf8;
use HTML::Entities qw(:DEFAULT);
use LWP::Simple;
use Template;


sub new {
    my $class = shift;
    my $self = bless {}, $class;
    return $self->_init(@_);
}

sub _init {
    my $self = shift;
    $self->{tocData} = [];
    $self->{specBaseUrl} = 'http://www.w3.org/TR/';
    my $flags = { 'ahem' => {title=>'Requires Ahem Font',
			     string=>'A'},
		  'dom' => {title=>'Requires DOM (Document Object Model) Support',
			    string=>'O'},
		  'font' => {title=>'Requires Special Font',
			     string=>'font'},
		  'history' => {title=>'Requires Session History',
				string=>'H'},
		  'image' => {title=>'Requires Bitmap Graphics Support',
			      string=>'G'},
		  'interact' => {title=>'Requires User Interaction',
				 string=>'I'},
		  'invalid' => {title=>'Tests Invalid CSS',
				string=>'invalid'},
		  'namespace' => {title=>'Requires XML Namespaces Support',
				  string=>'N'},
		  'paged' => {title=>'Test Only Valid for Paged Media',
			      string=>'P'},
		  'scroll' => {title=>'Test Only Valid for Continuous Media',
			       string=>'S'},
		  'svg' => {title=>'Requires SVG Support',
			    string=>'V'}};
    $self->{flags} = $flags;

    my $filenameflags = { 'a' => 'ahem',
			  'f' => 'frames',
			  'g' => 'image',
			  'h' => 'history',
			  'i' => 'interact',
			  'm' => 'mathml',
			  'n' => 'namespace',
			  'o' => 'dom',
			  'v' => 'svg'};
    $self->{filenameflags} = $filenameflags;
    $self->{errors} = [];
    my $pwd = $ENV{'PWD'};
    my $tmplDir = $pwd . '/templates/common';
    $self->{template} = Template->new({ INCLUDE_PATH => $tmplDir }) || die "$Template::ERROR\n";
    return $self;
}

# simple wrapper around LWP to grab data from URL
sub getHTML{
    my $self = shift;
    my $url = shift;

    my $html = get $url || die "could not load url $url\n";
    # Big string causing problems with decode_entities ... 
    # Not worth wrestling with.  I'll just take out nbsp
    # manually
    $html =~ s/&nbsp;/ /g;
    $html =~ s/\x{D}\x{A}|\x{A}\{D}|\x{D}|\x{A}/\n/gos; # normalize newlines
    #my $decodedHtml = decode_entities($html);
    #return $decodedHtml;
    return $html;
}

# helper function to convert section number of form 3.4.1 to code of form
# 030401 as used by section files
sub sectionToCode {
    my $self = shift;
    my $section = shift;
    my @sectionParts = split('\.',$section);
    my $sectionCode = '';
    foreach my $subSection (@sectionParts) {
	$sectionCode .= length($subSection) < 2 ? "0$subSection" : "$subSection";
    }    
    return $sectionCode;
}

# Takes saved TOC hash and saves to file 
sub saveTOCDataToFile {
    my $self = shift;
    my $outPath = $self->{tocDataFile};

    my $tocData = $self->{tocData};
    die "No data to save - TOC might be unavailable.\n" unless $tocData;
    open OUTFILE, ">$outPath" || 
	die "could not open path for TOC data file $outPath\n";
    foreach my $entry (@$tocData) {

	my $section = $entry->{section};
	my $sectionCode = $self->sectionToCode($section);
	my $link = $self->{specRoot} . '/' .$entry->{uri};
	
	#my $level = $entry->{level};
	my $title = $entry->{title};
	#my $type = $entry->{type}; #"main" or "appendix"
	print OUTFILE "$sectionCode $link $section $title\n";
    }
    close OUTFILE;
}

# Load data from version specific toc file into a hash keyed by
# one of the TOC fields
sub tocDataToHash {
    my $self = shift;
    my $key = shift || 'section';
    my $tocData = $self->{tocData};
    my $tocHash = {};
    foreach my $entry (@$tocData) {
	my $keyToUse = $entry->{$key};
	$tocHash->{$keyToUse} = $entry;
    }
    return $tocHash;
}


# Load data from version specific toc file into tocData array
# load a toc hash from a file
sub loadTOCDataFromFile {
    my $self = shift;
    open TOCDATA, "<" . $self->{tocDataFile} || 
	die "could not read " . $self->{tocDataFile} . "\n";
    while (<TOCDATA>) {
	chomp;
	next unless $_;
	my ($code,$uri,$section,$title) = split / /,$_,4;
	push @{$self->{tocData}},{'uri'=>$uri,
				  'title'=>$title,
				  'section'=>$section,
				  'code'=>$code};	
    }
}

# load toc data - either from file or from web depending on 
# presence of file and flag passed in
sub loadTOCData {
    my $self = shift;
    my $args = shift;

    # source can be 'file' or 'web'.  
    my $dataSource = $args->{dataSource} || 'file';
    my $fileExists = (-s $self->{tocDataFile});


    # If this is a web request OR if we don't have a toc data file in 
    # the appropriate directory, grab/refresh it from the web

    if ($dataSource eq 'file' and !$fileExists) {
	die "File Method Requested but file does not exist\n";
    } elsif ($dataSource eq 'web') {
	$self->scrapeTOCData();
	$self->saveTOCDataToFile();
    } else {
	$self->loadTOCDataFromFile();
    }
}

# helper routine to store test data in testdata hash
sub storeTestData {
    my $self = shift;
    my $args = shift;
    $self->{testdata}->{$args->{file}} = $args->{data};
}


# send the toc data to a template
sub tocDataToTemplate {
    my $self = shift;
    my $filename = shift;
    $self->{template}->process($filename . '.tmpl',
		 {tocData=>$self->{tocData}},
		 $filename)
	|| die $self->{template}->error(), "\n";
}

# scrape head data from a test file
sub getHeadData {
    my $self = shift;
    my $args = shift;
    my $file = $args->{file};
    my $id = $args->{id};
    my $titleString = $args->{titleString} || 'CSS Test: ';
    my $specRoot = $self->{specRoot};
    local $/ = undef;
    open FILE, $file || die "couldn't open file $file: $!";
    my $contents = <FILE>;
    close FILE;
    
    my @links = ();
    my %credits = ();
    my $title = $id;
    my @flags = ();
    my @assert = ();
    if ($contents =~ /<head.*?>(.*)<\/head\s*>/sm) {
	local $_ = $1;
	
	# Get title
	/<title.*?>(.*)<\/title\s*>/sm;
	$title = $1;
	$title =~ s/$titleString//;
	
	# Collect rel="help" URLs
	@links = /<link\s[^>]*?rel="\s*help\s*"[^>]*?>/gsm;
	my $links = $self->tweakLinks(\@links);
	@links = @$links;

	# Collect rel="author" information
	my @credits = /<link\s[^>]*?rel="\s*author\s*"[^>]*?>/gsm;
	

	foreach (@credits) {
	    my $url;
	    if (/href="\s*(.+?)\s*"/) {
		$url = $1;
	    }
	    if (/title="\s*(.+?)\s*"/) {
		$credits{$1} = $url;
	    }
	    else {
		print "!! Missing Author Name: $_\n";
	    }
	}

	
	# Get flags
	if (/(<meta\s[^>]*?name="\s*flags\s*".*?>)/sm) {
	    my $flags = $1;
	    $flags =~ /\s*content="\s*([a-zA-Z\-\s]*?)\s*"\s*/sm;
	    @flags = sort split /\s/sm, $1;
	}
	
	#Get test assertion
	if ($self->{useAssertions} eq 'true') {
	    @assert = /<meta\s[^>]*?name="\s*assert\s*".*?>/gsm;
	    for (@assert) {
		$_ =~ /\s*content="\s*(.*?)\s*"\s*/sm;
		$_ = $1;
	    }
	}
    }

    # Take each flag and transform it into a title and a string for display
    my $flagList = [];
    my @flagAbbreviations = ();
    foreach (@flags) {
	push @$flagList,$self->{flags}->{$_};
	push @flagAbbreviations,$self->{flags}->{$_}->{string};
    }

    my %data;
    $data{'title'} = $title;
    $data{'links'} = \@links;
    $data{'primary'} = $links[0];
    $data{'flags'} = $flagList;
    $data{'flagAbbreviations'} = \@flagAbbreviations;
    $data{'credits'} = \%credits;
    $data{'assert'} = \@assert;
    return (\%data);
}    

# write a file with list of test contributors' credit info
sub saveCreditsData {
    my $self = shift;
    my $output = shift;
    my %testdata = %{$self->{testdata}};
    my %credits;
    foreach my $test (values %testdata) {
	foreach my $name (keys %{$test->{'credits'}}) {
	    $credits{$name} ||= $test->{'credits'}->{$name}
	    if ($name ne 'CSS1 Test Suite Contributors');
	} 
    }
    
    $self->{template}->process('contributors.data.tmpl',
		 { contributors => \%credits },
		 $output)
	|| die $self->{template}->error(), "\n";
}

# write a file with info for all tests in testinfo hash 
sub saveTestData {
    my $self = shift;
    my $output = shift;
    my $testdata = $self->{testdata};
    $self->{template}->process('testinfo.data.tmpl',
			       { testdata => $testdata },
			       $output)
	|| die $self->{template}->error(), "\n";
}

1;
