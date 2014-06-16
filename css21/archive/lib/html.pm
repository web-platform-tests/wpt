package html;
use strict;
use utf8;
use treeTools;
use constant scriptContext => 0x01;
use constant styleContext => 0x02;
1;

# Lots of pretty recursive functions.
# If any of them blow the stack, we'll have to rewrite them to use
# slightly saner algorithms. But for now this is easier to think
# about.

sub treeAsHTML {
    my($tree) = @_;
    # XXX handle DOCTYPE, PIs etc
    $tree = treeTools::rootElement($tree);
    if ($tree) {
        my $namespaces = treeTools::namespacesUsed($tree);
        die "tree contains non-HTML namespaces" if @$namespaces != 1 or $namespaces->[0] ne 'http://www.w3.org/1999/xhtml';
        return elementAsHTML($tree);
    }
    return '';
}

sub elementAsHTML {
    my($node, $cdataContext) = @_;
    die "element node expected" if not ref $node or $node->{nodeType} ne 'element';
    die "element found in CDATA context" if $cdataContext;
    my $output = '';
    if ($node->{tagName} eq '{http://www.w3.org/1999/xhtml}img' or
        $node->{tagName} eq '{http://www.w3.org/1999/xhtml}br' or
        $node->{tagName} eq '{http://www.w3.org/1999/xhtml}link' or
        $node->{tagName} eq '{http://www.w3.org/1999/xhtml}col' or
        $node->{tagName} eq '{http://www.w3.org/1999/xhtml}meta' or
        $node->{tagName} eq '{http://www.w3.org/1999/xhtml}input') { # XXX any others?
        $output .= startTagAsHTML($node);
        if (@{$node->{childNodes}}) {
            die "unexpected child: $node->{tagName} element had content";
        }
    } else {
        $cdataContext = scriptContext if $node->{tagName} eq '{http://www.w3.org/1999/xhtml}script';
        $cdataContext = styleContext if $node->{tagName} eq '{http://www.w3.org/1999/xhtml}style';
        # XXX any others?
        $output .= startTagAsHTML($node);
        foreach my $child (@{$node->{childNodes}}) {
            if (not ref $child) {
                $output .= stringAsHTML($child, $cdataContext);
            } elsif ($child->{nodeType} eq 'element') {
                $output .= elementAsHTML($child, $cdataContext);
            } elsif ($child->{nodeType} eq 'CDATA') {
                $output .= CDATAAsHTML($child, $cdataContext);
            } elsif ($child->{nodeType} eq 'comment') {
                $output .= commentAsHTML($child, $cdataContext);
            } elsif ($child->{nodeType} eq 'PI') {
                $output .= PIAsHTML($child, $cdataContext);
            } else {
                die "unexpected node type: $child->{nodeType}";
            }
        }
        $output .= endTagAsHTML($node);
    }
    return $output;
}

sub startTagAsHTML {
    my($node) = @_;
    die "element node expected" if not ref $node or $node->{nodeType} ne 'element';
    my $output = '<';
    $output .= $node->{localName};
    foreach my $attribute (keys %{$node->{attributesPrefixed}}) {
        my $name = $attribute;
        $name =~ s/^xml://;
        $output .= " $name=\"" . stringAsHTML($node->{attributesPrefixed}->{$attribute}) . '"';
    }
    $output .= '>';
    return $output;
}

sub endTagAsHTML {
    my($node) = @_;
    die "element node expected" if not ref $node or $node->{nodeType} ne 'element';
    my $output = '</';
    $output .= $node->{localName};
    $output .= '>';
    return $output;
}

sub stringAsHTML {
    my($string, $cdataContext) = @_;
    die "string expected" if not defined $string or ref $string;
    unless ($cdataContext) {
        # not CDATA context, escape entities
        $string =~ s/&/&amp;/;
        $string =~ s/</&lt;/;
        $string =~ s/>/&gt;/;
        $string =~ s/"/&quot;/;

        # also escape invisible chars so ppl can see them
        $string =~ s/([\x00-\x08\x0B\x0C\x0E-\x1F])/sprintf('&#x%X;',ord($1))/eg; # control chars except \t\n
        $string =~ s/\xA0/&nbsp;/g;
        $string =~ s/\x2002/&ensp;/g;
        $string =~ s/\x2003/&emsp;/g;
        $string =~ s/\x2009/&thinsp;/g;
        $string =~ s/\x200B/&#x200B;/g;
        $string =~ s/\x200C/&zwnj;/g;
        $string =~ s/\x200D/&zwj;/g;
        $string =~ s/\x200E/&lrm;/g;
        $string =~ s/\x200F/&rlm;/g;
    } elsif ($cdataContext == styleContext) {
        # perform any script conversions here
        # for now we assume that DOM3 Core support is in and that the
        # Web Apps assertion that HTML4 uses the XHTML namespace is
        # true, so getElementsByTagNameNS(), etc, are safe.
    } elsif ($cdataContext == scriptContext) {
        # perform any style conversions here
        # for now we assume that the Web Apps assertion that HTML4
        # uses the XHTML namespace is true, so @namespace is safe.
    } else {
        die "unexpected CDATA context $cdataContext";
    }
    return $string;
}

sub CDATAAsHTML {
    my($node, $cdataContext) = @_;
    die "CDATA node expected" if not ref $node or $node->{nodeType} ne 'CDATA';
    my $output = '';
    foreach my $child (@{$node->{childNodes}}) {
        if (not ref $child) {
            $output .= stringAsHTML($child, $cdataContext);
        } else {
            die "unexpected node type: $child->{nodeType}";
        }
    }
    return $output;
}

sub commentAsHTML {
    my($node, $cdataContext) = @_;
    die "comment node expected" if not ref $node or $node->{nodeType} ne 'comment';
    return '' if $cdataContext; # can't put comments in CDATA blocks in HTML, but harmless to ignore, so do so
    my $output = '<!--';
    $output .= $node->{data};
    $output .= '-->';
    return $output;
}

sub PIAsHTML {
    my($node, $cdataContext) = @_;
    die "PI node expected" if not ref $node or $node->{nodeType} ne 'PI';
    die "PI found in CDATA context" if $cdataContext;
    my $output = '<?';
    $output .= $node->{target};
    $output .= ' ';
    $output .= $node->{data};
    $output .= '>';
    return $output;
}
