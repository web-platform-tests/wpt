# Updating Python version and dependencies for WPT

This is a guide for adding compatibility for new Python versions and updating dependencies for Web Platform Tests (WPT). Occasionally, WPT will need to update its infrastructure to the vendored dependencies that are necessary for running the Web Platform Tests suite will need to be updated. This process is often a series of trial and error to troubleshoot which pieces of the codebase need to be updated to accommodate the Python version change. This document will describe this process and the common issues that arise.

The steps involve looking closely at the update’s effect on the CI (Continuous Integration) tests, diagnosing the source of errors, making changes, and re-running the CI to view the results of the new changes.

### **Step 1:**
Update CI and environment files to reference the new Python version

Search for different patterns matching the previous-highest Python version, looking at all cases of the major version number followed by the minor version number with some optional characters in between. For example, if updating to Python 3.10, checking for major number “3” and minor number “9”. [(example)](https://github.com/web-platform-tests/wpt/pull/33706/commits/d77e0524fcef4475f63f8f029aa35ed68fc2c4e6)

### **Step 2:**
Create a draft pull request in order to run changes against the CI

[(explained here)](https://github.blog/2019-02-14-introducing-draft-pull-requests/) A draft pull request will allow the creator to view the code changes’ effect on the CI, without flagging the PR for review and notifying reviewers to look at the changes. Checking the viability of changes will rely heavily on viewing what errors arise from the CI.

Note: As of April 2022, there is a pipeline test in the CI named “affected tests without changes”. This piece of the CI will NOT properly take some dependency changes into account, and if this part of the pipeline is failing, it can usually be ignored.

### **Step 3:**
View errors that arise in the CI and determine the origin of the issue.

It’s likely that some Python dependencies will need to be updated to allow for compatibility with the new version. Usually, viewing the errors in the pipeline and doing a quick Google search can help point to which dependency is causing the issue.

For example, the upgrade to Python 3.10 revealed this persistent error on the CI’s Py3.10 runs:

```
TypeError: required field "lineno" missing from alias
```

A quick Google search revealed [many users seeing this similar error](https://github.com/pytest-dev/pytest/issues/8539), with constructive discussions, and a [solution to fix the issue](https://github.com/pytest-dev/pytest/issues/8539#issuecomment-832083778). The error required the Pytest dependency to be upgraded >=6.2.4.

### **Step 4:**
Make code or dependency changes. See the section below for instructions on updating dependencies.

### **Step 5:**
Commit changes and allow CI to run again

**Repeat steps 3-5 as necessary** until there are no errors present within the CI runs.

### **Step 6:**
Complete a full run of the test suite to view the results on wpt.fyi

[(instructions)](https://web-platform-tests.org/running-tests/from-ci.html) Use an experimental channel of a major browser (i.e. Chrome Dev).

### **Step 7:**
Retrieve the run results to evaluate.See the section below for instructions on finding your run results on wpt.fyi.

### **Step 8:**
Compare the results to expectations

Look for any unusually high difference numbers or failures in a specific test category. View the test numbers shown at the top on the blue banner when viewing the root directory results. This represents the number of tests that had different results. Ideally, the runs have few differences in test results, however some differences are expected. As of writing this guide, a difference between 50-150 tests is acceptable. An unusual number of different results will require further investigation.

### **Step 9:**
Finalize changes

If everything looks as expected at this point, then it’s probably safe to finalize your changes. It is likely in your (and your reviewers) best interest to create two separate PRs to merge your changes; one containing the changes to the CI and environment files, along with the version changes to installed dependencies, and another PR containing the git subtree commands to update the vendored dependencies. After the vendored dependency PR has been merged, it is safe to merge the other changes.

Congratulations! 🎉 You’ve updated the necessary dependencies and added an additional level of Python compatibility to WPT. Your work keeps the project healthy and easy to use. Thank you!

# Updating Python dependencies for WPT

WPT has two separate ways that dependencies are maintained; installed and vendored. Installed dependencies are installed based on the version specified in requirements files, but vendored dependencies come as subtrees within the WPT codebase. Both of these dependencies have a separate process to follow to be updated.

## Installed dependencies

Installed dependencies will require changing the version specified in relevant requirements files [(example)](https://github.com/pytest-dev/pytest/issues/8539). Sometimes an updated dependency will be compatible with the new Python version, but incompatible with an older version of Python that WPT has not yet dropped support for. It is possible in this scenario to specify the version of the dependency for separate versions of Python in the requirements file [(example)](https://github.com/web-platform-tests/wpt/pull/33706/commits/86ee502db41353606ae90f489bd8702edbea66f3).

## Vendored dependencies

Updating vendored dependencies can be a complicated process, but following this consistent procedure can make it simpler. Vendored dependencies live in the `tools/third_party` directory. Updating will require use of the [git subtree](https://www.atlassian.com/git/tutorials/git-subtree) process to pull in a version of the dependency’s repository that will be stored within the WPT codebase.

## Vendored dependency update process

### **Step 1:**
Identify the version tag you would like to update the version to. You can find the list of versions by viewing the tags available on the dependency’s repository. [(example for Pytest)](https://github.com/pytest-dev/pytest/tags). Typically the latest version can be attempted, downgrading as needed if the recent version is not compatible with all Python versions WPT supports.

### **Step 2:**
Most vendored dependencies can be updated by running the `git subtree pull` command in the repository’s root directory:
```bash
git subtree pull --prefix=tools/third_party/<dep_git_url> <tag> --squash
```

For example, if we were to attempt updating Pluggy to 1.0.0, the command would read as:

```bash
git subtree pull --prefix=tools/third_party/pluggy https://github.com/pytest-dev/pluggy.git 1.0.0 --squash
```

Note: Some of vendored dependencies for WPT (specifically Pytest) require the files created upon setup of the dependency, like when installing with pip for example. In this instance, installing the dependency with the planned update version using pip on your local machine and then copying the dependency’s pip directory into the `tools/third_party` directory INSTEAD of using `git subtree` will update the dependency while also including additional files needed to run [(example)](https://github.com/web-platform-tests/wpt/pull/33705/commits/834a5703dba3b4d3b2ac19867f861311721d34c8). This should only be used in the special instances, as the dependency will not longer be eligible to be updated with the `git subtree pull` command.

Look at the commit history for each dependency to view the approach others have taken to ensure your update approach is correct.

# Finding run results on wpt.fyi

1. View the [“Recent Runs” section of wpt.fyi](https://wpt.fyi/runs).
2. Select “EDIT” at the top left on the blue banner.
3. Remove all browsers except for the one in which you ran your full test suite.
4. Select the dropdown on the browser card labeled “Channel” and select “Experimental”.
5. Uncheck the box labeled “Only master branch”.
6. Click “Submit”.

You should now only see a list of runs matching your run’s description. Find the run with your change’s commit SHA and click the SHA. This is your test suite run and results from the entire test suite should be displayed. Save the run ID for this run by selecting “LINK” at the right of the blue banner and copying the link given in the popup. The run ID is in the query string of this link.

You’ll want to compare your results to a recent master branch test suite run. Follow the same steps as above to find a similar run, but do not uncheck the box labeled “Only master branch”. Select the run in the first row and follow the same process to save the run ID for this run.

To quickly view the test result differences, edit this URL query string to include the two run IDs:

`https://wpt.fyi/results/?q=is%3Adifferent&run_id=<your_run_id_here>&run_id=<master_run_id_here>`

Your change’s results will display on the left column and the control test run will display on the right.
