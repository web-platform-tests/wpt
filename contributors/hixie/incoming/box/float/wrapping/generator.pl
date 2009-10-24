#!/usr/bin/perl -w

local $/ = undef;
foreach (split(/\n\n\n/os, <DATA>)) {
    my($test, $reference) = split(/\n\n/os);
    foreach (split(/\n/os, $test)) {
        my @line = split(/ /os);
        if (not @line) {
            # do nothing, this is a blank line
        } elsif ($line[0] eq 'left') {
            
        }
    }
}

__DATA__
1
left 2 2
222222222
left 1 2
left 1 5
left 1 1
left 2 2
left 1 1
3 444 55555555 66666 777777777

############
#AA1       #
#AA        #
#222222222 #
#BCDEEF3   #
#BC EE444  #
# C55555555#
# C66666   #
# C        #
#777777777 #
#          #
############
