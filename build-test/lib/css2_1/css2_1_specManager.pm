#
# CSS Test Suite css2_1 spec manager
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
package css2_1_specManager;
use base specManager;
use strict;
use utf8;

# Author: Tom Harms
# Version specific methods
sub new {
    my $class = shift;
    my $self = bless {}, $class;
    return $self->_init(@_);
}

sub _init {
    my $self = shift;
    $self->SUPER::_init(@_);
    my $paramHash = shift;
    foreach my $key (keys %$paramHash) {
	$self->{$key} = $paramHash->{$key};
    }

    # Set these strings for each 
    $self->{specVersion} = 'css2_1';
    $self->{specRoot} = $self->{specBaseUrl} . 'CSS21';
    $self->{dataDir} = 'css2_1/data/';
    $self->{tocDataFile} = $self->{dataDir} . 'sections.dat';
    return $self;
}

# scrapeTOCData
# Scrape a TOC page and store section info in tocData
sub scrapeTOCData {
    my $self = shift;
    my $url = $self->{specRoot};
    my $spec = $self->getHTML($url);
    $spec =~ m/name="toc"/gos; # skip past the minitoc
    my $regString = '<a href="([^"]+)" class="tocxref">(Appendix )?([A-Z]?[0-9.]+) (.+?)<\/a>';
    while ($spec =~ m/$regString/gos) { 
	my $uri = $1;
	my $section = $3;
	my $title = $4;
	$section =~ s/\.$//gos;
	$title =~ s/<[^>]+>//gos;
	my $code = $self->sectionToCode($section);
	push @{$self->{tocData}},{'uri'=>$uri,
				  'title'=>$title,
				  'section'=>$section,
				  'code'=>$code};
    }

}

# writeIndexFiles
# method to write index files (and for this spec 
#   per chapter files).  
sub writeIndexFiles {
    my $self = shift;
    my $args = shift;
    my $dataSource = $args->{dataSource};
    my $files = $args->{files};

    # Loop through all of the files and index them
    foreach my $file (@$files) {
	$self->indexSingleTestFile({'file'=>$file});
    }

    # Load the TOC data (from web or from storage)
    $self->loadTOCData({dataSource=>$dataSource});

    # set some variables for convenience/readibility
    my $tocData = $self->{tocData};
    my $specroot = $self->{specRoot};
    my $specVersion = $self->{specVersion};
    my $output = $args->{output} || "tests/$specVersion/";
    my %linkindex = %{$self->{linkindex}};
    my %testdata = %{$self->{testdata}};
    my %processedLinks = ();

    # Build the hash we'll pass to template toolkit for 
    # building the index file
    my $chapters = {};
    my $chapterCounts = {};
    my $orderedChapters = [];
    my $chapterTocData = {};


    foreach my $entry (@$tocData) {
	my $uri = $entry->{uri};


	if ($uri =~/$specroot\/(.+)\s?/) {
	    $uri = $1;
	}

	my $section = $entry->{section};
	my ($chapter,$junk) = split /\./,$section,2;
	push @{$chapterTocData->{$chapter}},$entry;
	unless ($chapters->{$chapter}) {
	    $chapterCounts->{$chapter} = 0;
	    my $title = $entry->{title};
	    push @$orderedChapters,{'title'=>$title,
				   'chapter'=>$chapter} if $chapter;
	    $chapters->{$chapter}->{chapterTitle} ||= $title;;
	    my $isAppendix = 1;
	    if ($chapter =~ /\d+/) {
		$isAppendix = 0;
	    }
	    $chapters->{$chapter}->{isAppendix} = $isAppendix;
	}

	$entry->{chapter} = $chapter;
	$entry->{tests} = [];

	if (defined $linkindex{$uri}) {
	    $processedLinks{$uri} = 1;
	    foreach my $testFile (@{$linkindex{$uri}}) {
		my %data = %{$testdata{$testFile}};
		$data{file} = $testFile;
		# highlight and ID test if this is its primary section
		#my ($hlstart, $hlend, $idstr) = ('', '', '');
		my $primary=0;
		if ($data{'primary'} eq $uri) {
		    $data{'isPrimary'} = 1;
		}
		$chapterCounts->{$chapter}+=1;
		push @{$entry->{tests}},\%data;
		$self->{processedTests}++;
	    }
	} 
    }


    # Add counts to ordered chapters
    foreach my $chapter (@$orderedChapters) {
	$chapter->{testCount} = $chapterCounts->{$chapter->{chapter}} || '0';
    }



    # Report on any tests that were not processed
    foreach my $uri (keys %linkindex) {
	unless ($processedLinks{$uri}) {
	    my @testsNotProcessed = @{$linkindex{$uri}};
	    push @{$self->{errors}}, "did not process $uri affecting " . $#testsNotProcessed . " tests";
	}
    }




    # Now we create an index file that points to the individual chapter 
    # files
    my $pwd = $ENV{'PWD'};
    my $tmpl_dir = $pwd . "/templates/$specVersion";
    my $tt2 = Template->new({ INCLUDE_PATH => $tmpl_dir }) || die "$Template::ERROR\n";
    $tt2->process('sectionIndex.tmpl',
		 { chapters=>$orderedChapters,
		   extension=>'xht',
		   specroot=>$specroot},
		  $output . 'sectionIndex.xht')
	|| die $tt2->error(), "\n";
    $tt2->process('sectionIndex.tmpl',
		 { chapters=>$orderedChapters,
		   extension=>'htm',
		   specroot=>$specroot},
		  $output . 'sectionIndex.htm')
	|| die $tt2->error(), "\n";

    # Create the individual chapter files
    foreach my $chapter (keys %$chapters ) {
	$tt2->process('singleChapter.tmpl',
		      { tocData => $chapterTocData->{$chapter},
			chapter=>$chapter,
			extension=>'xht',
			isAppendix=>$chapters->{$chapter}->{isAppendix},
			chapterTitle=>$chapters->{$chapter}->{chapterTitle},
			chapterCount=>$chapterCounts->{$chapter},
			specroot=>$specroot},
		      $output . "chapter-$chapter.xht")
	    || die $tt2->error(), "\n";		          

	$tt2->process('singleChapter.tmpl',
		      { tocData => $chapterTocData->{$chapter},
			chapter=>$chapter,
			extension=>'htm',
			isAppendix=>$chapters->{$chapter}->{isAppendix},
			chapterTitle=>$chapters->{$chapter}->{chapterTitle},
			chapterCount=>$chapterCounts->{$chapter},
			specroot=>$specroot},
		      $output . "chapter-$chapter.htm")
	    || die $tt2->error(), "\n";		          

    }
}

# indexSingleTestFile
# scrape metadata from a single test
sub indexSingleTestFile {
    my $self = shift;
    my $params = shift;
    my $file = $params->{file};
    my $specVersion = $self->{specVersion};
    $file =~ m/^tests\/$specVersion\/(.+)\.(xht|xhtml)$/os;


    my $root = $1;

    my $data = $self->getHeadData({'file'=>$file,
				   'id'=>$root});
    my $links = $data->{links};
    if ($root =~ m/^t(\d\d)(\d\d)?(\d\d)?-[a-z0-9\-]+-([a-f])(?:-([a-z]+))?$/) {
	my @flags;
	my @letters = sort split //, $5 || '';
	foreach (@letters) {
	    my $flagToAdd = $self->{filenameflags}->{$_};
	    push @flags, $self->{flags}->{$flagToAdd};
	}
	push @{$data->{flags}},@flags;
    }
    elsif ($root =~ m/^[a-z\-\/]+-\d\d\d$/) {
    }
    else {
	print "!! Filename fails format test: $root\n";
	return;
    }
    
    # Build Test Database
    $self->storeTestData({file=>$root,
			  data=>$data});
    

    # Build Section-based Index
    foreach (@{$links}) {
	$self->{linkindex}->{$_} ||= []; # if (!exists($linkindex{$_}));
	push(@{$self->{linkindex}->{$_}}, $root);
    }
}    

# tweakLinks
# version Specific mucking with links as scraped from test head data
sub tweakLinks {
    my $self = shift;
    my $links = shift;
    my $specRoot = $self->{specRoot};
    my @matchedLinks;
    foreach (@$links) {
	my %propDefTranslations = ('text.html#propdef-text-align'=>'text.html#alignment-prop',
				   'tables.html#propdef-border-collapse'=>'tables.html#borders',
				   'visuren.html#propdef-direction'=>'visuren.html#direction',
				   'visuren.html#propdef-unicode-bidi'=>'visuren.html#direction',
				   'generate.html#propdef-content'=>'generate.html#content',
				   'colors.html#propdef-color','colors.html#colors');

	if (/href="$specRoot\/(.+?)"/) {
	    my $link = $1;
	    if ($propDefTranslations{$link}) {
		$link = $propDefTranslations{$link};
	    }	    
	    push @matchedLinks,$link;

	    #print "match for $file with $_\n";
	} else {
	    print "!! Link $_ does not match spec root $specRoot - ignoring \n";
	}

    }    
    return \@matchedLinks;
}
1;
