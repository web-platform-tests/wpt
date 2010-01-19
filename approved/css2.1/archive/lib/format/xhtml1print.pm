package format::xhtml1print;
use strict;
use utf8;
use xml;
1;

my $printCSS = q^
    @page { counter-increment: page;
            font: italic 8pt sans-serif;
            color: gray;
            %%MARGIN%%
            @top-left { content: "CSS 2.1 Conformance Test Suite"; }
            @top-right { content: "Test %%TESTID%%"; }
            @bottom-right { content: counter(page); }
          }
^;
my $printMargin = 'margin: 7%;';
my $printHTMLstart = '<p style="font: italic 8pt sans-serif; color: gray;">Start of CSS2.1 Conformance Test %%TESTID%%.</p>';
my $printHTMLend = '<p style="font: italic 8pt sans-serif; color: gray;">End of CSS2.1 Conformance Test %%TESTID%%.</p>';

sub output {
    my($tree,$id) = @_;
    my $output = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
    $output .= "\n";
    $output .= xml::treeAsXML($tree);

    if ($output =~ /\@page\s*{[^}]*\@/) {
      # Don't use headers and footers when page tests margin boxes
      my $start = $printHTMLstart;
      $start =~ s/%%TESTID%%/$id/g;
      my $end = $printHTMLend;
      $end =~ s/%%TESTID%%/$id/g;

      $output =~ s/(<body[^>]*>)/$1\n$start/;
      $output =~ s/(<\/body[^>]*>)/$end\n$1/;
    }
    else {
      $_ = $printCSS;
      s/%%TESTID%%/$id/g;

      if ($output =~ /\@page/) {
        s/%%MARGIN%%//; # skip margin rule when @page statement exists
      }
      else {
        s/%%MARGIN%%/$printMargin/;
      }

      $output =~ s/<\/title>/<\/title>\n  <style type="text\/css">$_  <\/style>/;
    }

    return $output;
}
