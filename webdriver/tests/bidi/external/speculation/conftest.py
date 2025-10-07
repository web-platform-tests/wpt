import pytest
from typing import Any, Mapping

from webdriver.bidi.modules.script import ContextTarget


@pytest.fixture
def speculation_rules_helper(bidi_session):
    """Helper for adding speculation rules to a page."""
    
    async def add_speculation_rules(context: Mapping[str, Any], rules: str):
        """Add speculation rules script to the page."""
        await bidi_session.script.evaluate(
            expression=f"""
                const script = document.createElement('script');
                script.type = 'speculationrules';
                script.textContent = `{rules}`;
                document.head.appendChild(script);
            """,
            target=ContextTarget(context["context"]),
            await_promise=False
        )
    
    return add_speculation_rules


@pytest.fixture
def add_prefetch_link(bidi_session):
    """Helper for adding links to the page that can be targeted by speculation rules."""
    
    async def add_link(context: Mapping[str, Any], href: str, text: str = "Test Link", link_id: str = "prefetch-page"):
        """Add a link to the page for prefetch targeting."""
        await bidi_session.script.evaluate(
            expression=f"""
                const link = document.createElement('a');
                link.href = '{href}';
                link.textContent = '{text}';
                link.id = '{link_id}';
                document.body.appendChild(link);
            """,
            target={"context": context["context"]},
            await_promise=False
        )
    
    return add_link