import pytest

from support.fixtures import (
    create_dialog, create_frame, create_window, http, server_config, session,
    session_session, switch_to_inactive, url)

pytest.fixture()(create_dialog)
pytest.fixture()(create_frame)
pytest.fixture()(create_window)
pytest.fixture()(http)
pytest.fixture()(server_config)
pytest.fixture(scope="function")(session)
pytest.fixture()(session_session)
pytest.fixture()(switch_to_inactive)
pytest.fixture()(url)
