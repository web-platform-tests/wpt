import requests


# GitHub Action script to check daily if a new Chromium revision is availble.
def check_chromium_revision() -> None:
    old_revision = requests.get("https://storage.googleapis.com/wpt-versions/pinned_chromium_revision")
    # A scheduled GCP function is run daily to update this file.
    new_revision = requests.get("https://storage.googleapis.com/wpt-versions/pinned_chromium_revision_NEW")
    # If the new revision different from the old revision, a change is made
    # to the repo so the designated Chromium PR is updated to have the
    # CI tests run. The old revision will be updated with another GitHub Action
    # if all of the CI tests pass.
    if old_revision.text != new_revision.text:
        with open("tools/wpt/pinned_chromium_revision.txt", "w") as f:
            f.write(f"{new_revision.text}\n")


if __name__ == "__main__":
    check_chromium_revision()  # type: ignore
