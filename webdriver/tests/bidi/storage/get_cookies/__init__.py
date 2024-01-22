from webdriver.bidi.modules.script import ContextTarget


async def add_cookie(
    bidi_session,
    context,
    name,
    value,
    domain=None,
    expiry=None,
    path=None,
    same_site="none",
    secure=False,
):
    cookies = f"{name}={value}"

    if domain is not None:
        cookies += f";domain={domain}"

    if expiry is not None:
        cookies += f";expires={expiry}"

    if path is not None:
        cookies += f";path={path}"

    if same_site != "none":
        cookies += f";SameSite={same_site}"

    if secure is True:
        cookies += ";Secure"

    await bidi_session.script.evaluate(
        expression=f"document.cookie = '{cookies}'",
        target=ContextTarget(context),
        await_promise=True,
    )


async def remove_cookie(bidi_session, context, cookie_name):
    await bidi_session.script.evaluate(
        expression=f"document.cookie = '{cookie_name}=; Max-Age=0'",
        target=ContextTarget(context),
        await_promise=True,
    )
