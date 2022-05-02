import requests
from time import time


PLATFORM_INFO = [
    ("Win_x64", "chrome-win.zip"),
    ("Win", "chrome-win.zip"),
    ("Linux_x64", "chrome-linux.zip"),
    ("Mac", "chrome-mac.zip")
]
SNAPSHOTS_PATH = "https://storage.googleapis.com/chromium-browser-snapshots/"


def main(timeout: float = 600.0) -> None:
    start = time()

    # Load existing pinned revision.
    start_revision = None
    with open("tools/wpt/pinned_chromium_revision.txt", "r") as f:
        existing_revision = int(f.read())

    # Get the latest revision for Linux as a starting point to check for
    # a valid revision for all platforms.
    try:
        url = f"{SNAPSHOTS_PATH}Linux_x64/LAST_CHANGE"
        start_revision = int(requests.get(url).text.strip())
    except requests.RequestException as e:
        raise requests.RequestException(f"Failed LAST_CHANGE lookup: {e}")

    if start_revision == existing_revision:
        return

    # Step backwards through revision numbers until we find one
    # that is available for all platforms.
    candidate_revision = start_revision
    new_revision = -1
    timed_out = False
    while new_revision == -1 and candidate_revision > existing_revision:
        available_for_all = True
        # For each platform, check if Chromium is available for download from snapshots.
        for platform, filename in PLATFORM_INFO:
            try:
                url = (f"{SNAPSHOTS_PATH}{platform}/"
                       f"{candidate_revision}/{filename}")
                # Check the headers of each possible download URL.
                r = requests.head(url)
                # If the file is not available for download, decrement the revision and try again.
                if r.status_code != 200:
                    candidate_revision -= 1
                    available_for_all = False
                    break
            except requests.RequestException:
                print(f"Failed to fetch headers for revision {candidate_revision}. Skipping it.")
                candidate_revision -= 1
                available_for_all = False
                break

        if available_for_all:
            new_revision = candidate_revision
        if time() - start > timeout:
            timed_out = True
            break

    if timed_out:
        raise TimeoutError(f"Reached timeout {timeout}s while checking revision "
                           f"{candidate_revision}")

    end = time()
    if new_revision <= existing_revision:
        print(f"No new mutually available revision found after "
              f"{'{:.2f}'.format(end - start)} seconds. Keeping revision {existing_revision}.")
        return

    print(f"Found mutually available revision at {new_revision}.")
    print(f"This process started at {start_revision} and checked "
          f"{start_revision - new_revision} revisions.")
    print(f"The whole process took {'{:.2f}'.format(end - start)} seconds.")

    with open("tools/wpt/pinned_chromium_revision.txt", "w") as f:
        f.write(f"{new_revision}\n")


if __name__ == "__main__":
    main()
