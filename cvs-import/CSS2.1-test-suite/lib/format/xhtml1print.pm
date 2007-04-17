package format::xhtml1print;
use strict;
use utf8;
use xml;
1;

my $printCSS = q^
    @page { counter-increment: page;
            @top-left { content: "CSS2.1 Test %%TESTID%%";
                        content: "CSS2.1 Test %%TESTID%% page " counter(page); } }
^;

sub output {
    my($tree,$id) = @_;
    my $output = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
    $output .= "\n";
    $output .= xml::treeAsXML($tree);

    $printCSS =~ s/%%TESTID%%/$id/;
    $output =~ s/<\/title>/<\/title>\n  <style type="text\/css">$printCSS  <\/style>/;
    return $output;
}
