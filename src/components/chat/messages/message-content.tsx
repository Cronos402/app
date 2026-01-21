'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageContentProps {
  content: string;
  role: string;
  serverId: string;
  conversationId: string;
}

export function MessageContent({ content, role }: MessageContentProps) {
  // For user messages, just render plain text
  if (role === 'user') {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  // For assistant messages, render markdown
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom code block rendering
          code(props) {
            const { node, className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !language;

            return !isInline ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
          // Ensure links open in new tab
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
