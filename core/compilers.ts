import { AssertionContext } from "./assertion";
import { OperationContext } from "./operation";
import { TableContext } from "./table";
import * as utils from "./utils";

import * as moo from "moo";

const lexer = moo.states({
  sql: {
    sql_start_config: { match: "config {", push: "config_block" },
    sql_start_js: { match: "js {", push: "js_block" },
    sql_single_line_comment: /\/\/.*?$/,
    sql_multi_line_comment: /\/\*[\s\S]*?\*\//,
    sql_single_quote_string: /'(?:\\['\\]|[^\n'\\])*'/,
    sql_double_quote_string: /"(?:\\["\\]|[^\n"\\])*"/,
    sql_start_new_block: { match: "${", push: "js_block" },
    sql_everything_else: { match: /[\s\S]+?/, lineBreaks: true }
  },
  // this is currently intended to *only* support JSON, but could be changed for another config language.
  config_block: {
    config_block_double_quote_string: /"(?:\\["\\]|[^\n"\\])*"/,
    config_block_start_new_block: { match: "{", push: "config_block" },
    config_block_stop_block: { match: "}", pop: 1 },
    config_block_everything_else: { match: /[\s\S]+?/, lineBreaks: true }
  },
  js_block: {
    js_block_single_line_comment: /\/\/.*?$/,
    js_block_multi_line_comment: /\/\*[\s\S]*?\*\//,
    js_block_single_quote_string: /'(?:\\['\\]|[^\n'\\])*'/,
    js_block_double_quote_string: /"(?:\\["\\]|[^\n"\\])*"/,
    js_block_start_js_template_string: { match: "`", push: "js_template_string" },
    js_block_start_new_block: { match: "{", push: "js_block" },
    js_block_stop_block: { match: "}", pop: 1 },
    js_block_everything_else: { match: /[\s\S]+?/, lineBreaks: true }
  },
  js_template_string: {
    js_template_string_escaped_backslash: /\\\\/,
    js_template_string_escaped_backtick: /\\`/,
    js_template_string_escaped_dollarbrace: /\\\${`/,
    js_template_string_start_new_block: { match: "${", push: "js_block" },
    js_template_string_stop_string: { match: "`", pop: 1 },
    js_template_string_everything_else: { match: /[\s\S]+?/, lineBreaks: true }
  }
});

export function compile(code: string, path: string) {
  if (path.endsWith(".sql")) {
    // if (path.endsWith(".ben.sql")) {
    let sql = "";
    let config = "";
    let js = "";
    let state: "sql" | "js" | "config" = "sql";
    lexer.reset(code);
    for (const token of lexer) {
      switch (token.type) {
        case "sql_start_config": {
          state = "config";
          break;
        }
        case "sql_start_js": {
          state = "js";
          break;
        }
        case "sql_single_line_comment":
        case "sql_multi_line_comment":
        case "sql_single_quote_string":
        case "sql_double_quote_string":
        case "sql_start_new_block":
        case "sql_everything_else": {
          state = "sql";
          break;
        }
      }
      switch (state) {
        case "sql": {
          sql = sql + token.text;
          break;
        }
        case "js": {
          js = js + token.text;
          break;
        }
        case "config": {
          config = config + token.text;
          break;
        }
      }
    }
    console.log("\n\n\n");
    console.log("CONFIG FOLLOWS");
    console.log(config);
    console.log("\n\n\n");
    console.log("JS FOLLOWS");
    console.log(js);
    console.log("\n\n\n");
    console.log("SQL FOLLOWS");
    console.log(sql);
    console.log("\n\n\n");
    return;
  }
  if (path.endsWith(".assert.sql")) {
    return compileAssertionSql(code, path);
  }
  if (path.endsWith(".ops.sql")) {
    return compileOperationSql(code, path);
  }
  if (path.endsWith(".sql")) {
    return compileTableSql(code, path);
  }
  return code;
}

export function compileTableSql(code: string, path: string) {
  const { sql, js } = extractJsBlocks(code);
  const functionsBindings = getFunctionPropertyNames(TableContext.prototype).map(
    name => `const ${name} = !!ctx.${name} ? ctx.${name}.bind(ctx) : () => "";`
  );

  return `
  const publish = global.publish || global.materialize;
  publish("${utils.baseFilename(path)}").query(ctx => {
    ${functionsBindings.join("\n")}
    ${js}
    return \`${sql}\`;
  })`;
}

export function compileOperationSql(code: string, path: string) {
  const { sql, js } = extractJsBlocks(code);
  const functionsBindings = getFunctionPropertyNames(OperationContext.prototype).map(
    name => `const ${name} = !!ctx.${name} ? ctx.${name}.bind(ctx) : () => "";`
  );

  return `
  operate("${utils.baseFilename(path)}").queries(ctx => {
    ${functionsBindings.join("\n")}
    ${js}
    return \`${sql}\`.split("\\n---\\n");
  })`;
}

export function compileAssertionSql(code: string, path: string) {
  const { sql, js } = extractJsBlocks(code);
  const functionsBindings = getFunctionPropertyNames(AssertionContext.prototype).map(
    name => `const ${name} = !!ctx.${name} ? ctx.${name}.bind(ctx) : () => "";`
  );

  return `
  assert("${utils.baseFilename(path)}").query(ctx => {
    ${functionsBindings.join("\n")}
    ${js}
    return \`${sql}\`;
  })`;
}

export function extractJsBlocks(code: string): { sql: string; js: string } {
  const JS_REGEX = /^\s*\/\*[jJ][sS]\s*[\r\n]+((?:[^*]|[\r\n]|(?:\*+(?:[^*/]|[\r\n])))*)\*+\/|^\s*\-\-[jJ][sS]\s(.*)/gm;
  // This captures any single backticks that aren't escaped with a preceding \.
  const RAW_BACKTICKS_REGEX = /([^\\])`/g;
  const jsBlocks: string[] = [];
  const cleanSql = code
    .replace(JS_REGEX, (_, group1, group2) => {
      if (group1) {
        jsBlocks.push(group1);
      }
      if (group2) {
        jsBlocks.push(group2);
      }
      return "";
    })
    .replace(RAW_BACKTICKS_REGEX, (_, group1) => group1 + "\\`");

  return {
    sql: cleanSql.trim(),
    js: jsBlocks.map(block => block.trim()).join("\n")
  };
}

export function getFunctionPropertyNames(prototype: any) {
  return Object.getOwnPropertyNames(prototype).filter(function(e, i, arr) {
    if (e != arr[i + 1] && typeof prototype[e] == "function") {
      return true;
    }
  });
}
