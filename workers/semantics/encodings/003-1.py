 # -*- coding: utf-8 -*-
from wptserve.utils import isomorphic_encode

def main(request, response):
    return u"PASS" if request.GET.first(b'x') == isomorphic_encode('å') else u"FAIL"
