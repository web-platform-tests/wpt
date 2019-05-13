import { Base } from "./base.js";
import { const_data, const_value } from "./helpers.js";

export class Default extends Base {
  /**
   * @param {import("../tokeniser").Tokeniser} tokeniser
   */
  static parse(tokeniser) {
    const assign = tokeniser.consume("=");
    if (!assign) {
      return null;
    }
    const def = const_value(tokeniser) || tokeniser.consume("string", "null", "[") || tokeniser.error("No value for default");
    const expression = [def];
    if (def.type === "[") {
      const close = tokeniser.consume("]") || error("Default sequence value must be empty");
      expression.push(close);
    }
    return new Default({ source: tokeniser.source, tokens: { assign }, expression });
  }

  constructor({ source, tokens, expression }) {
    super({ source, tokens });
    Object.defineProperty(this, "expression", { value: expression });
  }

  get type() {
    return const_data(this.expression[0]).type;
  }
  get value() {
    return const_data(this.expression[0]).value;
  }
  get negative() {
    return const_data(this.expression[0]).negative;
  }
}
