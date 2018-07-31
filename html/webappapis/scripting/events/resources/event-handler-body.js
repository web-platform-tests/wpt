const windowReflectingBodyElementEventHandlerSet =
  new Set(['blur', 'error', 'focus', 'load', 'resize', 'scroll']);

function handlersInInterface(mainIDL, name) {
  return mainIDL.find(idl => idl.name === name).members.map(member => member.name.slice(2));
}

const handlersListPromise = fetch("/interfaces/html.idl").then(res => res.text()).then(htmlIDL => {
  const parsedHTMLIDL = WebIDL2.parse(htmlIDL);
  const windowEventHandlers = handlersInInterface(parsedHTMLIDL, "WindowEventHandlers");

  const shadowedHandlers = [
    ...windowReflectingBodyElementEventHandlerSet,
    ...windowEventHandlers
  ];
  return {
    shadowedHandlers
  };
});
