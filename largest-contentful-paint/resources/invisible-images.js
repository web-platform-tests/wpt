// Shared by invisible-images*.html: images that are not rendered must not be
// observable by LargestContentfulPaint.
assert_implements(window.LargestContentfulPaint,
                  "LargestContentfulPaint is not implemented");
assertNoLCPEntry(entry => !!entry.url, {duration: 500,
    name: 'Images with opacity: 0, visibility: hidden, or display: none are not observable by LargestContentfulPaint.'});
