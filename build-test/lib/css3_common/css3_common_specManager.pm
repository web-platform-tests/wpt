#
# CSS Test Suite css3 spec manager
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
package css3_common_specManager;
use base specManager;
use strict;
use utf8;

# Author: Tom Harms
# Version specific methods for managing spec and test files
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

    $self->{dataDir} = $self->{specVersion} . '/data/';
    $self->{specRoot} = $self->{specBaseUrl} . $self->{specVersion};
    $self->{tocDataFile} = $self->{dataDir} . 'sections.dat';
    return $self;
}

sub scrapeTOCData {
    my $self = shift;
    my $url = $self->{specRoot};
    my $spec = $self->getHTML($url);
    my $newLineExp = '\x{D}\x{A}|\x{A}\{D}|\x{D}|\x{A}';
    $spec =~ s/$newLineExp/\n/gos; # normalize newlines
    $spec =~ s/\n//g;
    $spec =~ s/\s{2,}/ /g;
    # remove everything except the toc
    $spec =~ m/<!--begin-toc-->/gos;
    $spec =~ s/<!--end-toc-->.*//os;
    #my $regString = '<a href="([^"]+)"><span class=secno>([A-Z]?[0-9\.]+)\.\s*?<\/span>(.+?)<\/a>';
#my $regString = '<a href="([^"]+)" class="tocxref">Appendix ?([A-Z]?[0-9.]+) (.+?)<\/a>';
    

    my $regString = '<a href="([^"]+)"><span class="?secno"?>(\S+?)\s*?<\/span>(.+?)<\/a>'; 
    
    while ($spec =~ /$regString/gos) {

	my $uri = $1;
	my $section = $2;
	my $title = $3;

	my $code = '';
	foreach (split(/\./, $section)) {
	    $code .= length($_) < 2 ? "0$_" : "$_";
	}
	$title =~ s/&nbsp;/ /gos;
	$title =~ s/<[^>]+>//gos;
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
    my $outputPath = $args->{outputPath} || "tests/$specVersion/";
    my %linkindex = %{$self->{linkindex}};
    my %testdata = %{$self->{testdata}};
    my %processedLinks = ();

    # Build the hash we'll pass to template toolkit for 
    # building the index file
    #my $chapters = {};
    #my $chapterCounts = {};
    #my $orderedChapters = [];
    #my $chapterTocData = {};
    foreach my $entry (@$tocData) {
	my $uri = $entry->{uri};
	if ($uri =~/$specroot\/(.+)\s?/) {
	    $uri = $1;
	}

	my $section = $entry->{section};
	if (defined $linkindex{$uri}) {
	    $processedLinks{$uri} = 1;
	    foreach my $testFile (@{$linkindex{$uri}}) {
		my %data = %{$testdata{$testFile}};
		$data{file} = $testFile;
		# highlight and ID test if this is its primary section
		my $primary=0;
		if ($data{'primary'} eq $uri) {
		    $data{'isPrimary'} = 1;
		}
		$data{mainAssertion} = $data{assert}->[0];
		push @{$entry->{tests}},\%data;
		$self->{processedTests}++;
	    }
	} 
    }

    # Report on any tests that were not processed
    foreach my $uri (keys %linkindex) {
	unless ($processedLinks{$uri}) {
	    my @testsNotProcessed = @{$linkindex{$uri}};
	    push @{$self->{errors}}, "did not process $uri affecting " . $#testsNotProcessed . " tests";
	}
    }


    # Now we create an index file 
    my $pwd = $ENV{'PWD'};
    my $tmpl_dir1 = $pwd . "/templates/$specVersion";
    my $tmpl_dir2 = $pwd . "/templates/css3_common";
    my $tmpl_dir = $tmpl_dir1 . ':' . $tmpl_dir2;
    my $tt2 = Template->new({ INCLUDE_PATH => $tmpl_dir }) || die "$Template::ERROR\n";
    
    $tt2->process('sectionIndex.tmpl',
		  { tocData=>$tocData,
		    specVersionString=>$specVersion,
		    extension=>'xht',
		    specroot=>$specroot},
		  $outputPath . 'sectionIndex.xht')
	|| die $tt2->error(), "\n";

    $tt2->process('sectionIndex.tmpl',
		  { tocData=>$tocData,
		    extension=>'htm',
		    specVersionString=>$specVersion,
		    specroot=>$specroot},
		  $outputPath . 'sectionIndex.htm')
	|| die $tt2->error(), "\n";

}





sub indexSingleTestFile {
    my $self = shift;
    my $params = shift;
    my $file = $params->{file};
    my $specVersion = $self->{specVersion};
    $file =~ m/^tests\/$specVersion\/(.+)\.(xht|xhtml|xml)$/os;
    my $root = $1;
    my $data = $self->getHeadData({'file'=>$file,
				   'id'=>$root});
    my $links = $data->{links};
    
    # make sure all lowercase
    $root =~ tr/A-Z/a-z/;

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
    
    foreach (@$links) {
	my $regExp = 'href=".+?(#[^"]+)\s*?"';
	$_=~/$regExp/;
        $_ = $1;
    }
    
    return $links;
}
1;
