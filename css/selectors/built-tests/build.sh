#!/usr/bin/env sh
set -ex

cd "${0%/*}"
export PERL_MB_OPT="--install_base \"`pwd`/perl5\""
export PERL_MM_OPT="INSTALL_BASE=`pwd`/perl5"
export PERL5LIB="`pwd`/perl5/lib/perl5"
cpanm 'XML::Parser'
make all
