'use strict';

// Rationale for this particular test character sequence, which is
// used in filenames and also in file contents:
//
// - ABC~ ensures the string starts with something we can read to
//   ensure it is from the correct source; ~ is used because even
//   some 1-byte otherwise-ASCII-like parts of ISO-2022-JP
//   interpret it differently.
// - ‾¥ are inside a single-byte range of ISO-2022-JP and help
//   diagnose problems due to filesystem encoding or locale
// - ≈ is inside IBM437 and helps diagnose problems due to filesystem
//   encoding or locale
// - ¤ is inside Latin-1 and helps diagnose problems due to
//   filesystem encoding or locale; it is also the "simplest" case
//   needing substitution in ISO-2022-JP
// - ･ is inside a single-byte range of ISO-2022-JP in some variants
//   and helps diagnose problems due to filesystem encoding or locale;
//   on the web it is distinct when decoding but unified when encoding
// - ・ is inside a double-byte range of ISO-2022-JP and helps
//   diagnose problems due to filesystem encoding or locale
// - • is inside Windows-1252 and helps diagnose problems due to
//   filesystem encoding or locale and also ensures these aren't
//   accidentally turned into e.g. control codes
// - ∙ is inside IBM437 and helps diagnose problems due to filesystem
//   encoding or locale
// - · is inside Latin-1 and helps diagnose problems due to
//   filesystem encoding or locale and also ensures HTML named
//   character references (e.g. &middot;) are not used
// - ☼ is inside IBM437 shadowing C0 and helps diagnose problems due to
//   filesystem encoding or locale and also ensures these aren't
//   accidentally turned into e.g. control codes
// - ★ is inside ISO-2022-JP on a non-Kanji page and makes correct
//   output easier to spot
// - 星 is inside ISO-2022-JP on a Kanji page and makes correct
//   output easier to spot
// - 🌟 is outside the BMP and makes incorrect surrogate pair
//   substitution detectable and ensures substitutions work
//   correctly immediately after Kanji 2-byte ISO-2022-JP
// - 星 repeated here ensures the correct codec state is used
//   after a non-BMP substitution
// - ★ repeated here also makes correct output easier to spot
// - ☼ is inside IBM437 shadowing C0 and helps diagnose problems due to
//   filesystem encoding or locale and also ensures these aren't
//   accidentally turned into e.g. control codes and also ensures
//   substitutions work correctly immediately after non-Kanji
//   2-byte ISO-2022-JP
// - · is inside Latin-1 and helps diagnose problems due to
//   filesystem encoding or locale and also ensures HTML named
//   character references (e.g. &middot;) are not used
// - ∙ is inside IBM437 and helps diagnose problems due to filesystem
//   encoding or locale
// - • is inside Windows-1252 and again helps diagnose problems
//   due to filesystem encoding or locale
// - ・ is inside a double-byte range of ISO-2022-JP and helps
//   diagnose problems due to filesystem encoding or locale
// - ･ is inside a single-byte range of ISO-2022-JP in some variants
//   and helps diagnose problems due to filesystem encoding or locale;
//   on the web it is distinct when decoding but unified when encoding
// - ¤ is inside Latin-1 and helps diagnose problems due to
//   filesystem encoding or locale; again it is a "simple"
//   substitution case
// - ≈ is inside IBM437 and helps diagnose problems due to filesystem
//   encoding or locale
// - ¥‾ are inside a single-byte range of ISO-2022-JP and help
//   diagnose problems due to filesystem encoding or locale
// - ~XYZ ensures earlier errors don't lead to misencoding of
//   simple ASCII
//
// Overall the near-symmetry makes common I18N mistakes like
// off-by-1-after-non-BMP easier to spot. All the characters
// are also allowed in Windows Unicode filenames.
const kTestChars = 'ABC~‾¥≈¤･・•∙·☼★星🌟星★☼·∙•・･¤≈¥‾~XYZ';

// NOTE: The expected interpretation of ISO-2022-JP according to
// https://encoding.spec.whatwg.org/#iso-2022-jp-encoder unifies
// single-byte and double-byte katakana.
const kTestFallbackIso2022jp =
      ('ABC~\x1B(J~\\≈¤\x1B$B!&!&\x1B(B•∙·☼\x1B$B!z@1\x1B(B🌟' +
       '\x1B$B@1!z\x1B(B☼·∙•\x1B$B!&!&\x1B(B¤≈\x1B(J\\~\x1B(B~XYZ').replace(
             /[^\0-\x7F]/gu,
           x => `&#${x.codePointAt(0)};`);

// NOTE: \uFFFD is used here to replace Windows-1252 bytes to match
// how we will see them in the reflected POST bytes in a frame using
// UTF-8 byte interpretation. The bytes will actually be intact, but
// this code cannot tell and does not really care.
const kTestFallbackWindows1252 =
      'ABC~‾\xA5≈\xA4･・\x95∙\xB7☼★星🌟星★☼\xB7∙\x95・･\xA4≈\xA5‾~XYZ'.replace(
            /[^\0-\xFF]/gu,
          x => `&#${x.codePointAt(0)};`).replace(/[\x80-\xFF]/g, '\uFFFD');

const kTestFallbackXUserDefined =
      kTestChars.replace(/[^\0-\x7F]/gu, x => `&#${x.codePointAt(0)};`);

// formDataPostFileUploadTest - verifies multipart upload structure and
// numeric character reference replacement for filenames, field names,
// and field values using FormData and fetch().
//
// Uses /fetch/api/resources/echo-content.py to echo the upload
// POST.
//
// Fields in the parameter object:
//
// - fileNameSource: purely explanatory and gives a clue about which
//   character encoding is the source for the non-7-bit-ASCII parts of
//   the fileBaseName, or Unicode if no smaller-than-Unicode source
//   contains all the characters. Used in the test name.
// - fileBaseName: the not-necessarily-just-7-bit-ASCII file basename
//   used for the constructed test file. Used in the test name.
const formDataPostFileUploadTest = ({
  fileNameSource,
  fileBaseName,
}) => {
  promise_test(async testCase => {

    const formData = new FormData;
    let file = new Blob([kTestChars], {type: 'text/plain'});
    file.name = fileBaseName;
    try {
      // Switch to File in browsers that allow this
      file = new File([file], file.name, {type: file.type});
    } catch (ignoredException) {
    }

    // Used to verify that the browser agrees with the test about
    // field value replacement and encoding independently of file system
    // idiosyncracies.
    formData.append('filename', file.name);

    // Same, but with name and value reversed to ensure field names
    // get the same treatment.
    formData.append(file.name, 'filename');

    formData.append('file', file, file.name);

    const formDataText =
          await (await fetch('/fetch/api/resources/echo-content.py', {
            method: 'POST',
            body: formData,
          })).text();
    const formDataLines = formDataText.split('\r\n');
    if (formDataLines.length && !formDataLines[formDataLines.length - 1]) {
      --formDataLines.length;
    }
    assert_greater_than(
        formDataLines.length,
        2,
        `${fileBaseName}: multipart form data must have at least 3 lines: ${
             JSON.stringify(formDataText)
           }`);
    const boundary = formDataLines[0];
    assert_equals(
        formDataLines[formDataLines.length - 1],
        boundary + '--',
        `${fileBaseName}: multipart form data must end with ${boundary}--: ${
             JSON.stringify(formDataText)
           }`);
    const toLf = str => str.replace(/\r\n?/g, '\n');
    const toCrLf = str => toLf(str).replace(/\n/g, '\r\n')
    const toQuotable = str => str
          .replace(/[\0-\x1A\x1C-\x1F"\x7F]/g, encodeURIComponent)
          .replace(/\\/g, '\\\\');
    const quotableFileName = toQuotable(fileBaseName);
    const quotableName = toQuotable(toCrLf(fileBaseName));
    const textValue = toCrLf(fileBaseName);
    const expectedText = [
      boundary,
      'Content-Disposition: form-data; name="filename"',
      '',
      textValue,
      boundary,
      `Content-Disposition: form-data; name="${quotableName}"`,
      '',
      'filename',
      boundary,
      `Content-Disposition: form-data; name="file"; ` +
          `filename="${quotableFileName}"`,
      'Content-Type: text/plain',
      '',
      kTestChars,
      boundary + '--',
    ].join('\r\n');
    assert_true(
        formDataText.startsWith(expectedText),
        `Unexpected multipart-shaped form data received:\n${
             formDataText
           }\nExpected:\n${expectedText}`);
  }, `Upload ${fileBaseName} (${fileNameSource}) in fetch with FormData`);
};
