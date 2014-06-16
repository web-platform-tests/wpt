# This module written by fantasai
package indexer;
use strict;
use utf8;
use Template;

# Usage:
# init('Spec Root URL', 'path/to/template.xht', 'Test Suite Title: ')
# foreach test
#   index('path/to/test.xht','testid')
# save('path/to/save/index.xht')

# 'Spec Root URL' is e.g. 'http://www.w3.org/TR/CSS21/'
# The template must have lines of the form <!-- TESTS 3.2 <third.html#sec2> -->
# where third.html#sec2 matches the rel="help" links

my %flags = ( 'ahem' => '<abbr title="Requires Ahem Font">A</abbr>',
              'dom' => '<abbr title="Requires DOM (Document Object Model) Support">O</abbr>',
              'font' => '<abbr title="Requires Special Font">font</abbr>',
              'history' => '<abbr title="Requires Session History">H</abbr>',
              'image' => '<abbr title="Requires Bitmap Graphics Support">G</abbr>',
              'interact' => '<abbr title="Requires User Interaction">I</abbr>',
              'invalid' => '<abbr title="Tests Invalid CSS">invalid</abbr>',
              'namespace' => '<abbr title="Requires XML Namespaces Support">N</abbr>',
              'paged' => '<abbr title="Test Only Valid for Paged Media">P</abbr>',
              'scroll' => '<abbr title="Test Only Valid for Continuous Media">S</abbr>',
              'svg' => '<abbr title="Requires SVG Support">V</abbr>');

my %filenameflags = ( 'a' => 'ahem',
                      'f' => 'frames',
                      'g' => 'image',
                      'h' => 'history',
                      'i' => 'interact',
                      'm' => 'mathml',
                      'n' => 'namespace',
                      'o' => 'dom',
                      'v' => 'svg');

# Template Engine

my $libroot = $INC{'indexer.pm'};
$libroot =~ s/indexer.pm//;
my $tt = Template->new({ INCLUDE_PATH => $libroot . 'templates/' }) || die "$Template::ERROR\n";

# Local Data

my %testdata = ();
my %linkindex = ();

my $specroot = '';
my $template = '';
my $titlestr = '';

sub init {
  $specroot = shift @_;
  $template = shift @_;
  $titlestr = shift @_;
}

sub index {
  my $file = shift @_;
  my $id = shift @_;
  my %data = ();

  # Collect Metadata

  my ($title, $links, $flags, $credits, $assert) = getHeadData($file, $id);
  $data{'title'} = $title;
  $data{'links'} = $links;
  $data{'primary'} = $links->[0];
  $data{'flags'} = $flags;
  $data{'credits'} = $credits;
  $data{'assert'} = $assert;
  if ($id =~ m/^t(\d\d)(\d\d)?(\d\d)?-[a-z0-9\-]+-([a-f])(?:-([a-z]+))?$/) {
    my @flags;
    my @letters = sort split //, $5 || '';
    foreach (@letters) {
      push @flags, $filenameflags{$_};
    }
    $data{'flags'} = \@flags;
  }
  elsif ($id =~ m/^[a-z\-]+-\d\d\d$/) {
  }
  else {
    print "!! Filename fails format test: $id\n";
    return;
  }

  # Build Test Database
  $testdata{$id} = \%data;

  # Build Section-based Index
  foreach (@{$links}) {
    $linkindex{$_} = [] if (!exists($linkindex{$_}));
    push(@{$linkindex{$_}}, $id);
  }
}

sub getHeadData {
  # Get contents
  my $file = shift @_;
  my $id = shift @_;
  local $/ = undef;
  open FILE, $file || die "couldn't open file $file: $!";
  my $contents = <FILE>;
  close FILE;

  my @links = ();
  my %credits = ();
  my $title = $id;
  my @flags = ();
  my $assert = '';
  if ($contents =~ /<head.*?>(.*)<\/head\s*>/sm) {
    local $_ = $1;

    # Get title
    /<title.*?>(.*)<\/title\s*>/sm;
    $title = $1;
    $title =~ s/$titlestr//;

    # Collect rel="help" URLs
    @links = /<link\s[^>]*?rel="\s*help\s*"[^>]*?>/gsm;
    foreach (@links) {
      if (/href="$specroot(.+?)"/) {
        $_ = $1;
      }
      else {
        print "!! Mismatched \$specroot: $_\n";
      }
    }

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

    # Get test assertion
    if (/(<meta\s[^>]*?name="\s*assert\s*".*?>)/sm) {
      $assert = $1;
      $assert =~ /\s*content="\s*(.*?)\s*"\s*/sm;
      $assert = $1;
    }

  }
  return ($title, \@links, \@flags, \%credits, $assert);
}

sub saveCreditsData {
  my $output = shift @_;

  my %credits;
  foreach my $test (values %testdata) {
    foreach my $name (keys %{$test->{'credits'}}) {
      $credits{$name} ||= $test->{'credits'}->{$name}
        if ($name ne 'CSS1 Test Suite Contributors');
    } 
  }

  $tt->process('contributors.data.tmpl',
               { contributors => \%credits },
               $output)
  || die $tt->error(), "\n";
}

sub saveTestData {
  my $output = shift @_;

  $tt->process('testinfo.data.tmpl',
               { testdata => \%testdata },
               $output)
  || die $tt->error(), "\n";
}

sub saveSectionIndex {
  my $output = shift @_;

  open TMPL, $template or die "index::sections could not open template $template: $!";
  open OUT, ">$output" or die "index::sections could not open output file $output: $!";

  while (<TMPL>) {
    if (/(\s*)<!-- TESTS [A-Z\d\.]+ <(.+)> -->/) {
      my ($indent, $section) = ($1, $2);

      next if (!defined $linkindex{$section}); # no tests for this section
      foreach my $test (@{$linkindex{$section}}) {
        my %data = %{$testdata{$test}};

        # highlight and ID test if this is its primary section
        my ($hlstart, $hlend, $idstr) = ('', '', '');
        if ($data{'primary'} eq $section) {
          $hlstart = '<strong>';
          $hlend = '</strong>';
          $idstr = qq' id="$test"';
        }

        # Print test info table row
        print OUT "$indent<tr$idstr>\n";
        print OUT "$indent  <td>$hlstart<a href=\"$test.xht\">$data{'title'}</a>$hlend</td>\n";
        print OUT "$indent  <td>";
        foreach my $flag (@{$data{'flags'}}) {
          print OUT $flags{$flag}." ";
        }
        print OUT "</td>\n";
        print OUT "$indent</tr>\n";
      }
    }
    else { # no replacement necessary
      print OUT;
    }
  }
  close TMPL;
  close OUT;
}

1;
