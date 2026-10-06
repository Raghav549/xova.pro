import { useStore } from '@nanostores/react';
import { memo, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { EditorPanel } from '~/components/workbench/EditorPanel';
import { ensureRuntime, runtimeStore } from '~/lib/stores/runtime';
import { studioStore } from '~/lib/stores/studio';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

export const RuntimePanel = memo(() => {
  const runtime = useStore(runtimeStore);
  const state = useStore(studioStore);
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);

  useEffect(() => {
    void ensureRuntime();
  }, []);

  useEffect(() => {
    workbenchStore.setDocuments(files);
  }, [files]);

  const onEditorChange = useCallback<OnEditorChange>((update) => {
    workbenchStore.setCurrentDocumentContent(update.content);
  }, []);

  const onEditorScroll = useCallback<OnEditorScroll>((position) => {
    workbenchStore.setCurrentDocumentScrollPosition(position);
  }, []);

  const onFileSelect = useCallback((filePath: string | undefined) => {
    workbenchStore.setSelectedFile(filePath);
  }, []);

  const onFileSave = useCallback(() => {
    workbenchStore.saveCurrentDocument().catch(() => toast.error('Failed to update file content'));
  }, []);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  if (runtime.status !== 'ready') {
    return (
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div
          className={classNames(
            'panel p-4 flex flex-col gap-2',
            runtime.status === 'unavailable' ? 'border-amber-500/40' : 'border-xova-elements-borderColor',
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={classNames(
                'text-lg',
                runtime.status === 'booting' ? 'i-svg-spinners:90-ring-with-bg' : 'i-ph:info',
                runtime.status === 'unavailable' && 'text-amber-400',
              )}
            />
            <h3 className="text-base font-medium">
              {runtime.status === 'booting'
                ? 'Booting the in-browser Node runtime…'
                : 'In-browser runtime unavailable here'}
            </h3>
          </div>
          <p className="text-sm text-xova-elements-textSecondary">
            {runtime.reason ??
              'The runtime needs cross-origin isolation (COOP/COEP headers) and cannot start inside a sandboxed frame.'}
          </p>
          <p className="text-sm text-xova-elements-textSecondary">
            Everything else still works: generated files, the live preview panel, the code editor, the physics build
            output and ZIP export. Open this studio in its own tab (not embedded) to get terminals,{' '}
            <code className="kdb">npm install</code> and dev servers.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.open(window.location.href, '_blank', 'noopener')}
            >
              <span className="i-ph:arrow-square-out" /> Open studio in a new tab
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                runtimeStore.setKey('status', 'idle');
                void ensureRuntime();
              }}
            >
              <span className="i-ph:arrow-clockwise" /> Retry boot
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatusCard
            ok
            title="Static preview engine"
            body="Renders the generated HTML/CSS/JS with CDN imports resolved — no runtime required."
          />
          <StatusCard
            ok
            title="File system"
            body={`${state.files.length} files staged in the studio editor with live syntax highlighting.`}
          />
          <StatusCard
            ok={false}
            title="Node runtime"
            body="Terminals, npm install and Vite dev servers inside the browser (needs isolation mode)."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 -m-1">
      <EditorPanel
        editorDocument={currentDocument}
        isStreaming={state.phase === 'generating'}
        selectedFile={selectedFile}
        files={files}
        unsavedFiles={unsavedFiles}
        onFileSelect={onFileSelect}
        onEditorScroll={onEditorScroll}
        onEditorChange={onEditorChange}
        onFileSave={onFileSave}
        onFileReset={onFileReset}
      />
    </div>
  );
});

function StatusCard({ ok, title, body }: { ok: boolean; title: string; body: string }) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span
          className={classNames(
            ok ? 'i-ph:check-circle text-emerald-400' : 'i-ph:circle text-xova-elements-textTertiary',
          )}
        />
        {title}
      </div>
      <p className="text-xs text-xova-elements-textSecondary mt-1">{body}</p>
    </div>
  );
}
