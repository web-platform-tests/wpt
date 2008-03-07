package format::html4;
use strict;
use utf8;
use html;
1;

sub output {
    my($tree) = @_;
    my $namespaces = treeTools::namespacesUsed(treeTools::rootElement($tree));
    if (@$namespaces != 1 or $namespaces->[0] ne 'http://www.w3.org/1999/xhtml') {
        return undef; # not an HTML4 test.
    }
    my $output = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN">';
    $output .= "\n";
    $output .= html::treeAsHTML($tree);
    $output =~ s/([ \t]?)<head>/$1<head>\n$1<meta http-equiv="Content-Type" content="text\/html;charset=UTF-8">/m;
    return $output;
}
