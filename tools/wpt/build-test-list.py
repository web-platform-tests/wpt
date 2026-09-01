#!/usr/bin/env python3

import argparse
import json
import logging
import sys
from collections import defaultdict
from collections.abc import Mapping, Sequence, Set
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, IO, Optional
from urllib.parse import urljoin
from urllib.request import urlopen

_log = logging.getLogger(__name__)

DEFAULT_WPT_FYI = "https://wpt.fyi/"
DEFAULT_CATEGORY_URL = (
    "https://raw.githubusercontent.com/web-platform-tests/"
    "results-analysis/main/interop-scoring/category-data.json"
)
INTEROP_DATA_URL = "/static/interop-data.json"

# This needs to include product=chrome because of https://github.com/web-platform-tests/wpt.fyi/issues/4324
METADATA_URL = "/api/metadata?includeTestLevel=true&product=chrome"


@dataclass(frozen=True)
class InteropYear:
    start_date: date  # inclusive
    end_date: date  # inclusive

    def __post_init__(self) -> None:
        if self.start_date > self.end_date:
            raise ValueError("Start date cannot be after the end date")

    @property
    def year(self) -> int:
        return self.start_date.year


known_interop_years: Set[InteropYear] = {
    InteropYear(start_date=date(2021, 3, 22), end_date=date(2021, 12, 31)),
    InteropYear(start_date=date(2022, 3, 3), end_date=date(2022, 12, 31)),
    InteropYear(start_date=date(2023, 2, 1), end_date=date(2024, 2, 1)),
    InteropYear(start_date=date(2024, 2, 1), end_date=date(2025, 2, 6)),
    InteropYear(start_date=date(2025, 2, 12), end_date=date(2026, 2, 12)),
    InteropYear(start_date=date(2026, 2, 12), end_date=date(2027, 12, 31)),
}


class LabelledTestFinder:
    def __init__(self) -> None:
        self._interop_data = None
        self._category_data = None
        self._metadata_data = None

    @property
    def interop_data(self) -> Any:
        if self._interop_data is None:
            url = urljoin(DEFAULT_WPT_FYI, INTEROP_DATA_URL)
            _log.info("Loading Interop data from %s", url)
            with urlopen(url) as f:
                self._interop_data = json.load(f)
                _log.debug("Loaded Interop data")
        return self._interop_data

    @property
    def category_data(self) -> Any:
        if self._category_data is None:
            url = urljoin(DEFAULT_WPT_FYI, DEFAULT_CATEGORY_URL)
            _log.info("Loading Interop category data from %s", url)
            with urlopen(url) as f:
                self._category_data = json.load(f)
                _log.debug("Loaded Interop category data")
        return self._category_data

    @property
    def metadata_data(self) -> Any:
        if self._metadata_data is None:
            url = urljoin(DEFAULT_WPT_FYI, METADATA_URL)
            _log.info("Loading WPT metadata from %s", url)
            with urlopen(url) as f:
                self._metadata_data = json.load(f)
                _log.debug("Loaded WPT metadata")
        return self._metadata_data

    def category_for_focus_area(self, year: int, focus_area: str) -> str:
        year_key = str(year)
        if year_key not in self.interop_data:
            raise ValueError(f"Unknown year: {year}")

        by_name = {
            v["description"]: k
            for k, v in self.interop_data[year_key]["focus_areas"].items()
        }

        categories = self.interop_data[year_key]["focus_areas"].keys()

        assert len(categories) == len(
            by_name
        ), "duplicate descriptions should not exist"

        if focus_area not in by_name:
            raise ValueError(f"Unknown focus area: {focus_area}")

        category = by_name[focus_area]
        assert isinstance(category, str)
        return category

    def categories_for_year(
        self,
        year: int,
        *,
        only_active: bool = True,
        use_interop_scoring_categories: bool = False,
    ) -> Set[str]:
        if only_active and use_interop_scoring_categories:
            raise ValueError(
                "Cannot select only active categories when using category data"
            )

        year_key = str(year)

        if use_interop_scoring_categories:
            if year_key not in self.category_data:
                raise ValueError(f"Unknown year: {year}")

            return {i["name"] for i in self.category_data[year_key]["categories"]}

        if year_key not in self.interop_data:
            raise ValueError(f"Unknown year: {year}")

        return {
            key
            for key, value in self.interop_data[year_key]["focus_areas"].items()
            if not only_active or value["countsTowardScore"]
        }

    def labels_for_categories(
        self, year: int, *, use_interop_scoring_labels: bool = False
    ) -> Mapping[str, Set[str]]:
        year_key = str(year)

        if use_interop_scoring_labels:
            if year_key not in self.category_data:
                raise ValueError(f"Unknown year: {year}")

            return {
                v["name"]: set(v["labels"])
                for v in self.category_data[year_key]["categories"]
            }

        if year_key not in self.category_data:
            raise ValueError(f"Unknown year: {year}")

        return {
            k: set(v["labels"])
            for k, v in self.interop_data[year_key]["focus_areas"].items()
        }

    def discover_years_from_data(
        self, *, use_interop_scoring_categories: bool = False
    ) -> Set[int]:
        """Extract all years available in interop_data or category_data.

        Returns a set of year integers found in the data source.
        """
        if use_interop_scoring_categories:
            data = self.category_data
        else:
            data = self.interop_data

        # Extract year keys and convert to integers
        return {int(year_key) for year_key in data.keys() if year_key.isdigit()}

    def tests_for_labels(self) -> Mapping[str, Set[str]]:
        rv = defaultdict(set)
        for test, metadata in self.metadata_data.items():
            if test.endswith("/*"):
                test = test[:-1]
            for meta_item in metadata:
                if meta_item.get("label"):
                    rv[meta_item["label"]].add(test)
        return rv


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()

    interop_group = parser.add_argument_group("Interop")
    interop_group.add_argument(
        "--year",
        action="append",
        dest="years",
        type=int,
        metavar="YEAR",
        help="Year used to query for Interop data (can be specified multiple times)",
    )
    interop_group.add_argument(
        "--category",
        action="append",
        dest="categories",
        help="Category identifier for Interop data",
    )
    interop_group.add_argument(
        "--focus-area",
        action="append",
        dest="focus_areas",
        help="Focus area description for Interop data",
    )
    interop_group.add_argument(
        "--only-active",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Only find active Interop focus areas",
    )
    interop_group.add_argument(
        "--use-interop-scoring-categories",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Use the list of categories used for scoring interop; this requires --no-only-active",
    )
    interop_group.add_argument(
        "--use-interop-scoring-labels",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Use the list of labels used for scoring interop",
    )
    interop_group.add_argument(
        "--include-unknown-years",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="When no years specified, include years found in data sources that aren't in the known years list. "
        "Unknown years are assumed to run from February 1 to February 28/29 of the following year. "
        "Use --no-include-unknown-years to disable.",
    )

    wptmeta_group = parser.add_argument_group("WPT Metadata")
    wptmeta_group.add_argument(
        "--label",
        action="append",
        dest="labels",
        help="Label to find",
    )

    parser.add_argument(
        "--verbose",
        "-v",
        action="count",
        default=0,
        help="Verbose, can be provided multiple times",
    )
    parser.add_argument(
        "outfile",
        nargs="?",
        type=argparse.FileType("w", encoding="UTF-8"),
        default=sys.stdout,
        help="Output file or - for stdout",
    )

    return parser


def run(
    *,
    years: Optional[Sequence[int]] = None,
    categories: Optional[Sequence[str]] = None,
    focus_areas: Optional[Sequence[str]] = None,
    labels: Optional[Sequence[str]] = None,
    only_active: bool = False,
    use_interop_scoring_categories: bool = False,
    use_interop_scoring_labels: bool = False,
    include_unknown_years: bool = True,
    outfile: IO[str] = sys.stdout,
) -> bool:

    # Canonicalize these to empty lists:
    years = years if years is not None else []
    focus_areas = focus_areas if focus_areas is not None else []

    # This are mutable things we might add to:
    search_labels = list(labels) if labels is not None else []
    search_categories = list(categories) if categories is not None else []

    today = datetime.now(timezone.utc).date()

    finder = LabelledTestFinder()

    all_interop_years: dict[int, InteropYear] = {
        interop.year: interop for interop in known_interop_years
    }

    if include_unknown_years:
        discovered_years = finder.discover_years_from_data(
            use_interop_scoring_categories=use_interop_scoring_categories
        )
        for year in discovered_years - all_interop_years.keys():
            # Each year has typically run from early Feb to mid Feb, so let's assume Feb
            # 1 till the last day of the following Feb.
            all_interop_years[year] = InteropYear(
                start_date=date(year, 2, 1),
                end_date=date(year + 1, 3, 1) - timedelta(days=1),
            )
            _log.warning(
                "Year %d found in data sources but not in known years list. "
                "Assuming it runs from %s to %s.",
                year,
                all_interop_years[year].start_date,
                all_interop_years[year].end_date,
            )

    for year in years:
        try:
            interop_year = all_interop_years[year]
        except KeyError:
            _log.warning(
                "Interop %d is unknown, only the following years are known: %s",
                year,
                ", ".join(str(y) for y in sorted(all_interop_years)),
            )
            continue

        if interop_year.start_date > today:
            _log.warning(
                "Interop %d is yet to launch; it will launch on %s",
                interop_year.year,
                interop_year.start_date,
            )

        if interop_year.end_date < today:
            _log.warning(
                "Interop %d has ended with its results frozen since %s",
                interop_year.year,
                interop_year.end_date,
            )

    if not years and (focus_areas or search_categories or not search_labels):
        years = sorted(
            {
                item.year
                for item in all_interop_years.values()
                if item.start_date <= today <= item.end_date
            }
        )
        _log.info(
            "No years specified, defaulting to active Interop years: %s",
            ", ".join(str(y) for y in years),
        )

    if len(years) > 1 and (focus_areas or search_categories):
        _log.warning(
            "Multiple years specified, may have surprising results with focus areas and categories"
        )

    # Nothing specified, default to everything in the year:
    if not search_categories and not focus_areas and not search_labels:
        for year in years:
            _log.info(
                "No categories or focus areas specified, "
                "defaulting to all tests in Interop %d",
                year,
            )
            search_categories.extend(
                finder.categories_for_year(
                    year,
                    only_active=only_active,
                    use_interop_scoring_categories=use_interop_scoring_categories,
                )
            )

    if focus_areas:
        for year in years:
            _log.debug(
                "Finding the categories which make up Interop %d focus areas: %s",
                year,
                ", ".join(focus_areas),
            )
            search_categories.extend(
                finder.category_for_focus_area(year, focus_area)
                for focus_area in focus_areas
            )

    if search_categories:
        for year in years:
            _log.debug(
                "Finding the labels which make up Interop %d categories: %s",
                year,
                ", ".join(search_categories),
            )
            search_labels.extend(
                set().union(
                    *(
                        v
                        for k, v in finder.labels_for_categories(
                            year, use_interop_scoring_labels=use_interop_scoring_labels
                        ).items()
                        if k in search_categories
                    )
                )
            )

    if not search_labels:
        _log.error("We cannot find tests without any labels to search for")
        return False

    _log.debug("Finding tests with labels: %s", ", ".join(search_labels))
    tests = set().union(
        *(v for k, v in finder.tests_for_labels().items() if k in search_labels)
    )

    print("\n".join(sorted(tests, key=lambda x: x.split("/"))), file=outfile)

    return True


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logging.captureWarnings(True)
    parser = get_parser()
    args = parser.parse_args()
    logging.getLogger().setLevel(max(1, logging.WARNING - args.verbose * 10))
    kwargs = vars(args)
    del kwargs["verbose"]
    sys.exit(int(not run(**kwargs)))
