import type { ReactNode } from "react";

/**
 * A small syntax highlighter for the TSX and shell snippets in these docs.
 * It builds React nodes, never HTML strings, so snippet text cannot inject markup.
 */
const KEYWORDS =
  /^(?:import|export|from|default|const|let|var|function|return|if|else|async|await|new|type|interface|extends|as|typeof|true|false|null|undefined|for|of|in|throw|try|catch|finally|void)$/;

const TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Z][\w.]*|<\/?[a-z][\w-]*(?=[\s>/]))|(\b\d[\d_.]*\b)|(\b[A-Za-z_$][\w$]*\b)/g;

export function highlight(code: string, lang: string): ReactNode[] {
  if (lang === "bash" || lang === "sh") {
    return code.split("\n").map((line, i) => (
      <span key={i}>
        {line.startsWith("#") ? <span className="tok-c">{line}</span> : line}
        {"\n"}
      </span>
    ));
  }
  if (lang === "css") return [code];

  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) out.push(code.slice(last, index));
    const [text, comment, string, tag, number, word] = match;
    if (comment)
      out.push(
        <span key={key++} className="tok-c">
          {text}
        </span>,
      );
    else if (string)
      out.push(
        <span key={key++} className="tok-s">
          {text}
        </span>,
      );
    else if (tag)
      out.push(
        <span key={key++} className="tok-t">
          {text}
        </span>,
      );
    else if (number)
      out.push(
        <span key={key++} className="tok-n">
          {text}
        </span>,
      );
    else if (word && KEYWORDS.test(word))
      out.push(
        <span key={key++} className="tok-k">
          {text}
        </span>,
      );
    else out.push(text);
    last = index + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}
