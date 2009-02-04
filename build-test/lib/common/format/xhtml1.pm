package format::xhtml1;
use strict;
use utf8;
use xml;
1;

sub output {
    my($tree) = @_;
    my $output = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
    $output .= "\n";
    $output .= xml::treeAsXML($tree);
    return $output;
}
