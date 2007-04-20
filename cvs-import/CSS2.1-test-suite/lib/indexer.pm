# This module written by fantasai
package indexer;
use strict;
use utf8;

# Usage:
# init('Spec Root URL', 'path/to/template.xht', 'Test Suite Title: ')
# foreach test {
#   index('path/to/test.xht','testid')
# save('path/to/save/index.xht')

# 'Spec Root URL' is e.g. 'http://www.w3.org/TR/CSS21/'
# The template must have lines of the form <!-- TESTS 3.2 <third.html#sec2> -->
# where third.html#sec2 matches the rel="help" links


my %types = ( 'a' => 'atomic',
              'b' => 'basic',
              'c' => 'composite',
              'd' => 'detailed',
              'e' => 'evil',
              'f' => 'failure' );

my %flags = (  'a' => '<abbr title="Requires Ahem Font">A</abbr>',
              'f' => '<abbr title="Requires HTML Framese Support">F</abbr>',
              'g' => '<abbr title="Requires Bitmap Graphics Support">G</abbr>',
              'h' => '<abbr title="Requires Session History">H</abbr>',
              'i' => '<abbr title="Requires User Interaction">I</abbr>',
              'm' => '<abbr title="Requires MathML Support">M</abbr>',
              'n' => '<abbr title="Requires XML Namespaces Support">N</abbr>',
              'o' => '<abbr title="Requires DOM (Document Object Model) Support">O</abbr>',
              'v' => '<abbr title="Requires SVG Support">V</abbr>' );

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

  if ($id =~ m/^t(\d\d)(\d\d)?(\d\d)?-[a-z0-9\-]+-([a-f])(?:-([a-z]+))?$/) {

    # Collect Metadata
    local $_ = $1;
    $_ .= '.'.$2 if $2;
    $_ .= '.'.$3 if $3;
    my %data = ( 'primary' => $_,
                 'type'    => $4,
                 'flags'   => $5 || '' );
    $data{'primary'} =~ s/0(\d)/$1/g;

    my @links = getHeadData($file, $id);
    $data{'title'} = shift @links;
    $data{'links'} = \@links;

    # Build Test Database
    $testdata{$id} = \%data;

    # Build Section-based Index
    foreach (@links) {
      $linkindex{$_} = [] if (!defined $linkindex{$_});
      push(@{$linkindex{$_}}, $id);
    }

  }
  else {
    print "!! Filename fails format test: $id\n";
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
  my $title = $id;
  if ($contents =~ /<head.*?>(.*)<\/head\s*>/sm) {
    local $_ = $1;

    # Get title
    /<title.*?>(.*)<\/title\s*>/sm;
    $title = $1;
    $title =~ s/$titlestr//;

    # Collect rel="help" URLs
    @links = /<link\s.*?rel="\s*help\s*".*?>/g;
    foreach (@links) {
      /href="$specroot(.+?)"/;
      $_ = $1;
    }
  }
  return ($title, @links);
}


sub save {
  my $output = shift @_;

  open TMPL, $template or die "index::sections could not open template $template: $!";
  open OUT, ">$output" or die "index::sections could not open output file $output: $!";

  while (<TMPL>) {
    if (/(\s*)<!-- TESTS ([A-Z\d\.]+) <(.+)> -->/) {
      my ($indent, $primary, $section) = ($1, $2, $3);

      next if (!defined $linkindex{$section}); # no tests for this section
      foreach my $test (@{$linkindex{$section}}) {
        my %data = %{$testdata{$test}};

        # highlight and ID test if this is its primary section
        my ($hlstart, $hlend, $idstr) = ('', '', '');
        if ($data{'primary'} eq $primary) {
          $hlstart = '<strong>';
          $hlend = '</strong>';
          $idstr = qq' id="$test"';
        }

        # Print test info table row
        print OUT "$indent<tr$idstr>\n";
        print OUT "$indent  <td>$hlstart<a href=\"$test.xht\">$data{'title'}</a>$hlend</td>\n";
        print OUT "$indent  <td>$types{$data{'type'}}</td>\n";
        print OUT "$indent  <td>";
        foreach my $flag (sort keys %flags) {
          print OUT $flags{$flag}." " if ($data{'flags'} =~ /$flag/);
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
