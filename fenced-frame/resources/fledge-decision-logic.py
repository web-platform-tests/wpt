# These functions are used by FLEDGE to determine the logic for the ad seller.
# For our testing purposes, we only need the minimal amount of boilerplate
# code in place to allow them to be invoked properly and move the FLEDGE
# process along. The tests do not deal with reporting results, so we leave
# `reportResult` empty. See `generateURNFromFledge` in "utils.js" to see how
# these files are used.

def main(request, response):
  headers = [
    ('Content-Type', 'Application/Javascript'),
    ('X-Allow-FLEDGE', 'true')
  ]

  score_ad_content = ''

  # Note: Python fstrings use double-brackets ( {{, }} ) to insert literal
  # brackets instead of substitution sequences.
  score_ad = f'''
    function scoreAd(
      adMetadata,
      bid,
      auctionConfig,
      trustedScoringSignals,
      browserSignals) {{
        {score_ad_content}
        return 2*bid;
    }}'''

  report_result = '''
    function reportResult(
      auctionConfig,
      browserSignals) {
        return;
    }
  '''

  content = f'{score_ad}\n{report_result}'

  return (headers, content)
