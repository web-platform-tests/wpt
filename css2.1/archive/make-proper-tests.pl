#!/usr/bin/perl -w
# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Test Suite Renamer
# input: first argument should be directory in raw-tests/ to process
# output: files are output to tests/, error messages to standard output
# aborts after first error
# Version 1.0
#
# Copyright (c) 2004 by Ian Hickson
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307
# USA

use strict;
use utf8;
use lib 'lib';
use sections;

die "$0: syntax: make-proper-tests.pl FILENAMES, e.g. 'make-proper-tests.pl raw-tests/css1tests/FILENAMES'\n" if @ARGV != 1;
my $filenames = $ARGV[0];
die "$0: $filenames doesn't exist or is not a file\n" unless -f $filenames;
unless ($filenames =~ m/^(raw-tests\/.+)\/FILENAMES$/os) {
    die "$0: must be invoked from source/ directory, on tests in the raw-tests directory, with file called FILENAMES\n";
}
my $directory = $1;
die "$0: $directory doesn't exist or not a directory\n" unless -d $directory;

my %groups;
open(FILENAMES, '<', "$filenames") or die "$0: $filenames: $!\n";
while (defined($_ = <FILENAMES>)) {
    next if m/^#/os;
    die "$0:$filenames:$.: invalid syntax\n" unless m/^([^ ]+) ([^ ]+) (\d+)(?: (.+))?[\n\r]+$/os;
    my $input = "$directory/$1";
    my $filename = $2;
    my $section = $3;
    my $extraSections = $4;

    die "$0:$filenames:$.: invalid filename ('$filename')\n" unless $filename =~ m/^(.+)-([0-9]+)\.xht$/os;
    die "$0:$filenames:$.: filename longer than 31 characters\n" if length($filename) > 31;
    my $name = $1;
    my $num = $2;

    $groups{"$name"} += 1;
    my $n = $groups{"$name"};
    $n = "0$n" if $n < 10;
    die "$0:$filenames:$.: '$name-$num' unexpected (expected '$name-$n' first)\n" if $groups{"$name"} < $num+1;
    die "$0:$filenames:$.: '$name-$num' duplicate\n" if $groups{"$name"} > $num+1;

    my $output = "tests/$filename";
    die "$0:$.: $output already exists\n" if -e $output;

    my @sections = ($section, defined $extraSections ? split(' ', $extraSections) : ());

    my @lines;
    { local $.; # so that $. is not changed in the outer block
    open(INPUT, '<', $input) or die "$0: failed to open for input $input: $!\n";
    @lines = <INPUT>;
    close(INPUT); }

    die "$0:$input:1: missing or incorrect DOCTYPE\n" unless $lines[0] eq "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\">\n";
    die "$0:$input:2: unexpected <html> line\n" unless $lines[1] =~ m/<html xmlns="http:\/\/www.w3.org\/1999\/xhtml".*>\n/os;
    die "$0:$input:3: <head> line not as expected\n" unless $lines[2] eq " <head>\n";
    die "$0:$input:4: <title> line not as expected\n" unless $lines[3] =~ m/ <title>.+<\/title>\n/os;
    die "$0:$input:5: unexpected end of file\n" unless @lines > 5;
    my $line = 5;
    while ($lines[$line-1] ne " </head>\n") {
        if ($lines[$line-1] =~ m/  <link rel="help" href="(.+)" title=".*"\/>\n/os) {
            my $uri = $1;
            my $title = $2;
            my $code = $sectionTitles{$sectionCodes{$uri}};
            if (defined $code) {
                $lines[$line-1] = "  <link rel=\"help\" href=\"$uri\" title=\"$sectionTitles{$code}\"/>\n";
                foreach (@sections) {
                    if (defined $_ and $_ eq $code) {
                        $_ = undef;
                    }
                }
            }
        }
        die "$0:$input:$line unexpected end of file\n" unless @lines > $line;
        $line += 1;
    }
    my @extraHelp;
    foreach (@sections) {
        if (defined $_) {
            die "$0:$filenames:$.: invalid section '$_'\n" unless exists $sectionURIs{$_};
            push(@extraHelp, "  <link rel=\"help\" href=\"$sectionURIs{$_}\" title=\"$sectionTitles{$_}\"/>\n");
        }
    }
    @lines = (@lines[0..$line-2], @extraHelp, @lines[$line-1..$#lines]);

    print "$output\n";
    open(OUTPUT, '>', $output) or die "$0: failed to open for output $output: $!\n";
    foreach (@lines) {
        print OUTPUT $_;
    }
    close(OUTPUT);
}

system("cp -Lrvu $directory/support tests");
