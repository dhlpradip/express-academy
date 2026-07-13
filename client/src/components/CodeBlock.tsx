import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeBlockProps {
  code: string;
  title?: string;
  typescript?: boolean;
}

export default function CodeBlock({ code, title, typescript = false }: CodeBlockProps) {
  return (
    <div className="codeblock">
      {title && <div className="codeblock-title">{title}</div>}
      <CodeMirror
        value={code.trimEnd()}
        theme={oneDark}
        editable={false}
        extensions={[javascript({ typescript })]}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          highlightSelectionMatches: false,
          searchKeymap: false,
        }}
      />
    </div>
  );
}
