self.onmessage = async (evt) => {
  const client = await clients.get(evt.clientId):
  client.postMessage({ ancestorOrigins: client.ancestorOrigins });
};
