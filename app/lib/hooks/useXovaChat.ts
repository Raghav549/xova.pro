import { useCallback, useEffect, useRef, useState } from 'react';
import { ArtifactStreamScanner } from '~/lib/engine/scanner';
import { chunkText, generateProject, planNarrative } from '~/lib/engine/generator';
import { buildPreviewFromFiles } from '~/lib/engine/preview';
import type { PlanOptions } from '~/lib/engine/blueprint';
import { StreamingMessageParser } from '~/lib/runtime/message-parser';
import {
  applyBlueprint,
  appendStreamFile,
  failBuild,
  finishBuild,
  finishStreamFile,
  logStudio,
  setPhase,
  setPreview,
  startBuild,
  startStreamFile,
  studioSettings,
  studioStore,
  upsertStudioFile,
} from '~/lib/stores/studio';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useXovaChat');

export interface XovaChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  engine?: string;
  streaming?: boolean;
  createdAt: number;
}

export interface XovaSendOptions {
  archetype?: PlanOptions['archetype'];
  themeId?: string;
  fileModifications?: string;
}

function messageId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useXovaChat(initialMessages: XovaChatMessage[] = []) {
  const [messages, setMessages] = useState<XovaChatMessage[]>(initialMessages);
  const [parsed, setParsed] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineLabel, setEngineLabel] = useState<string>('Xova Build Engine');

  const abortRef = useRef<AbortController | null>(null);
  const scannerRef = useRef(new ArtifactStreamScanner());
  const bufferRef = useRef(new Map<string, string>());

  const parserRef = useRef<StreamingMessageParser | null>(null);

  if (!parserRef.current) {
    parserRef.current = new StreamingMessageParser({
      callbacks: {
        onArtifactOpen: (data) => {
          workbenchStore.showWorkbench.set(true);
          workbenchStore.addArtifact(data);
        },
        onArtifactClose: (data) => {
          workbenchStore.updateArtifact(data, { closed: true });
        },
        onActionOpen: (data) => {
          if (data.action.type !== 'shell') {
            workbenchStore.addAction(data);
          }

          startStreamFile(String(data.action.type === 'file' ? data.action.filePath : 'shell'));
        },
        onActionClose: (data) => {
          if (data.action.type === 'shell') {
            workbenchStore.addAction(data);
          }

          workbenchStore.runAction(data);
        },
      },
    });
  }

  const applyChunk = useCallback((id: string, chunk: string) => {
    const parser = parserRef.current as StreamingMessageParser;

    /**
     * `StreamingMessageParser` is incremental per message: it expects the full
     * accumulated text on every call and returns only the newly rendered slice.
     */
    const accumulated = (bufferRef.current.get(id) ?? '') + chunk;

    bufferRef.current.set(id, accumulated);

    const rendered = parser.parse(id, accumulated);

    setParsed((previous) => ({
      ...previous,
      [id]: (previous[id] ?? '') + rendered,
    }));

    const scanner = scannerRef.current;

    for (const event of scanner.push(chunk)) {
      switch (event.type) {
        case 'artifact-open': {
          setPhase('generating', Math.max(studioStore.get().progress, 22));
          break;
        }
        case 'action-open': {
          if (event.kind === 'file') {
            startStreamFile(event.path.replace(/^\/home\/project\//, ''));
          } else {
            logStudio('shell', 'Queueing shell command');
          }

          break;
        }
        case 'action-chunk': {
          if (event.kind === 'file') {
            appendStreamFile(event.path.replace(/^\/home\/project\//, ''), event.content);
          }

          break;
        }
        case 'action-close': {
          if (event.kind === 'file') {
            upsertStudioFile(event.path, event.content);
            finishStreamFile(event.path.replace(/^\/home\/project\//, ''), event.content);
          } else {
            logStudio('shell', event.content.trim().split('\n')[0] ?? '');
          }

          break;
        }
        default: {
          break;
        }
      }
    }
  }, []);

  const finish = useCallback(() => {
    setIsLoading(false);

    if (!studioStore.get().blueprint && studioStore.get().files.length > 0) {
      const { html, entry } = buildPreviewFromFiles(studioStore.get().files);

      setPreview(html);
      logStudio('ok', `Static preview engine compiled ${entry} for instant preview`);
    }

    finishBuild();

    setMessages((previous) =>
      previous.map((message) => (message.streaming ? { ...message, streaming: false } : message)),
    );
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setMessages((previous) =>
      previous.map((message) => (message.streaming ? { ...message, streaming: false } : message)),
    );
    logStudio('error', 'Build cancelled by user');
  }, []);

  const runLocalEngine = useCallback(
    async (prompt: string, assistantId: string, options: XovaSendOptions, signal: AbortSignal) => {
      const settings = studioSettings.get();
      const plan: PlanOptions = {
        platforms: settings.platforms,
        archetype: options.archetype,
        motion3d: settings.motion3d,
        backend: settings.backend,
        themeId: options.themeId,
      };

      const result = generateProject(prompt, plan);
      applyBlueprint(result.blueprint, result.previewDoc, result.files, result.stats);

      const text = `${planNarrative(result.blueprint)}\n\n${result.artifactText}`;
      const chunkSize = Math.max(56, Math.ceil(text.length / 620));
      const chunks = chunkText(text, chunkSize);
      const interval = Math.min(26, Math.max(8, Math.round(9000 / chunks.length)));

      for (let index = 0; index < chunks.length; index++) {
        if (signal.aborted) {
          return;
        }

        applyChunk(assistantId, chunks[index]);

        const progress = 24 + Math.round(((index + 1) / chunks.length) * 70);

        if (index % 12 === 0) {
          setPhase('generating', Math.min(94, progress));
        }

        if (index % 24 === 0 || interval > 12) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
    },
    [applyChunk],
  );

  const runProvider = useCallback(
    async (
      prompt: string,
      assistantId: string,
      history: XovaChatMessage[],
      options: XovaSendOptions,
      signal: AbortSignal,
    ) => {
      const settings = studioSettings.get();

      const response = await fetch('/api/chat', {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((message) => ({ role: message.role, content: message.content })),
          options: {
            platforms: settings.platforms,
            archetype: options.archetype,
            motion3d: settings.motion3d,
            backend: settings.backend,
            theme: options.themeId,
            provider: settings.provider,
            model: settings.model || undefined,
            key: settings.apiKey || undefined,
            baseURL: settings.baseURL || undefined,
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Provider responded with ${response.status}`);
      }

      const engine = response.headers.get('x-xova-engine') ?? settings.provider;
      const model = response.headers.get('x-xova-model');
      const label = response.headers.get('x-xova-engine-label');

      setEngineLabel(label ? `${label}${model ? ` · ${model}` : ''}` : engine);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        applyChunk(assistantId, text);
      }

      if (buffer.length === 0) {
        throw new Error('Empty response from provider');
      }
    },
    [applyChunk],
  );

  const send = useCallback(
    async (prompt: string, options: XovaSendOptions = {}) => {
      const trimmed = prompt.trim();

      if (trimmed.length === 0 || isLoading) {
        return;
      }

      const userMessage: XovaChatMessage = {
        id: messageId('user'),
        role: 'user',
        content: options.fileModifications ? `${options.fileModifications}\n\n${trimmed}` : trimmed,
        createdAt: Date.now(),
      };

      const assistantMessage: XovaChatMessage = {
        id: messageId('assistant'),
        role: 'assistant',
        content: '',
        streaming: true,
        createdAt: Date.now(),
      };

      const history = [...messages, userMessage];

      setMessages([...history, assistantMessage]);
      setIsLoading(true);
      setError(null);
      scannerRef.current.reset();

      const controller = new AbortController();
      abortRef.current = controller;

      const settings = studioSettings.get();
      const useLocal = settings.provider === 'local' || settings.apiKey.trim().length === 0;

      startBuild(trimmed, useLocal ? 'xova-build-engine' : settings.provider);

      try {
        if (useLocal) {
          setEngineLabel('Xova Build Engine');
          await runLocalEngine(trimmed, assistantMessage.id, options, controller.signal);
        } else {
          await runProvider(trimmed, assistantMessage.id, history, options, controller.signal);
        }
      } catch (cause) {
        if (controller.signal.aborted) {
          stop();

          return;
        }

        const message = (cause as Error).message;
        logger.error('Build failed', cause);
        logStudio('error', `Provider failed: ${message}. Falling back to the Xova Build Engine.`);

        try {
          setEngineLabel('Xova Build Engine (fallback)');
          await runLocalEngine(trimmed, assistantMessage.id, options, controller.signal);
        } catch (fallbackError) {
          setError((fallbackError as Error).message);
          failBuild((fallbackError as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) {
          finish();
        }
      }
    },
    [finish, isLoading, messages, runLocalEngine, runProvider, stop],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    scannerRef.current.reset();
    bufferRef.current.clear();
    parserRef.current?.reset();
    setMessages([]);
    setParsed({});
  }, []);

  return {
    messages,
    parsed,
    isLoading,
    error,
    engineLabel,
    send,
    stop,
    reset,
    setMessages,
    setParsed,
  };
}
