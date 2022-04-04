.PHONY: default style test coverage build clean

export PYTHONASYNCIODEBUG=1
export PYTHONPATH=src
export PYTHONWARNINGS=default

default: coverage style

style:
	isort src tests
	black src tests
	flake8 src tests
	mypy --strict src

test:
	python -m unittest

coverage:
	coverage erase
	coverage run -m unittest
	coverage html
	coverage report --show-missing --fail-under=100

build:
	python setup.py build_ext --inplace

clean:
	find . -name '*.pyc' -o -name '*.so' -delete
	find . -name __pycache__ -delete
	rm -rf .coverage .mypy_cache build compliance/reports dist docs/_build htmlcov MANIFEST src/websockets.egg-info
