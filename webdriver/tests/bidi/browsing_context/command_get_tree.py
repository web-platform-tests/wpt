import pytest


@pytest.mark.asyncio
async def test_get_tree_returns_initial_context(send_blocking_command):
    response = await send_blocking_command("browsingContext.getTree", {})

    assert len(response['contexts']) == 1
    context_id = response['contexts'][0]['context']
    assert isinstance(context_id, str)
    assert len(context_id) > 1
    assert response == {
        "contexts": [{
            "context": context_id,
            "children": [],
            "url": "about:blank"}]}
