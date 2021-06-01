// import()s in eval are resolved relative to the script, even when indirected through Web IDL callbacks
setTimeout(eval, 0, `import('../../imports-a.js?label=' + window.label).then(window.continueTest, window.errorTest)`);
