/**
 * @param {string} text
 */
function lastLine(text) {
  const splitted = text.split("\n");
  return splitted[splitted.length - 1];
}

/**
 * @param {string} message error message
 * @param {"Syntax" | "Validation"} type error type
 */
function error(source, position, current, message, type) {
  /**
   * @param {number} count
   */
  function sliceTokens(count) {
    return count > 0 ?
      source.slice(position, position + count) :
      source.slice(Math.max(position + count, 0), position);
  }

  function tokensToText(inputs, { precedes } = {}) {
    const text = inputs.map(t => t.trivia + t.value).join("");
    const nextToken = source[position];
    if (nextToken.type === "eof") {
      return text;
    }
    if (precedes) {
      return text + nextToken.trivia;
    }
    return text.slice(nextToken.trivia.length);
  }

  const maxTokens = 5; // arbitrary but works well enough
  const line =
    source[position].type !== "eof" ? source[position].line :
    source.length > 1 ? source[position - 1].line :
    1;

  const precedingLine = lastLine(
    tokensToText(sliceTokens(-maxTokens), { precedes: true })
  );

  const subsequentTokens = sliceTokens(maxTokens);
  const subsequentText = tokensToText(subsequentTokens);
  const sobsequentLine = subsequentText.split("\n")[0];

  const spaced = " ".repeat(precedingLine.length) + "^ " + message;
  const contextualMessage = precedingLine + sobsequentLine + "\n" + spaced;

  const contextType = type === "Syntax" ? "since" : "inside";
  const grammaticalContext = current ? `, ${contextType} \`${current.partial ? "partial " : ""}${current.type} ${current.name}\`` : "";
  return {
    message: `${type} error at line ${line}${grammaticalContext}:\n${contextualMessage}`,
    line,
    input: subsequentText,
    tokens: subsequentTokens
  };
}

/**
 * @param {string} message error message
 */
export function syntaxError(source, position, current, message) {
  return error(source, position, current, message, "Syntax");
}

/**
 * @param {string} message error message
 */
export function validationError(source, token, current, message) {
  return error(source, token.index, current, message, "Validation").message;
}
