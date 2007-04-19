package format::xhtml1print;
use strict;
use utf8;
use xml;
1;

my $printCSS = q^
    @page { counter-increment: page;
            font: italic 8pt sans-serif;
            color: gray;
            @top-left { content: "CSS 2.1 Conformance Test Suite"; }
            @top-right { content: "Test %%TESTID%%"; }
            @bottom-right { content: counter(page); }
          }
^;

sub output {
    my($tree,$id) = @_;
    my $output = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
    $output .= "\n";
    $output .= xml::treeAsXML($tree);

    $_ = $printCSS;
    s/%%TESTID%%/$id/g;
    $output =~ s/<\/title>/<\/title>\n  <style type="text\/css">$_  <\/style>/;
    return $output;
}
