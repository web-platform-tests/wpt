function StreamDownloadFinishDelay() {
    return 1000;
}

function DownloadVerifyDelay() {
    return 1000;
}

function VerifyDownload(test_obj, token, expect_download, timeout) {
    var verify_token = test_obj.step_func(function () {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'support/download_stash.py?verify-token&token=' + token);
        xhr.onload = test_obj.step_func(function(e) {
            if (expect_download) {
              assert_equals(xhr.response, "TOKEN_SET", "Expect download to happen, but got nothing.");
            } else {
              assert_equals(xhr.response, "TOKEN_NOT_SET", "Expect no download to happen, but got one.");
            }
            test_obj.done();
        });
        xhr.send();
    });
    test_obj.step_timeout(verify_token, timeout);
}