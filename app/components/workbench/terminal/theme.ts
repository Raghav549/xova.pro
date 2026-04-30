import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--xova-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--xova-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--xova-elements-terminal-textColor'),
    background: cssVar('--xova-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--xova-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--xova-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--xova-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--xova-elements-terminal-color-black'),
    red: cssVar('--xova-elements-terminal-color-red'),
    green: cssVar('--xova-elements-terminal-color-green'),
    yellow: cssVar('--xova-elements-terminal-color-yellow'),
    blue: cssVar('--xova-elements-terminal-color-blue'),
    magenta: cssVar('--xova-elements-terminal-color-magenta'),
    cyan: cssVar('--xova-elements-terminal-color-cyan'),
    white: cssVar('--xova-elements-terminal-color-white'),
    brightBlack: cssVar('--xova-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--xova-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--xova-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--xova-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--xova-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--xova-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--xova-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--xova-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
