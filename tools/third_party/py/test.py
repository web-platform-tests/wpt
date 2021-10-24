import sys
if __name__ == '__main__':
    from third_party import pytest
    sys.exit(pytest.main())
else:
    import sys, pytest
    sys.modules['py.test'] = pytest

# for more API entry points see the 'tests' definition
# in __init__.py
