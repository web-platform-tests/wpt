(function() {
"use strict";

function getQuery() {
  var query = window.location.search.substring(1);
  var vars = query.split("&");

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");

    if (pair[0] === "query") {
      return decodeURIComponent(pair[1].replace(/\+/g, "%20"));
    }
  }

  return null;
}

function highlight(text, positions) {
  var ctxLength = 30;
  // Trim leading white space as a workaround for a known bug in the Lunr.js
  // library:
  // https://github.com/olivernn/lunr.js/issues/386
  var trimmedText = text.trim();

  return positions.map(function(position) {
      var res = "";
      var matchStart = position[0];
      var matchEnd = matchStart + position[1];
      var ctxStart = Math.max(0, matchStart - ctxLength);
      var ctxEnd = Math.min(matchEnd + ctxLength, trimmedText.length);

      res += "<p>";
      if (ctxStart > 0) {
        res += "[...] ";
      }

      res += trimmedText.substring(ctxStart, matchStart);
      res += "<mark>";
      res += trimmedText.substring(matchStart, matchEnd);
      res += "</mark>";
      res += trimmedText.substring(matchEnd, ctxEnd);

      if (ctxEnd < trimmedText.length) {
        res += " [...]";
      }

      res += "</p>";

    return res;
  }).join("");
}

function truncate(text) {
  var truncated = text.substring(0, 150);

  if (truncated.length < text.length) {
    truncated += " [...]";
  }

  return "<p>" + truncated + "</p>";
}

function displaySearchResults(results, store) {
  if (!results.length) {
    return "<li>No results found</li>";
  }

  var appendString = "";

  for (var i = 0; i < results.length; i++) {  // Iterate over the results
    var result = results[i];
    var item = store[results[i].ref];
    for (var termValue in result.matchData.metadata) {
      var term = result.matchData.metadata[termValue];
      appendString += "<li><a href=\"" + item.url + "\">";
      appendString += "" + item.title + "</a>";

      if (term.content) {
        appendString += highlight(item.content, term.content.position);
      } else {
        appendString += truncate(item.content);
      }

      appendString += "</li>";
    }
  }

  return appendString;
}

var searchTerm = getQuery();

if (!searchTerm) {
  return;
}

document.querySelector("#site-search [name='query']")
  .setAttribute("value", searchTerm);

var idx = lunr(function () {
  this.field("id");
  this.field("title", { boost: 10 });
  this.field("content");
  this.metadataWhitelist = ["position"];

  for (var key in window.store) { // Add the data to lunr
    this.add({
      "id": key,
      "title": window.store[key].title,
      "content": window.store[key].content
    });
  }
});

var results = idx.search(searchTerm);
document.getElementById("search-results").innerHTML =
  displaySearchResults(results, window.store);
}());
