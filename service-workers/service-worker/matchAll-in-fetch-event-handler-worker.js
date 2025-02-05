function responseFromClient(e, testName, client, isTimeout)
{
    let body = '';
    if (isTimeout)
        body = 'Timed out';
    else if (!client)
        body = 'No client';
    else
        body = JSON.stringify({ clientId:client.id, clientURL:client.url });
    return new Response('<html><body>' + testName + ' ' + e.resultingClientId + ':<br>' + body + '</body></html>', { headers: [['Content-Type', 'text/html']] });
}

function responseFromClients(e, testName, clients, isTimeout)
{
    let body = '';
    if (isTimeout)
        body = 'Timed out';
    else if (!clients)
        body = 'No client';
    else {
        for (let client of clients) {
            body += JSON.stringify({ clientId:client.id, clientURL:client.url });
            body += '<br>';
        }
    }
    return new Response('<html><body>' + testName + ' ' + e.resultingClientId + ':<br>' + body + '</body></html>', { headers: [['Content-Type', 'text/html']] });
}

function waitForGetBeforeAnswering(e)
{
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(responseFromClient(e, 'waitForGetBeforeAnswering', null, true));
        }, 1000);
        self.clients.get(e.resultingClientId).then(client => {
            resolve(responseFromClient(e, 'waitForGetBeforeAnswering', client));
        }, reject); 
    });
}

function waitForGetAfterSendingResponse(e)
{
    let controller;
    const stream = new ReadableStream({ start : c => controller = c});

    self.clients.get(e.resultingClientId).then(client => {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('<html><body>waitForGetAfterSendingResponse: ' + e.resultingClientId + '<br>'));
        if (client)
            controller.enqueue(encoder.encode(JSON.stringify({ clientId:client.id, clientURL:client.url })));
        else
            controller.enqueue(encoder.encode('no client'));
        controller.enqueue(encoder.encode('</body></html>'));
    }, e => {
    }).finally(() => {
        controller.close();
    });

    return new Response(stream, { headers: [['Content-Type', 'text/html']] });
}

function waitForGetAfterSendingPartialBody(e)
{
    let controller;
    const stream = new ReadableStream({ start : c => controller = c});

    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode('<html><body>waitForGetAfterSendingPartialBody: ' + e.resultingClientId + ':<br>'));
    self.clients.get(e.resultingClientId).then(client => {
        if (client)
            controller.enqueue(encoder.encode(JSON.stringify({ clientId:client.id, clientURL:client.url })));
        else
            controller.enqueue(encoder.encode('no client'));
        controller.enqueue(encoder.encode('</body></html>'));
    }, e => {
    }).finally(() => {
        controller.close();
    });
    return new Response(stream, { headers: [['Content-Type', 'text/html']] });
}

function waitForGetAfterSendingDelayedPartialBody(e)
{
    let controller;
    const stream = new ReadableStream({ start : c => controller = c});

    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode('<html><body>waitForGetAfterSendingDelayedPartialBody: ' + e.resultingClientId + ':<br>'));
    setTimeout(() => {
        self.clients.get(e.resultingClientId).then(client => {
            if (client)
                controller.enqueue(encoder.encode(JSON.stringify({ clientId:client.id, clientURL:client.url })));
            else
                controller.enqueue(encoder.encode('no client'));
            controller.enqueue(encoder.encode('</body></html>'));
        }, e => {
        }).finally(() => {
            controller.close();
        });
    }, 1000);
    return new Response(stream, { headers: [['Content-Type', 'text/html']] });
}

function waitForMatchAllControlled(e)
{
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(responseFromClients(e, 'waitForMatchAllControlled', null, true));
        }, 1000);
        self.clients.matchAll().then(clients => {
            resolve(responseFromClients(e, 'waitForMatchAllControlled', clients));
        }, reject); 
    });
}

function waitForMatchAllUncontrolled(e)
{
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(responseFromClients(e, 'waitForMatchAllUncontrolled', null, true));
        }, 1000);
        self.clients.matchAll({ includeUncontrolled:true }).then(clients => {
            resolve(responseFromClients(e, 'waitForMatchAllUncontrolled', clients));
        }, reject); 
    });
}

onfetch = e => {
    let responsePromise;

    if (e.request.url.includes('waitForGetBeforeAnswering'))
        responsePromise = waitForGetBeforeAnswering(e);
    else if (e.request.url.includes('waitForGetAfterSendingResponse'))
        responsePromise = waitForGetAfterSendingResponse(e);
    else if (e.request.url.includes('waitForGetAfterSendingPartialBody'))
        responsePromise = waitForGetAfterSendingPartialBody(e);
    else if (e.request.url.includes('waitForGetAfterSendingDelayedPartialBody'))
        responsePromise = waitForGetAfterSendingDelayedPartialBody(e);
    else if (e.request.url.includes('waitForMatchAllControlled'))
        responsePromise = waitForMatchAllControlled(e);
    else if (e.request.url.includes('waitForMatchAllUncontrolled'))
        responsePromise = waitForMatchAllUncontrolled(e);

    if (!responsePromise)
        return;
    e.waitUntil(responsePromise);
    e.respondWith(responsePromise);
}
