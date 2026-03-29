import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Link from "next/link";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  a: ({ href, children }) => {
    if (!href) return <span>{children}</span>;
    if (href.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-primary underline underline-offset-2 hover:text-primary/90"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="text-primary underline underline-offset-2 hover:text-primary/90"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 w-full overflow-x-auto rounded-md border">
      <table className="w-full min-w-[32rem] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b px-3 py-2 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
  code: ({ className, children, ...props }) => {
    const inline = !className;
    if (inline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h1 className="mb-4 mt-2 text-2xl font-bold tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 text-xl font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-lg font-medium">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-8 border-border" />,
};

export function HelpMarkdown({ content }: { content: string }) {
  return (
    <div className="help-markdown max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
