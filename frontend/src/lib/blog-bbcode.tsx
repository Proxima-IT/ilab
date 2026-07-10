import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /\[(b|i|u)\](.*?)\[\/\1\]|\[link=([^\]]+)\](.*?)\[\/link\]/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;
    const tag = match[1]?.toLowerCase();
    const content = match[2];
    const url = match[3];
    const label = match[4];

    if (tag === "b") {
      nodes.push(<strong key={key}>{content}</strong>);
    } else if (tag === "i") {
      nodes.push(<em key={key}>{content}</em>);
    } else if (tag === "u") {
      nodes.push(<span key={key} className="underline underline-offset-4">{content}</span>);
    } else if (url && label) {
      nodes.push(
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary-dark underline underline-offset-4 hover:text-accent"
        >
          {label}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function tagContent(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`^\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]$`, "i"));
  return match?.[1]?.trim() || null;
}

function listItems(content: string): string[] {
  const matches = [...content.matchAll(/\[li\]([\s\S]*?)\[\/li\]/gi)].map((match) => match[1].trim());

  if (matches.length > 0) {
    return matches;
  }

  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function renderTable(content: string, key: string) {
  const rows = [...content.matchAll(/\[tr\]([\s\S]*?)\[\/tr\]/gi)].map((row) => row[1]);

  return (
    <div key={key} className="my-8 overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => {
            const headers = [...row.matchAll(/\[th\]([\s\S]*?)\[\/th\]/gi)].map((cell) => cell[1].trim());
            const cells = [...row.matchAll(/\[td\]([\s\S]*?)\[\/td\]/gi)].map((cell) => cell[1].trim());
            const values = headers.length > 0 ? headers : cells;
            const CellTag = headers.length > 0 ? "th" : "td";

            return (
              <tr key={`${key}-row-${rowIndex}`} className={headers.length > 0 ? "bg-surface" : "bg-background"}>
                {values.map((value, cellIndex) => (
                  <CellTag
                    key={`${key}-cell-${cellIndex}`}
                    className={`px-4 py-3 align-top ${headers.length > 0 ? "font-bold text-foreground" : "text-foreground/85"}`}
                  >
                    {renderInline(value, `${key}-cell-${cellIndex}`)}
                  </CellTag>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function renderBlogContent(content: string[] | string): ReactNode[] {
  const blocks = Array.isArray(content)
    ? content
    : content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return blocks.map((block, index) => {
    const key = `blog-block-${index}`;
    const h1 = tagContent(block, "h1");
    const h2 = tagContent(block, "h2");
    const h3 = tagContent(block, "h3");
    const big = tagContent(block, "big");
    const quote = tagContent(block, "quote");
    const ul = tagContent(block, "ul");
    const ol = tagContent(block, "ol");
    const table = tagContent(block, "table");

    if (h1) {
      return <h2 key={key} className="mt-10 text-3xl font-extrabold leading-tight text-foreground">{renderInline(h1, key)}</h2>;
    }

    if (h2) {
      return <h3 key={key} className="mt-8 text-2xl font-bold leading-tight text-foreground">{renderInline(h2, key)}</h3>;
    }

    if (h3) {
      return <h4 key={key} className="mt-7 text-xl font-bold leading-tight text-foreground">{renderInline(h3, key)}</h4>;
    }

    if (big) {
      return <p key={key} className="text-xl font-semibold leading-relaxed text-foreground">{renderInline(big, key)}</p>;
    }

    if (quote) {
      return (
        <blockquote key={key} className="my-8 border-l-4 border-primary bg-primary/5 px-5 py-4 text-lg font-medium leading-relaxed text-foreground">
          {renderInline(quote, key)}
        </blockquote>
      );
    }

    if (ul) {
      return (
        <ul key={key} className="my-6 list-disc space-y-2 pl-6 text-lg leading-relaxed text-foreground/90">
          {listItems(ul).map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
    }

    if (ol) {
      return (
        <ol key={key} className="my-6 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-foreground/90">
          {listItems(ol).map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ol>
      );
    }

    if (table) {
      return renderTable(table, key);
    }

    return (
      <p key={key} className="text-lg leading-relaxed text-foreground/90">
        {renderInline(block, key)}
      </p>
    );
  });
}

