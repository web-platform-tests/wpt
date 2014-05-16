package sections;
use strict;
use vars qw(@ISA @EXPORT %sectionURIs %sectionTitles %sectionCodes);
require Exporter;
@ISA = qw(Exporter);
@EXPORT = qw(%sectionURIs %sectionTitles %sectionCodes);
1;

open(SECTIONS, '<', '../data/sections.dat') or die "$0: sections.dat: $!\n";
while (defined($_ = <SECTIONS>)) {
    my($code, $uri, $title) = m/^([^\t]+)\t([^\t]+)\t(.+)\n$/gos or die "$0: sections.dat: invalid format\n";
    $title =~ tr/\t/ /;
    $sectionURIs{$code} = $uri;
    $sectionTitles{$code} = $title;
    $sectionCodes{$uri} = $code;
}
close(SECTIONS);
