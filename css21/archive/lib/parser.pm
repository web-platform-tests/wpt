package parser;
use strict;
use utf8;
use XML::Parser;
1;

# returns a DOM that is a hash
# each node in the DOM is a hash or a scalar
# the hashes have childNodes as an array of DOM nodes
# text nodes are scalars

sub parsefile {
    my($filename) = @_;
    my $parser = XML::Parser->new(Namespaces => 1,
                                  ErrorContext => 0,
                                  Style => 'parser::internal');
    return $parser->parsefile($filename);
}

sub parse {
    my($content) = @_;
    my $parser = XML::Parser->new(Namespaces => 1,
                                  ErrorContext => 0,
                                  Style => 'parser::internal');
    return $parser->parse($content);
}


package parser::internal;
use strict;
use utf8;

sub Init {
    my($expat) = @_;
    $expat->{tree} = {nodeType => 'document',
                      childNodes => []};
    $expat->{pos} = [$expat->{tree}->{childNodes}];
}

sub Final {
    my($expat) = @_;
    return $expat->{tree};
}

sub Start {
    my($expat, $elementLocalName, @attrData) = @_;
    my $elementNamespace = $expat->namespace($elementLocalName);
    my $elementFullName = defined($elementNamespace) ? "{$elementNamespace}$elementLocalName"
                                                     : $elementLocalName;
    my $namespacesUsed = {};
    if (defined($elementNamespace)) {
        $namespacesUsed->{$elementNamespace} += 1;
    }
    my $prefixesUsed = {};
    # get the prefix
    # note that expat doesn't explicitly give it to us
    # but we could get the real one using recognized_string
    my $elementPrefix = '';
    prefix: foreach my $prefix ($expat->current_ns_prefixes) {
        if ($expat->expand_ns_prefix($prefix) eq $elementNamespace) {
            if ($prefix ne '#default') {
                $elementPrefix = "$prefix:";
            }
            $prefixesUsed->{$prefix} = $elementNamespace;
            last prefix;
        }
    }
    my $attributes = {};
    my $attributesPrefixed = {};
    attribute: while (@attrData) {
        my $name = shift @attrData;
        my $value = shift @attrData;
        my $namePrefixed = $name;
        if ($expat->namespace($name)) {
            if ('http://www.w3.org/XML/1998/namespace' eq $expat->namespace($name)) {
                $namePrefixed = 'xml:' . $namePrefixed;
                $name = '{http://www.w3.org/XML/1998/namespace}' . $name;
            }
            else {
                prefix: foreach my $prefix ($expat->current_ns_prefixes) {
                    if ($expat->expand_ns_prefix($prefix) eq $expat->namespace($name)) {
                        $namePrefixed = "$prefix:$namePrefixed";
                        $prefixesUsed->{$prefix} = $expat->namespace($name);
                        print $prefix;
                        last prefix;
                    }
                }
                $namespacesUsed->{$expat->namespace($name)} += 1;
                $name = '{' . $expat->namespace($name) . '}' . $name;
            }
        }
        $attributes->{$name} = $value;
        $attributesPrefixed->{$namePrefixed} = $value;
    }
    my $newPrefixes = {};
    foreach my $prefix ($expat->new_ns_prefixes) {
        $newPrefixes->{$prefix} = $expat->expand_ns_prefix($prefix);
    }
    my $currentPrefixes = {};
    foreach my $prefix ($expat->current_ns_prefixes) {
        $currentPrefixes->{$prefix} = $expat->expand_ns_prefix($prefix);
    }
    my $node = {nodeType => 'element',
                tagName => $elementFullName,
                localName => "$elementLocalName", # without the ""s, it comes out as a number (?), at least with Data::Dumper
                prefix => $elementPrefix,
                namespace => $elementNamespace,
                attributes => $attributes,
                attributesPrefixed => $attributesPrefixed,
                newPrefixes => $newPrefixes,
                currentPrefixes => $currentPrefixes,
                namespacesUsed => [ keys %$namespacesUsed ],
                prefixesUsed => $prefixesUsed,
                childNodes => []};
    push(@{$expat->{pos}->[0]}, $node);
    unshift(@{$expat->{pos}}, $node->{childNodes});
}

sub End {
    my($expat, $element) = @_;
    shift(@{$expat->{pos}});
}

sub Char {
    my($expat, $data) = @_;
    push(@{$expat->{pos}->[0]}, $data);
}

sub Proc {
    my($expat, $target, $data) = @_;
    my $node = {nodeType => 'PI',
                target => $target,
                data => $data};
    push(@{$expat->{pos}->[0]}, $node);
}

sub Comment {
    my($expat, $data) = @_;
    my $node = {nodeType => 'comment',
                data => $data};
    push(@{$expat->{pos}->[0]}, $node);
}

sub CdataStart {
    my($expat) = @_;
    my $node = {nodeType => 'CDATA',
                childNodes => []};
    push(@{$expat->{pos}->[0]}, $node);
    unshift(@{$expat->{pos}}, $node->{childNodes});
}

sub CdataEnd {
    my($expat, $element) = @_;
    shift(@{$expat->{pos}});
}

sub XMLDecl {
    my($expat, $version, $encoding, $standalone) = @_;
    $expat->{tree}->{version} = $version;
    $expat->{tree}->{encoding} = $encoding;
    $expat->{tree}->{standalone} = $standalone;
}
