export type ScanEvent =
  | { type: 'artifact-open'; id: string; title: string }
  | { type: 'artifact-close' }
  | { type: 'action-open'; kind: 'file' | 'shell'; path: string }
  | { type: 'action-chunk'; kind: 'file' | 'shell'; path: string; content: string }
  | { type: 'action-close'; kind: 'file' | 'shell'; path: string; content: string };

interface OpenAction {
  kind: 'file' | 'shell';
  path: string;
  contentStart: number;
}

/**
 * Incremental scanner for Xova artifact markup.
 *
 * Unlike `StreamingMessageParser` (which emits only open/close callbacks), this
 * scanner emits the *partial* content of the action that is currently streaming,
 * which is what the studio needs to render live code as it is written.
 */
export class ArtifactStreamScanner {
  #buffer = '';
  #cursor = 0;
  #artifact: { id: string; title: string } | null = null;
  #openAction: OpenAction | null = null;

  push(chunk: string): ScanEvent[] {
    this.#buffer += chunk;

    const events: ScanEvent[] = [];

    while (this.#cursor < this.#buffer.length) {
      if (this.#openAction) {
        const closeIndex = this.#buffer.indexOf('</xovaAction>', this.#cursor);

        if (closeIndex === -1) {
          const content = this.#buffer.slice(this.#openAction.contentStart);
          events.push({
            type: 'action-chunk',
            kind: this.#openAction.kind,
            path: this.#openAction.path,
            content,
          });
          this.#cursor = this.#buffer.length;
          break;
        }

        const content = this.#buffer.slice(this.#openAction.contentStart, closeIndex);
        events.push({ type: 'action-close', kind: this.#openAction.kind, path: this.#openAction.path, content });

        this.#cursor = closeIndex + '</xovaAction>'.length;
        this.#openAction = null;
        continue;
      }

      const actionIndex = this.#buffer.indexOf('<xovaAction', this.#cursor);

      if (actionIndex === -1) {
        this.#cursor = Math.min(this.#buffer.length, this.#cursor);
        break;
      }

      const tagEnd = this.#buffer.indexOf('>', actionIndex);

      if (tagEnd === -1) {
        // tag not fully received yet — wait for more data
        this.#cursor = actionIndex;
        break;
      }

      const tag = this.#buffer.slice(actionIndex, tagEnd + 1);
      const kind = /type="shell"/.test(tag) ? 'shell' : 'file';
      const pathMatch = /filePath="([^"]*)"/.exec(tag);
      const path = pathMatch ? pathMatch[1] : 'shell';

      this.#openAction = { kind, path, contentStart: tagEnd + 1 };
      events.push({ type: 'action-open', kind, path });
      this.#cursor = tagEnd + 1;
    }

    return events;
  }

  artifactOpen(): { id: string; title: string } | null {
    if (this.#artifact) {
      return this.#artifact;
    }

    const match = /<xovaArtifact([^>]*)>/.exec(this.#buffer);

    if (!match) {
      return null;
    }

    const id = /id="([^"]*)"/.exec(match[1])?.[1] ?? 'xova-artifact';
    const title = /title="([^"]*)"/.exec(match[1])?.[1] ?? 'Project';

    this.#artifact = { id, title };

    return this.#artifact;
  }

  hasArtifact(): boolean {
    return /<xovaArtifact/.test(this.#buffer);
  }

  artifactClosed(): boolean {
    return /<\/xovaArtifact>/.test(this.#buffer);
  }

  reset() {
    this.#buffer = '';
    this.#cursor = 0;
    this.#artifact = null;
    this.#openAction = null;
  }

  get raw() {
    return this.#buffer;
  }
}
