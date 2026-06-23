import { useState, useCallback, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'

const COLORS = {
 keyword: '#c678dd',
 builtin: '#e5c07b',
 string: '#98c379',
 number: '#d19a66',
 comment: '#5c6370',
 annotation: '#61afef',
 plain: '#abb2bf',
};

const KEYWORDS = {
 javascript: 'async await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield',
 typescript: 'async await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield type interface implements enum declare namespace module public private protected readonly abstract as any boolean never null number string symbol undefined unknown',
 python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield',
 java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while',
 cpp: 'auto bool break case catch char class const constexpr continue decltype default delete do double else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not nullptr operator or private protected public register reinterpret_cast return short signed sizeof static static_cast struct switch template this throw true try typedef typeid typename union unsigned using virtual void volatile while',
 go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var',
 rust: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while',
};

function getTokenizer(lang) {
 const keywords = new Set((KEYWORDS[lang] || '').split(' '));
 const commentChar = lang === 'python' ? '#' : '//';

 return function tokenize(line) {
 const tokens = [];
 let i = 0;

 while (i < line.length) {
 // Skip whitespace
 if (/\s/.test(line[i])) {
 let j = i;
 while (j < line.length && /\s/.test(line[j])) j++;
 tokens.push({ t: 'plain', v: line.slice(i, j) });
 i = j;
 continue;
 }

 // Comment
 if ((line[i] === '/' && line[i+1] === '/') || (commentChar === '#' && line[i] === '#')) {
 tokens.push({ t: 'comment', v: line.slice(i) });
 break;
 }
 if (line[i] === '/' && line[i+1] === '*') {
 const end = line.indexOf('*/', i+2);
 tokens.push({ t: 'comment', v: line.slice(i, end !== -1 ? end + 2 : line.length) });
 break;
 }

 // String
 if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
 const q = line[i];
 let j = i + 1;
 while (j < line.length) {
 if (line[j] === '\\') j++;
 else if (line[j] === q) { j++; break; }
 j++;
 }
 tokens.push({ t: 'string', v: line.slice(i, j) });
 i = j;
 continue;
 }

 // Number
 if (/[0-9]/.test(line[i]) && (i === 0 || /[\s,=(\+\-\*\/\[\]<>:;!|&?]/.test(line[i-1]))) {
 let j = i;
 while (j < line.length && /[0-9.xXa-fA-F]/.test(line[j])) j++;
 tokens.push({ t: 'number', v: line.slice(i, j) });
 i = j;
 continue;
 }

 // Word
 if (/[a-zA-Z_$]/.test(line[i])) {
 let j = i;
 while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
 const word = line.slice(i, j);
 tokens.push({ t: keywords.has(word) ? 'keyword' : 'plain', v: word });
 i = j;
 continue;
 }

 // Annotation
 if (line[i] === '@') {
 let j = i + 1;
 while (j < line.length && /[a-zA-Z0-9_.]/.test(line[j])) j++;
 tokens.push({ t: 'annotation', v: line.slice(i, j) });
 i = j;
 continue;
 }

 // Other char
 tokens.push({ t: 'plain', v: line[i] });
 i++;
 }
 return tokens;
 };
}

export default function SyntaxHighlight({ code, language = 'javascript' }) {
 const tokenize = useMemo(() => getTokenizer(language), [language]);
 const [copied, setCopied] = useState(false);

 if (!code) return null;
 const lines = code.split('\n');

 const handleCopy = useCallback(() => {
 navigator.clipboard.writeText(code).then(() => {
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }).catch(() => {});
 }, [code]);

 return (
 <div className="relative group">
 <button
 onClick={handleCopy}
 className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-bg-elevated/80 hover:bg-bg-overlay text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
 title={copied ? 'Copied!' : 'Copy code'}
 >
 {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 <pre className="bg-bg-elevated border border-border-default rounded-xl overflow-x-auto text-xs leading-relaxed font-mono">
 <code>
 {lines.map((line, li) => (
 <div key={li} className="flex hover:bg-bg-hover">
 <span className="flex-shrink-0 w-8 text-right pr-3 text-text-muted select-none text-[11px]">{li + 1}</span>
 <span className="flex-1">
 {tokenize(line).map((tok, ti) => (
 <span key={ti} style={{ color: COLORS[tok.t] || COLORS.plain }}>{tok.v}</span>
 ))}
 </span>
 </div>
 ))}
 </code>
 </pre>
 </div>
 );
}
