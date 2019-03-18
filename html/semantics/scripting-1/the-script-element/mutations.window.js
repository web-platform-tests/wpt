self.globalScripts = []
self.globalLogs = []

function createGlobals() {
  // This memory leak is not long-lived, so let's live with it
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

    // TODO: decide on correct behavior
    assert_array_equals(self.globalLogs[globalsIndex], [1, 2, 3], `Gotten order: ${self.globalLogs[globalsIndex]}`);
  }, `Modifying the Text node data (initially "${initialScriptValue}") of the 2nd inserted script from the 1st inserted script`);
});

["", "new Text()", "new Text('self;')", "new Comment()"].forEach(toAppend => {
  test(() => {
    const script = document.createElement("script"),
          globalsIndex = createGlobals();
    script.textContent = `self.globalLogs[${globalsIndex}].push(1); self.globalScripts[${globalsIndex}].append(${toAppend}); self.globalLogs[${globalsIndex}].push(3);`;
    self.globalScripts[globalsIndex].append(`self.globalLogs[${globalsIndex}].push(2);`);
    document.body.append(script, self.globalScripts[globalsIndex]);

    // TODO: decide on correct behavior
    assert_array_equals(self.globalLogs[globalsIndex], [1, 3, 2], `Gotten order: ${self.globalLogs[globalsIndex]}`);
  }, `Appending \`${toAppend}\` to the 2nd inserted script from the 1st inserted script`);
});

test(() => {
  const script = document.createElement("script"),
        globalsIndex = createGlobals(),
        globalsIndex2 = createGlobals();
  script.textContent = `self.globalLogs[${globalsIndex}].push(1); self.globalScripts[${globalsIndex}].append(new Text(), self.globalScripts[${globalsIndex2}]); self.globalLogs[${globalsIndex}].push(3);`;
  self.globalScripts[globalsIndex].textContent = `self.globalLogs[${globalsIndex}].push(2)`;
  self.globalScripts[globalsIndex2].textContent = `self.globalLogs[${globalsIndex}].push(4)`;
  document.body.append(script, self.globalScripts[globalsIndex]);

  // TODO: decide on correct behavior
  assert_array_equals(self.globalLogs[globalsIndex], [1, 4, 3, 2], `Gotten order: ${self.globalLogs[globalsIndex]}`);
}, "Appending new Text() and a 3rd script to a 2nd inserted script from a 1st inserted script");
