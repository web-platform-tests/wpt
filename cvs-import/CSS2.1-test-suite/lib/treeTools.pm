package treeTools;
use strict;
use utf8;
1;

sub rootElement {
    my($node) = @_;
    if ($node->{nodeType} eq 'document') {
        foreach my $child (@{$node->{childNodes}}) {
            if ($child->{nodeType} eq 'element') {
                return $child;
            }
        }
        return undef;
    }
    if ($node->{nodeType} eq 'element') {
        return $node;
    }
    return undef;
}

sub prefixesUsed {
    my($node) = @_;
    die "element node expected" unless ref $node and $node->{nodeType} eq 'element';
    my $currentPrefixes = $node->{currentPrefixes};
    my $prefixesUsed = {%{$node->{prefixesUsed}}};
    foreach my $child (@{$node->{childNodes}}) {
        if (ref $child and $child->{nodeType} eq 'element') {
            my $morePrefixesUsed = prefixesUsedInternal($child, $currentPrefixes);
            foreach my $prefix (keys %$morePrefixesUsed) {
                $prefixesUsed->{$prefix} = $morePrefixesUsed->{$prefix};
            }
        }
    }
    return $prefixesUsed;
}

sub prefixesUsedInternal {
    my($node, $parentPrefixes) = @_;
    my $relevantPrefixes = {};
    foreach my $prefix (keys %$parentPrefixes) {
        if (exists $node->{currentPrefixes}->{$prefix} and 
            $parentPrefixes->{$prefix} eq $node->{currentPrefixes}->{$prefix}) {
            $relevantPrefixes->{$prefix} = $parentPrefixes->{$prefix};
        }
    }
    my $prefixesUsed = {};
    foreach my $prefix (keys %{$node->{prefixesUsed}}) {
        if (exists $relevantPrefixes->{$prefix}) {
            $prefixesUsed->{$prefix} = $relevantPrefixes->{$prefix};
        }
    }
    foreach my $child (@{$node->{childNodes}}) {
        if (ref $child and $child->{nodeType} eq 'element') {
            my $morePrefixesUsed = prefixesUsedInternal($child, $relevantPrefixes);
            foreach my $prefix (keys %$morePrefixesUsed) {
                $prefixesUsed->{$prefix} = $morePrefixesUsed->{$prefix};
            }
        }
    }
    return $prefixesUsed;
}

sub namespacesUsed {
    my($node) = @_;
    return [] unless ref $node and $node->{nodeType} eq 'element';
    my $namespaces = namespacesUsedInternal($node);
    return [ keys %$namespaces ];
}

sub namespacesUsedInternal {
    my($node) = @_;
    my $namespaces = { map { $_ => 1 } @{$node->{namespacesUsed}} };
    foreach my $child (@{$node->{childNodes}}) {
        if (ref $child and $child->{nodeType} eq 'element') {
            my $moreNamespaces = namespacesUsedInternal($child);
            foreach my $namespace (keys %$moreNamespaces) {
                $namespaces->{$namespace} = 1;
            }
        }
    }
    return $namespaces;
}
