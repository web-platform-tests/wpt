'use strict';

this.addEventListener('install', event => {
    this.skipWaiting();
});

this.addEventListener('activate', event => {
    clients.claim();
});

this.addEventListener('fetch', event => {
    if (event.request.url.includes('test.txt')) {
        event.respondWith(new Response('current'));
    }
});
