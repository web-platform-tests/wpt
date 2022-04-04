Deploying to Heroku
===================

This guide describes how to deploy a websockets server to Heroku_. We're going
to deploy a very simple app. The process would be identical for a more
realistic app.

.. _Heroku: https://www.heroku.com/

Create application
------------------

Deploying to Heroku requires a git repository. Let's initialize one:

.. code:: console

    $ mkdir websockets-echo
    $ cd websockets-echo
    $ git init .
    Initialized empty Git repository in websockets-echo/.git/
    $ git commit --allow-empty -m "Initial commit."
    [master (root-commit) 1e7947d] Initial commit.

Follow the `set-up instructions`_ to install the Heroku CLI and to log in, if
you haven't done that yet.

.. _set-up instructions: https://devcenter.heroku.com/articles/getting-started-with-python#set-up

Then, create a Heroku app — if you follow these instructions step-by-step,
you'll have to pick a different name because I'm already using
``websockets-echo`` on Heroku:

.. code:: console

    $ $ heroku create websockets-echo
    Creating ⬢ websockets-echo... done
    https://websockets-echo.herokuapp.com/ | https://git.heroku.com/websockets-echo.git

Here's the implementation of the app, an echo server. Save it in a file called
``app.py``:

.. code:: python

    #!/usr/bin/env python

    import asyncio
    import os

    import websockets

    async def echo(websocket, path):
        async for message in websocket:
            await websocket.send(message)

    start_server = websockets.serve(echo, "", int(os.environ["PORT"]))

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()

The server relies on the ``$PORT`` environment variable to tell on which port
it will listen, according to Heroku's conventions.

Configure deployment
--------------------

In order to build the app, Heroku needs to know that it depends on websockets.
Create a ``requirements.txt`` file containing this line:

.. code::

    websockets

Heroku also needs to know how to run the app. Create a ``Procfile`` with this
content:

.. code::

    web: python app.py

Confirm that you created the correct files and commit them to git:

.. code:: console

    $ ls
    Procfile         app.py           requirements.txt
    $ git add .
    $ git commit -m "Deploy echo server to Heroku."
    [master 8418c62] Deploy echo server to Heroku.
     3 files changed, 19 insertions(+)
     create mode 100644 Procfile
     create mode 100644 app.py
     create mode 100644 requirements.txt

Deploy
------

Our app is ready. Let's deploy it!

.. code:: console

    $ git push heroku master

    ... lots of output...

    remote: -----> Launching...
    remote:        Released v3
    remote:        https://websockets-echo.herokuapp.com/ deployed to Heroku
    remote:
    remote: Verifying deploy... done.
    To https://git.heroku.com/websockets-echo.git
     * [new branch]      master -> master

Validate deployment
-------------------

Of course we'd like to confirm that our application is running as expected!

Since it's a WebSocket server, we need a WebSocket client, such as the
interactive client that comes with websockets.

If you're currently building a websockets server, perhaps you're already in a
virtualenv where websockets is installed. If not, you can install it in a new
virtualenv as follows:

.. code:: console

    $ python -m venv websockets-client
    $ . websockets-client/bin/activate
    $ pip install websockets

Connect the interactive client — using the name of your Heroku app instead of
``websockets-echo``:

.. code:: console

    $ python -m websockets wss://websockets-echo.herokuapp.com/
    Connected to wss://websockets-echo.herokuapp.com/.
    >

Great! Our app is running!

In this example, I used a secure connection (``wss://``). It worked because
Heroku served a valid TLS certificate for ``websockets-echo.herokuapp.com``.
An insecure connection (``ws://``) would also work.

Once you're connected, you can send any message and the server will echo it,
then press Ctrl-D to terminate the connection:

.. code:: console

    > Hello!
    < Hello!
    Connection closed: code = 1000 (OK), no reason.
