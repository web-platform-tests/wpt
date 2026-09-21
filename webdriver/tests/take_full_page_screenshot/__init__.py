def full_page_dimensions(session):
    return tuple(session.execute_script("""
        const {scrollWidth, scrollHeight} = document.scrollingElement;

        return [
            scrollWidth,
            scrollHeight
        ];
        """))

def take_full_page_screenshot(session):
    return session.transport.send(
        "GET", "session/{session_id}/screenshot/full".format(**vars(session)))

