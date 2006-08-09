package sections;
use strict;
use vars qw(@ISA @EXPORT);
require Exporter;
@ISA = qw(Exporter);
@EXPORT = qw(%sectionURIs %sectionTitles %sectionCodes);
1;

my %sectionURIs;
my %sectionTitles;
my %sectionCodes;
open(SECTIONS, '<', 'sections.dat') or die "$0: sections.dat: $!\n";
while (defined($_ = <SECTIONS>)) {
    my($code, $uri, $title) = m/^([^ ]+) ([^ ]+) (.+)\n$/gos or die "$0: sections.dat: invalid format\n";
    $sectionURIs{$code} = $uri;
    $sectionTitles{$code} = $title;
    $sectionCodes{$uri} = $code;
}
close(SECTIONS);
