Deploy to Heroku
================

This guide describes how to deploy a websockets server to Heroku_. The same
principles should apply to other Platform as a Service providers.

We're going to deploy a very simple app. The process would be identical for a
more realistic app.

.. _Heroku: https://www.heroku.com/

Create application
------------------

Deploying to Heroku requires a git repository. Let's initialize one:

.. code-block:: console

    $ mkdir websockets-echo
    $ cd websockets-echo
    $ git init -b main
    Initialized empty Git repository in websockets-echo/.git/
    $ git commit --allow-empty -m "Initial commit."
    [main (root-commit) 1e7947d] Initial commit.

Follow the `set-up instructions`_ to install the Heroku CLI and to log in, if
you haven't done that yet.

.. _set-up instructions: https://devcenter.heroku.com/articles/getting-started-with-python#set-up

Then, create a Heroku app — if you follow these instructions step-by-step,
you'll have to pick a different name because I'm already using
``websockets-echo`` on Heroku:

.. code-block:: console

    $ heroku create websockets-echo
    Creating ⬢ websockets-echo... done
    https://websockets-echo.herokuapp.com/ | https://git.heroku.com/websockets-echo.git

Here's the implementation of the app, an echo server. Save it in a file called
``app.py``:

.. literalinclude:: ../../example/deployment/heroku/app.py
    :language: text

Heroku expects the server to `listen on a specific port`_, which is provided
in the ``$PORT`` environment variable. The app reads it and passes it to
:func:`~websockets.server.serve`.

.. _listen on a specific port: https://devcenter.heroku.com/articles/preparing-a-codebase-for-heroku-deployment#4-listen-on-the-correct-port

Heroku sends a ``SIGTERM`` signal to all processes when `shutting down a
dyno`_. When the app receives this signal, it closes connections and exits
cleanly.

.. _shutting down a dyno: https://devcenter.heroku.com/articles/dynos#shutdown

Deploy application
------------------

In order to build the app, Heroku needs to know that it depends on websockets.
Create a ``requirements.txt`` file containing this line:

.. literalinclude:: ../../example/deployment/heroku/requirements.txt
    :language: text

Heroku also needs to know how to run the app. Create a ``Procfile`` with this
content:

.. literalinclude:: ../../example/deployment/heroku/Procfile

Confirm that you created the correct files and commit them to git:

.. code-block:: console

    $ ls
    Procfile         app.py           requirements.txt
    $ git add .
    $ git commit -m "Deploy echo server to Heroku."
    [main 8418c62] Deploy echo server to Heroku.
     3 files changed, 32 insertions(+)
     create mode 100644 Procfile
     create mode 100644 app.py
     create mode 100644 requirements.txt

The app is ready. Let's deploy it!

.. code-block:: console

    $ git push heroku

    ... lots of output...

    remote: -----> Launching...
    remote:        Released v1
    remote:        https://websockets-echo.herokuapp.com/ deployed to Heroku
    remote:
    remote: Verifying deploy... done.
    To https://git.heroku.com/websockets-echo.git
     * [new branch]      main -> main

Validate deployment
-------------------

Of course you'd like to confirm that your application is running as expected!

Since it's a WebSocket server, you need a WebSocket client, such as the
interactive client that comes with websockets.

If you're currently building a websockets server, perhaps you're already in a
virtualenv where websockets is installed. If not, you can install it in a new
virtualenv as follows:

.. code-block:: console

    $ python -m venv websockets-client
    $ . websockets-client/bin/activate
    $ pip install websockets

Connect the interactive client — using the name of your Heroku app instead of
``websockets-echo``:

.. code-block:: console

    $ python -m websockets wss://websockets-echo.herokuapp.com/
    Connected to wss://websockets-echo.herokuapp.com/.
    >

Great! Your app is running!

In this example, I used a secure connection (``wss://``). It worked because
Heroku served a valid TLS certificate for ``websockets-echo.herokuapp.com``.
An insecure connection (``ws://``) would also work.

Once you're connected, you can send any message and the server will echo it,
then press Ctrl-D to terminate the connection:

.. code-block:: console

    > Hello!
    < Hello!
    Connection closed: 1000 (OK).

You can also confirm that your application shuts down gracefully. Connect an
interactive client again — remember to replace ``websockets-echo`` with your app:

.. code-block:: console

    $ python -m websockets wss://websockets-echo.herokuapp.com/
    Connected to wss://websockets-echo.herokuapp.com/.
    >

In another shell, restart the dyno — again, replace ``websockets-echo`` with your app:

.. code-block:: console

    $ heroku dyno:restart -a websockets-echo
    Restarting dynos on ⬢ websockets-echo... done

Go back to the first shell. The connection is closed with code 1001 (going
away).

.. code-block:: console

    $ python -m websockets wss://websockets-echo.herokuapp.com/
    Connected to wss://websockets-echo.herokuapp.com/.
    Connection closed: 1001 (going away).

If graceful shutdown wasn't working, the server wouldn't perform a closing
handshake and the connection would be closed with code 1006 (connection closed
abnormally).
