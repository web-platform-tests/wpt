import requests
from time import time

from .utils import get


PLATFORM_INFO = [
    ("Win_x64", "chrome-win.zip"),
    ("Win", "chrome-win.zip"),
    ("Linux_x64", "chrome-linux.zip"),
    ("Mac", "chrome-mac.zip")
]
SNAPSHOTS_PATH = "https://storage.googleapis.com/chromium-browser-snapshots/"


def main(timeout=600.0):
    start = time()

    # Load existing pinned revision.
    existing_revision = None
    with open("tools/wpt/latest_chromium_revision.txt", "r") as f:
        existing_revision = int(f.read())

    # Find the lowest new revision number among latest revisions by platform.
    # We need to find a revision number that is available for download for all platforms,
    # so we start looking from the smallest of these latest revisions.
    smallest_revision = existing_revision
    for platform, filename in PLATFORM_INFO:
        try:
            url = f"{SNAPSHOTS_PATH}{platform}/LAST_CHANGE"
            revision = get(url).text.strip()
            smallest_revision = max(smallest_revision, int(revision))
        except requests.RequestException as e:
            print(f"failed LAST_CHANGE lookup for {platform}: {e}")
            continue

    if smallest_revision == existing_revision:
        return

    # Step backwards through revision numbers until we find one
    # that is available for all platforms.
    largest_mutually_available_revision = smallest_revision
    available_for_all = False
    timed_out = False
    while not available_for_all and not timed_out:
        available_for_all = True
        # For each platform, check if Chromium is available for download from snapshots.
        for platform, filename in PLATFORM_INFO:
            try:
                url = (f"{SNAPSHOTS_PATH}{platform}/"
                       f"{largest_mutually_available_revision}/{filename}")
                # Check the headers of each possible download URL.
                r = requests.head(url)
                # If the "Accept-Ranges" header is not present, we know the file is not
                # available for download. Decrement the revision number and try again.
                if "Accept-Ranges" not in r.headers:
                    largest_mutually_available_revision -= 1
                    available_for_all = False
                    break
            except requests.RequestException as e:
                print(e)
                largest_mutually_available_revision -= 1
                available_for_all = False
                break
        if time() - start > timeout:
            timed_out = True

    if timed_out:
        raise TimeoutError(f"Reached timeout {timeout}s while checking revision "
                           f"{largest_mutually_available_revision}")

    end = time()
    if largest_mutually_available_revision == existing_revision:
        print(f"No new mutually available revision numbers found after "
              f"{'{:.2f}'.format(end - start)} seconds.")
        return

    print(f"Found mutually available revision at {largest_mutually_available_revision}.")
    print(f"This process started at {smallest_revision} and checked "
          f"{smallest_revision - largest_mutually_available_revision} revisions.")
    print(f"The whole process took {'{:.2f}'.format(end - start)} seconds.")

    with open("tools/wpt/latest_chromium_revision.txt", "w") as f:
        f.write(f"{largest_mutually_available_revision}\n")


if __name__ == "__main__":
    main()  # type: ignore
