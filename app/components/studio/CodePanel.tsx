import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { setPreview, studioStore, upsertStudioFile } from '~/lib/stores/studio';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { detectLanguage, tokenClassName, tokenizeLine } from '~/utils/highlight';

interface TreeEntry {
  type: 'folder' | 'file';
  name: string;
  path: string;
  depth: number;
}

function buildTree(paths: string[]): TreeEntry[] {
  const folders = new Set<string>();

  for (const path of paths) {
    const segments = path.split('/');

    for (let index = 1; index < segments.length; index++) {
      folders.add(segments.slice(0, index).join('/'));
    }
  }

  const entries: TreeEntry[] = [];

  const walk = (prefix: string, depth: number) => {
    const childFolders = Array.from(folders)
      .filter((folder) => folder.startsWith(prefix) && !folder.slice(prefix.length).replace(/^\//, '').includes('/'))
      .filter((folder) => folder !== prefix)
      .sort();

    for (const folder of childFolders) {
      entries.push({ type: 'folder', name: folder.split('/').pop() ?? folder, path: folder, depth });
      walk(`${folder}/`, depth + 1);
    }

    const files = paths.filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/')).sort();

    for (const file of files) {
      entries.push({ type: 'file', name: file.split('/').pop() ?? file, path: file, depth });
    }
  };

  walk('', 0);

  return entries;
}

const ICON_BY_EXTENSION: Record<string, string> = {
  ts: 'i-ph:file-ts',
  tsx: 'i-ph:file-tsx',
  js: 'i-ph:file-js',
  jsx: 'i-ph:file-jsx',
  html: 'i-ph:file-html',
  css: 'i-ph:file-css',
  scss: 'i-ph:file-css',
  json: 'i-ph:brackets-curly',
  md: 'i-ph:file-md',
  xml: 'i-ph:file-code',
  yml: 'i-ph:file-code',
  yaml: 'i-ph:file-code',
  svg: 'i-ph:image',
  webmanifest: 'i-ph:brackets-curly',
  gradle: 'i-ph:file-code',
  example: 'i-ph:file-text',
};

function iconFor(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return ICON_BY_EXTENSION[extension] ?? 'i-ph:file';
}

export const CodePanel = memo(() => {
  const state = useStore(studioStore);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const files = state.files;
  const tree = useMemo(() => buildTree(files.map((file) => file.path)), [files]);
  const visibleTree = useMemo(
    () =>
      tree.filter((entry) => {
        if (query.length > 1) {
          return entry.path.toLowerCase().includes(query.toLowerCase());
        }

        for (const folder of collapsed) {
          if (entry.path.startsWith(`${folder}/`)) {
            return false;
          }
        }

        return true;
      }),
    [collapsed, query, tree],
  );

  const file = useMemo(() => files.find((candidate) => candidate.path === selected) ?? null, [files, selected]);

  useEffect(() => {
    if (!selected && files.length > 0) {
      const preferred =
        files.find((candidate) => candidate.path === 'preview.html') ??
        files.find((candidate) => candidate.path === 'src/App.tsx') ??
        files[0];

      setSelected(preferred.path);
    }
  }, [files, selected]);

  useEffect(() => {
    if (editing && file) {
      setDraft(file.content);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [editing, file]);

  const save = () => {
    if (!file) {
      return;
    }

    upsertStudioFile(file.path, draft);

    if (file.path.endsWith('preview.html')) {
      setPreview(draft);
      toast.success('preview.html recompiled');
    } else if (file.path.endsWith('styles.css') || file.path.endsWith('style.css')) {
      const doc = studioStore.get().previewDoc;

      if (doc) {
        const updated = doc.replace(/(<style id="xv-styles">)[\s\S]*?(<\/style>)/, `$1\n${draft}\n$2`);
        setPreview(updated);
        toast.success('Design tokens re-applied to the live preview');
      }
    } else {
      toast.success(`${file.path} saved`);
    }

    setEditing(false);
  };

  const download = () => {
    if (!file) {
      return;
    }

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = file.path.split('/').pop() ?? 'file.txt';
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const lines = file ? file.content.split('\n') : [];
  const language = file ? detectLanguage(file.path) : 'plain';

  return (
    <div className="xv-code-grid gap-0 h-full min-h-0 rounded-xl border border-xova-elements-borderColor overflow-hidden">
      <div className="flex flex-col min-h-0 border-r border-xova-elements-borderColor bg-xova-elements-bg-depth-2">
        <div className="p-3 border-b border-xova-elements-borderColor">
          <input
            className="field"
            placeholder="Search files…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="text-[11px] text-xova-elements-textTertiary mt-2">
            {files.length} files · {state.stats ? `${(state.stats.bytes / 1024).toFixed(1)} KB` : '0 KB'}
          </p>
        </div>

        <div className="flex-1 overflow-auto xv-scroll py-2">
          {visibleTree.length === 0 && (
            <p className="px-4 text-xs text-xova-elements-textTertiary">
              No files yet — send a prompt to generate the project.
            </p>
          )}
          {visibleTree.map((entry) => {
            const isFolder = entry.type === 'folder';
            const isOpen = !collapsed.has(entry.path);

            return (
              <button
                key={`${entry.type}-${entry.path}`}
                type="button"
                onClick={() => {
                  if (isFolder) {
                    const next = new Set(collapsed);

                    if (next.has(entry.path)) {
                      next.delete(entry.path);
                    } else {
                      next.add(entry.path);
                    }

                    setCollapsed(next);
                  } else {
                    setSelected(entry.path);
                    setEditing(false);
                  }
                }}
                className={classNames(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-theme',
                  entry.path === selected
                    ? 'bg-xova-elements-item-backgroundAccent text-xova-elements-textPrimary'
                    : 'text-xova-elements-textSecondary hover:bg-xova-elements-item-backgroundActive',
                )}
                style={{ paddingLeft: 12 + entry.depth * 12 }}
              >
                <span
                  className={classNames(
                    isFolder ? (isOpen ? 'i-ph:folder-open' : 'i-ph:folder') : iconFor(entry.path),
                    'text-sm shrink-0',
                  )}
                />
                <span className="truncate">{entry.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col min-h-0 bg-xova-elements-bg-depth-1">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-xova-elements-borderColor">
          <span className="mono-text truncate text-xova-elements-textSecondary">{file?.path ?? 'select a file'}</span>
          <span className="chip ml-auto hidden sm:inline-flex">{language}</span>
          <button type="button" className="btn-ghost text-xs" onClick={download} disabled={!file}>
            <span className="i-ph:download-simple" /> Download
          </button>
          <button
            type="button"
            className={classNames('text-xs', editing ? 'btn-secondary' : 'btn-secondary')}
            disabled={!file}
            onClick={() => (editing ? save() : setEditing(true))}
          >
            <span className={editing ? 'i-ph:floppy-disk' : 'i-ph:pencil-simple'} />
            {editing ? 'Save & apply' : 'Edit'}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto xv-scroll xv-code-body xv-code-text">
          {!file && <p className="p-4 text-xova-elements-textTertiary">Nothing selected.</p>}

          {file && editing && (
            <textarea
              ref={textareaRef}
              value={draft}
              spellCheck={false}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full h-full min-h-[60vh] bg-transparent outline-none border-0 p-3 xv-code-text resize-none"
            />
          )}

          {file &&
            !editing &&
            lines.map((line, index) => (
              <motion.div
                key={index}
                initial={index < 40 ? { opacity: 0, x: -6 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: cubicEasingFn, delay: Math.min(index, 20) * 0.01 }}
                className="xv-code-line"
              >
                <span className="no">{index + 1}</span>
                <span className="src">
                  {tokenizeLine(line).map((token, tokenIndex) => (
                    <span key={tokenIndex} className={tokenClassName(token.type)}>
                      {token.value}
                    </span>
                  ))}
                </span>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
});
