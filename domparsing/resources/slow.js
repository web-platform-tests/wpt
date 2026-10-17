{
  const id = new URL(document.currentScript.src).searchParams.get('id');
  if (id === String(window.current_test_id)) {
    window.events.push('slow');
    window.on_slow?.();
  }
}
