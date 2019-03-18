self.globalScripts = []
self.globalLogs = []

function createGlobals() {
  self.globalScripts.push(document.createElement("script"));
  self.globalLogs.push([]);
  return self.globalScripts.length - 1;
}

["", " ", ";"].forEach(initialScriptValue => {
  test(() => {
    const script = document.createElement("script"),
          globalsIndex = createGlobals();
    script.textContent = `self.globalLogs[${globalsIndex}].push(1); self.globalScripts[${globalsIndex}].firstChild.data = 'self.globalLogs[${globalsIndex}].push(2)'; self.globalLogs[${globalsIndex}].push(3);`;
    self.globalScripts[globalsIndex].append(initialScriptValue);
    document.body.append(script, self.globalScripts[globalsIndex]);
    assert_array_equals(self.globalLogs[globalsIndex], [1, 2, 3], `Gotten order: ${self.globalLogs[globalsIndex]}`);
  }, `Modifying the Text node data (initially "${initialScriptValue}") of the 2nd inserted script from the 1st inserted script`);
});

test(() => {
  const script = document.createElement("script"),
        globalsIndex = createGlobals();
  script.textContent = `self.globalLogs[${globalsIndex}].push(1); self.globalScripts[${globalsIndex}].append(new Comment()); self.globalLogs[${globalsIndex}].push(3);`;
  self.globalScripts[globalsIndex].append(`self.globalLogs[${globalsIndex}].push(2)`);
  document.body.append(script, self.globalScripts[globalsIndex]);
  assert_array_equals(self.globalLogs[globalsIndex], [1, 3, 2], `Gotten order: ${self.globalLogs[globalsIndex]}`);
});
