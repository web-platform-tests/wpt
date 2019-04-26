import os, sys, json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import util


def handle_deliveries(policy_deliveries):
    meta = ''
    headers = {}
    error = ""

    for delivery in policy_deliveries:
      if delivery['value'] is None:
        continue
      if delivery['deliveryType'] == 'meta':
        if delivery['key'] == 'referrerPolicy':
          meta += '<meta name="referrer" content="%s">' % delivery['value']
        else:
          error = 'invalid delivery key'
      elif delivery['deliveryType'] == 'http-rp':
        if delivery['key'] == 'referrerPolicy':
          headers['Referrer-Policy'] = delivery['value']
          # TODO(kristijanburnik): Limit to WPT origins.
          headers['Access-Control-Allow-Origin'] = '*'
        else:
          error = 'invalid delivery key for http-rp: %s' % delivery['key']
      elif delivery['deliveryType'] == 'attr-referrer':
          error = 'attr-referrer should supported by the JS test wrapper.'
          pass
      elif delivery['deliveryType'] == 'rel-noreferrer':
          error = 'rel=noreferrer should supported by the JS test wrapper.'
          pass
      else:
        error = 'invalid deliveryType: %s' % delivery['deliveryType']

    return {"meta": meta, "headers": headers, "error": error}
