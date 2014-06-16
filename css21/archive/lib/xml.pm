package xml;
use strict;
use utf8;
use treeTools;
1;

# Lots of pretty recursive functions.
# If any of them blow the stack, we'll have to rewrite them to use
# slightly saner algorithms. But for now this is easier to think
# about.

sub treeAsXML {
    my($tree) = @_;
    # XXX handle DOCTYPE, PIs etc
    $tree = treeTools::rootElement($tree);
    if ($tree) {
        return elementAsXML($tree, 1);
    }
    return '';
}

sub elementAsXML {
    my($node, $allNamespaces) = @_;
    die "element node expected" if not ref $node or $node->{nodeType} ne 'element';
    my $output = '';
    if (@{$node->{childNodes}}) {
        $output .= startTagAsXML($node, $allNamespaces);
        foreach my $child (@{$node->{childNodes}}) {
            if (not ref $child) {
                $output .= stringAsXML($child);
            } elsif ($child->{nodeType} eq 'element') {
                $output .= elementAsXML($child);
            } elsif ($child->{nodeType} eq 'CDATA') {
                $output .= CDATAAsXML($child);
            } elsif ($child->{nodeType} eq 'comment') {
                $output .= commentAsXML($child);
            } elsif ($child->{nodeType} eq 'PI') {
                $output .= PIAsXML($child);
            } else {
                die "unexpected node type: $child->{nodeType}";
            }
        }
        $output .= endTagAsXML($node);
    } else {
        $output .= emptyTagAsXML($node, $allNamespaces);
    }
    return $output;
}

sub startTagAsXML {
    my($node, $allNamespaces) = @_;
    die "element node expected" if not ref $node or $node->{nodeType} ne 'element';
    my $output = '<';
    $output .= startTagAttributesAsXML($node, $allNamespaces);
    $output .= '>';
    return $output;
}

sub emptyTagAsXML {
    my($node, $allNamespaces) = @_;
    die "element node expected" if not ref $node or $node->{nodeType} ne 'element';
    my $output = '<';
    $output .= startTagAttributesAsXML($node, $allNamespaces);
    $output .= '/>';
    return $output;
}

sub startTagAttributesAsXML {
    my($node, $allNamespaces) = @_;
    my $output = '';
    $output .= $node->{prefix};
    $output .= $node->{localName};
    my $prefixes;
    if ($allNamespaces) {
        $prefixes = treeTools::prefixesUsed($node);
    } else {
        $prefixes = $node->{newPrefixes};
    }
    foreach my $prefix (keys %$prefixes) {
        my $ns = defined $prefixes->{$prefix} ? stringAsXML($prefixes->{$prefix}) : '';
        if ($prefix eq '#default') {
            $output .= " xmlns=\"$ns\"";
        } else {
            $output .= " xmlns:$prefix=\"$ns\"";
        }
    }
    foreach my $attribute (keys %{$node->{attributesPrefixed}}) {
        $output .= " $attribute=\"" . stringAsXML($node->{attributesPrefixed}->{$attribute}) . '"';
    }
    return $output;
}

sub endTagAsXML {
    my($node) = @_;
    die "element node expected" if not ref $node or $node->{nodeType} ne 'element';
    my $output = '</';
    $output .= $node->{prefix};
    $output .= $node->{localName};
    $output .= '>';
    return $output;
}

sub stringAsXML {
    my($string) = @_;
    die "string expected" if not defined $string or ref $string;
    $string =~ s/&/&amp;/gos;
    $string =~ s/</&lt;/gos;
    $string =~ s/>/&gt;/gos;
    $string =~ s/"/&quot;/gos;
    $string =~ s/'/&apos;/gos;

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

    return $string;
}

sub CDATAAsXML {
    my($node) = @_;
    die "CDATA node expected" if not ref $node or $node->{nodeType} ne 'CDATA';
    my $output = '<![CDATA[';
    foreach my $child (@{$node->{childNodes}}) {
        if (not ref $child) {
            $output .= $child;
        } else {
            die "unexpected node type: $child->{nodeType}";
        }
    }
    $output .= ']]>';
    return $output;
}

sub commentAsXML {
    my($node) = @_;
    die "comment node expected" if not ref $node or $node->{nodeType} ne 'comment';
    my $output = '<!--';
    $output .= $node->{data};
    $output .= '-->';
    return $output;
}

sub PIAsXML {
    my($node) = @_;
    die "PI node expected" if not ref $node or $node->{nodeType} ne 'PI';
    my $output = '<?';
    $output .= $node->{target};
    $output .= ' ';
    $output .= $node->{data};
    $output .= '?>';
    return $output;
}
