#!/usr/bin/python3
import json
import sys


def main():
    """Transform wptrunner raw logs

    The script expects wptrunner raw logs (newline-separated JSON generated
    by --log-raw) to be passed via stdin. It then writes a JSON summary to
    the provided filename. The schema of the object is:

    {
        "test/file/path.html": [$num_subtests_passing, $total_subtests],
        "test/file/path2.html": [10, 20],
        ...
    }

    This script expects to be fed results in the following way:
    cat $LOGFILE | grep test_status | ./summarize_logs.py $SUMMARY_FILENAME
    """
    summary_filename = sys.argv[1]
    assert summary_filename, 'Required argument: summary file path'
    results = {}
    subtest_results_by_file = {}

    for line in sys.stdin:
        test_status = json.loads(line)

        # To guard against irrelevant test lines
        # Maybe warn if we find too many?
        if test_status["action"] != "test_status":
            continue

        test_file = test_status["test"]
        subtest_name = test_status["subtest"]
        status = test_status["status"]

        if test_file not in results:
            results[test_file] = [0, 1]
        else:
            results[test_file][1] += 1

        if status == 'PASS':
            results[test_file][0] += 1

    with open(summary_filename, 'w') as f:
        json.dump(results, f)

    print('Wrote summary file %s' % summary_filename)

if __name__ == '__main__':
    main()
