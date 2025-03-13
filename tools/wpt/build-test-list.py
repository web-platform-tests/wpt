import argparse
import json
from collections import defaultdict
from typing import Dict, Mapping, Optional, Sequence, Set
from urllib.parse import urljoin
from urllib.request import urlopen

DEFAULT_WPT_FYI = "https://wpt.fyi/"
DEFAULT_CATEGORY_URL = (
    "https://raw.githubusercontent.com/web-platform-tests/"
    "results-analysis/main/interop-scoring/category-data.json"
)
INTEROP_DATA_URL = "/static/interop-data.json"

# This needs to include product=chrome because of https://github.com/web-platform-tests/wpt.fyi/issues/4324
METADATA_URL = "/api/metadata?includeTestLevel=true&product=chrome"


class LabelledTestFinder:
    def __init__(self) -> None:
        self._interop_data = None
        self._category_data = None
        self._metadata_data = None

    @property
    def interop_data(self):
        if self._interop_data is None:
            url = urljoin(DEFAULT_WPT_FYI, INTEROP_DATA_URL)
            with urlopen(url) as f:
                self._interop_data = json.load(f)
        return self._interop_data

    @property
    def category_data(self):
        if self._category_data is None:
            url = urljoin(DEFAULT_WPT_FYI, DEFAULT_CATEGORY_URL)
            with urlopen(url) as f:
                self._category_data = json.load(f)
        return self._category_data

    @property
    def metadata_data(self):
        if self._metadata_data is None:
            url = urljoin(DEFAULT_WPT_FYI, METADATA_URL)
            with urlopen(url) as f:
                self._metadata_data = json.load(f)
        return self._metadata_data

    def category_for_focus_area(
        self, year: int, focus_area: str, only_active: bool = True
    ) -> str:
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

        return by_name[focus_area]

    def categories_for_year(
        self,
        year: int,
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
        self, year: int, use_interop_scoring_labels: bool = False
    ) -> Dict[str, Set[str]]:
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

    def tests_for_labels(self) -> Mapping[str, Set[str]]:
        rv = defaultdict(set)
        for test, metadata in self.metadata_data.items():
            for meta_item in metadata:
                if meta_item.get("label"):
                    if test.endswith("/*"):
                        test = test[:-1]
                    rv[meta_item["label"]].add(test)
        return rv


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--year",
        type=int,
        metavar="YEAR",
        help="Year used to query for Interop data",
    )
    parser.add_argument(
        "--category",
        action="append",
        dest="categories",
        help="Category identifier for Interop data",
    )
    parser.add_argument(
        "--focus-area",
        action="append",
        dest="focus_areas",
        help="Focus area description for Interop data",
    )
    parser.add_argument(
        "--label",
        action="append",
        dest="labels",
        help="Label to find",
    )
    parser.add_argument(
        "--only-active",
        action="store_true",
        default=True,
        help="Only find active Interop focus areas (default)",
    )
    parser.add_argument(
        "--no-only-active",
        action="store_false",
        dest="only_active",
        help="Include inactive Interop focus areas",
    )
    parser.add_argument(
        "--use-interop-scoring-categories",
        action="store_true",
        default=False,
        help="Use the list of categories used for scoring interop; this requires --no-only-active",
    )
    parser.add_argument(
        "--no-use-interop-scoring-categories",
        action="store_false",
        dest="use_interop_scoring_categories",
        help="Use the list of categories used for the interop dashboard (default)",
    )
    parser.add_argument(
        "--use-interop-scoring-labels",
        action="store_true",
        default=False,
        help="Use the list of labels used for scoring interop",
    )
    parser.add_argument(
        "--no-use-interop-scoring-labels",
        action="store_false",
        dest="use_interop_scoring_labels",
        help="Use the inline list of labels from the interop dashboard (default)",
    )
    return parser


def run(
    *,
    year: int,
    categories: Optional[Sequence[str]] = None,
    focus_areas: Optional[Sequence[str]] = None,
    labels: Optional[Sequence[str]] = None,
    only_active: bool = False,
    use_interop_scoring_categories: bool = False,
    use_interop_scoring_labels: bool = False,
) -> None:
    finder = LabelledTestFinder()

    search_categories = list(categories) if categories is not None else []

    if focus_areas:
        search_categories.extend(
            finder.category_for_focus_area(year, focus_area, only_active=only_active)
            for focus_area in focus_areas
        )

    if year is not None and not categories and not focus_areas:
        search_categories.extend(
            finder.categories_for_year(
                year,
                only_active=only_active,
                use_interop_scoring_categories=use_interop_scoring_categories,
            )
        )

    search_labels = list(labels) if labels is not None else []

    if search_categories:
        search_labels.extend(
            set.union(
                *(
                    v
                    for k, v in finder.labels_for_categories(
                        year, use_interop_scoring_labels=use_interop_scoring_labels
                    ).items()
                    if k in search_categories
                )
            )
        )

    tests = set.union(
        *(v for k, v in finder.tests_for_labels().items() if k in search_labels)
    )

    print("\n".join(sorted(tests, key=lambda x: x.split("/"))))
