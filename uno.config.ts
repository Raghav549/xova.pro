import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'xova';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  accent: {
    50: '#F3F1FF',
    100: '#E9E5FF',
    200: '#D5CEFF',
    300: '#B7A9FF',
    400: '#957DFF',
    500: '#7C5CFF',
    600: '#6A3FF5',
    700: '#5A2EDB',
    800: '#4A26B4',
    900: '#3E2391',
    950: '#241356',
  },
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  magenta: {
    50: '#FFF0F7',
    100: '#FFE3F1',
    200: '#FFC7E3',
    300: '#FF9BCB',
    400: '#FF6FB1',
    500: '#FF5FA2',
    600: '#EE3B84',
    700: '#C72467',
    800: '#A01E54',
    900: '#7D1A44',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#FFFAEB',
    100: '#FEEFC7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#792E0D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
    cyan: generateAlphaPalette(BASE_COLORS.cyan[400]),
    magenta: generateAlphaPalette(BASE_COLORS.magenta[500]),
  },
};

export default defineConfig({
  shortcuts: {
    'xova-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 xova-ease-cubic-bezier',
    kdb: 'bg-xova-elements-code-background text-xova-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
    /* --- Xova Studio design system --- */
    glass: 'bg-xova-glass-background border border-xova-elements-borderColor backdrop-blur-xl',
    'glass-strong': 'bg-xova-glass-backgroundStrong border border-xova-elements-borderColorActive/40 backdrop-blur-2xl',
    panel: 'bg-xova-elements-background-depth-2 border border-xova-elements-borderColor rounded-xl',
    'panel-hover':
      'hover:border-xova-elements-borderColorActive transition-[border-color,box-shadow,transform] duration-200 xova-ease-cubic-bezier',
    'btn-base':
      'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 xova-ease-cubic-bezier whitespace-nowrap select-none disabled:opacity-40 disabled:pointer-events-none',
    'btn-secondary':
      'btn-base bg-xova-elements-button-secondary-background text-xova-elements-button-secondary-text hover:bg-xova-elements-button-secondary-backgroundHover hover:-translate-y-px border border-xova-elements-borderColor',
    'btn-ghost':
      'btn-base bg-transparent text-xova-elements-textSecondary hover:text-xova-elements-textPrimary hover:bg-xova-elements-item-backgroundActive',
    'btn-danger':
      'btn-base bg-xova-elements-button-danger-background text-xova-elements-button-danger-text hover:bg-xova-elements-button-danger-backgroundHover',
    chip: 'inline-flex items-center gap-1.5 rounded-full border border-xova-elements-borderColor bg-xova-elements-item-backgroundDefault px-2.5 py-1 text-xs text-xova-elements-textSecondary transition-theme',
    'chip-active':
      'chip border-xova-elements-borderColorActive text-xova-elements-textPrimary bg-xova-elements-item-backgroundAccent',
    field:
      'w-full rounded-lg border border-xova-elements-borderColor bg-xova-elements-background-depth-1/70 px-3 py-2 text-sm text-xova-elements-textPrimary placeholder-xova-elements-textTertiary outline-none focus:border-xova-elements-borderColorActive transition-theme',
    'icon-btn':
      'inline-flex items-center justify-center rounded-lg w-8 h-8 text-xova-elements-textSecondary hover:text-xova-elements-textPrimary hover:bg-xova-elements-item-backgroundActive transition-theme',
    'mono-text': 'font-mono text-[12.5px] leading-[1.55]',
    'section-label': 'text-[11px] uppercase tracking-[0.16em] text-xova-elements-textTertiary font-medium',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      xova: {
        elements: {
          borderColor: 'var(--xova-elements-borderColor)',
          borderColorActive: 'var(--xova-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--xova-elements-bg-depth-1)',
              2: 'var(--xova-elements-bg-depth-2)',
              3: 'var(--xova-elements-bg-depth-3)',
              4: 'var(--xova-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--xova-elements-textPrimary)',
          textSecondary: 'var(--xova-elements-textSecondary)',
          textTertiary: 'var(--xova-elements-textTertiary)',
          code: {
            background: 'var(--xova-elements-code-background)',
            text: 'var(--xova-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--xova-elements-button-primary-background)',
              backgroundHover: 'var(--xova-elements-button-primary-backgroundHover)',
              text: 'var(--xova-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--xova-elements-button-secondary-background)',
              backgroundHover: 'var(--xova-elements-button-secondary-backgroundHover)',
              text: 'var(--xova-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--xova-elements-button-danger-background)',
              backgroundHover: 'var(--xova-elements-button-danger-backgroundHover)',
              text: 'var(--xova-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--xova-elements-item-contentDefault)',
            contentActive: 'var(--xova-elements-item-contentActive)',
            contentAccent: 'var(--xova-elements-item-contentAccent)',
            contentDanger: 'var(--xova-elements-item-contentDanger)',
            backgroundDefault: 'var(--xova-elements-item-backgroundDefault)',
            backgroundActive: 'var(--xova-elements-item-backgroundActive)',
            backgroundAccent: 'var(--xova-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--xova-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--xova-elements-actions-background)',
            code: {
              background: 'var(--xova-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--xova-elements-artifacts-background)',
            backgroundHover: 'var(--xova-elements-artifacts-backgroundHover)',
            borderColor: 'var(--xova-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--xova-elements-artifacts-inlineCode-background)',
              text: 'var(--xova-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--xova-elements-messages-background)',
            linkColor: 'var(--xova-elements-messages-linkColor)',
            code: {
              background: 'var(--xova-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--xova-elements-messages-inlineCode-background)',
              text: 'var(--xova-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--xova-elements-icon-success)',
            error: 'var(--xova-elements-icon-error)',
            primary: 'var(--xova-elements-icon-primary)',
            secondary: 'var(--xova-elements-icon-secondary)',
            tertiary: 'var(--xova-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--xova-elements-preview-addressBar-background)',
              backgroundHover: 'var(--xova-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--xova-elements-preview-addressBar-backgroundActive)',
              text: 'var(--xova-elements-preview-addressBar-text)',
              textActive: 'var(--xova-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--xova-elements-terminals-background)',
            buttonBackground: 'var(--xova-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--xova-elements-dividerColor)',
          loader: {
            background: 'var(--xova-elements-loader-background)',
            progress: 'var(--xova-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--xova-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--xova-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--xova-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--xova-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--xova-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--xova-elements-cta-background)',
            text: 'var(--xova-elements-cta-text)',
          },
          glass: {
            background: 'var(--xova-glass-background)',
            backgroundStrong: 'var(--xova-glass-background-strong)',
          },
          accent: {
            glow: 'var(--xova-accent-glow)',
            cyan: 'var(--xova-accent-cyan)',
            magenta: 'var(--xova-accent-magenta)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: {
        ...customIconCollection,
      },
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
