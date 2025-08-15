import { createMuiThemeFromCssVars, getStageColor, getPriorityColor } from '@/lib/muiTheme';

// Mock window object for server-side rendering
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock CSS variables
Object.defineProperty(document.documentElement, 'style', {
  writable: true,
  value: {
    getPropertyValue: jest.fn((prop: string) => {
      const cssVars: Record<string, string> = {
        '--color-brand-500': '#465fff',
        '--color-brand-600': '#3641f5',
        '--color-brand-300': '#9cb9ff',
        '--color-success-500': '#12b76a',
        '--color-error-500': '#f04438',
        '--color-orange-500': '#fb6514',
        '--color-blue-light-500': '#0ba5ec',
        '--color-gray-50': '#f9fafb',
        '--color-gray-100': '#f2f4f7',
        '--color-gray-200': '#e4e7ec',
        '--color-gray-300': '#d0d5dd',
        '--color-gray-400': '#98a2b3',
        '--color-gray-500': '#667085',
        '--color-gray-600': '#475467',
        '--color-gray-700': '#344054',
        '--color-gray-800': '#1d2939',
        '--color-gray-900': '#101828',
        '--color-gray-dark': '#1a2231',
      };
      return cssVars[prop] || '';
    }),
  },
});

describe('Pipeline Theme System', () => {
  describe('Theme Creation', () => {
    it('should create a theme with light mode by default', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.palette.mode).toBe('light');
      expect(theme.palette.background.default).toBe('#f9fafb');
      expect(theme.palette.background.paper).toBe('#ffffff');
    });

    it('should create a theme with dark mode', () => {
      const theme = createMuiThemeFromCssVars('dark');
      
      expect(theme.palette.mode).toBe('dark');
      expect(theme.palette.background.default).toBe('#101828');
      expect(theme.palette.background.paper).toBe('#1a2231');
    });

    it('should include custom semantic palette', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.palette.semantic).toBeDefined();
      expect(theme.palette.semantic.success).toBe('#12b76a');
      expect(theme.palette.semantic.info).toBe('#0ba5ec');
      expect(theme.palette.semantic.warning).toBe('#fb6514');
      expect(theme.palette.semantic.danger).toBe('#f04438');
    });

    it('should include pipeline stage colors', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.palette.stage).toBeDefined();
      expect(theme.palette.stage.lead).toBe('#3B82F6');
      expect(theme.palette.stage.contacted).toBe('#8B5CF6');
      expect(theme.palette.stage.negotiation).toBe('#F59E0B');
      expect(theme.palette.stage.closed).toBe('#10B981');
    });

    it('should include brand colors', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.palette.brand).toBeDefined();
      expect(theme.palette.brand.primary).toBe('#465fff');
      expect(theme.palette.brand.secondary).toBe('#0ba5ec');
      expect(theme.palette.brand.neutral).toBe('#667085');
    });

    it('should include custom theme variables', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.vars).toBeDefined();
      expect(theme.vars.radius.sm).toBe('4px');
      expect(theme.vars.radius.md).toBe('8px');
      expect(theme.vars.radius.lg).toBe('12px');
      expect(theme.vars.radius.xl).toBe('16px');
      expect(theme.vars.density.compact).toBe(0.8);
      expect(theme.vars.density.comfortable).toBe(1);
      expect(theme.vars.density.spacious).toBe(1.2);
    });
  });

  describe('Component Variants', () => {
    it('should include MuiButton variants', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.components?.MuiButton?.variants).toBeDefined();
      const pipelineActionVariant = theme.components?.MuiButton?.variants?.find(
        (v: any) => v.props?.variant === 'pipelineAction'
      );
      expect(pipelineActionVariant).toBeDefined();
    });

    it('should include MuiChip variants', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.components?.MuiChip?.variants).toBeDefined();
      const stageBadgeVariant = theme.components?.MuiChip?.variants?.find(
        (v: any) => v.props?.variant === 'stageBadge'
      );
      const priorityBadgeVariant = theme.components?.MuiChip?.variants?.find(
        (v: any) => v.props?.variant === 'priorityBadge'
      );
      expect(stageBadgeVariant).toBeDefined();
      expect(priorityBadgeVariant).toBeDefined();
    });
  });

  describe('Theme Utilities', () => {
    it('should return correct stage colors', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(getStageColor('lead', theme)).toBe('#3B82F6');
      expect(getStageColor('contacted', theme)).toBe('#8B5CF6');
      expect(getStageColor('negotiation', theme)).toBe('#F59E0B');
      expect(getStageColor('closed', theme)).toBe('#10B981');
      expect(getStageColor('unknown', theme)).toBe('#667085'); // fallback to grey
    });

    it('should return correct priority colors', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(getPriorityColor('low', theme)).toBe('#667085');
      expect(getPriorityColor('medium', theme)).toBe('#fb6514');
      expect(getPriorityColor('high', theme)).toBe('#f04438');
      expect(getPriorityColor('urgent', theme)).toBe('#DC2626');
      expect(getPriorityColor('unknown', theme)).toBe('#667085'); // fallback to grey
    });
  });

  describe('Responsive Typography', () => {
    it('should apply responsive font sizes', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      // Check that responsiveFontSizes was applied
      expect(theme.typography.h1).toBeDefined();
      expect(theme.typography.h2).toBeDefined();
      expect(theme.typography.h3).toBeDefined();
      expect(theme.typography.h4).toBeDefined();
      expect(theme.typography.h5).toBeDefined();
      expect(theme.typography.h6).toBeDefined();
    });
  });

  describe('Theme Consistency', () => {
    it('should maintain consistent spacing and typography', () => {
      const theme = createMuiThemeFromCssVars('light');
      
      expect(theme.shape.borderRadius).toBe(12);
      expect(theme.typography.button.textTransform).toBe('none');
      expect(theme.typography.button.fontWeight).toBe(500);
      expect(theme.typography.button.fontSize).toBe('0.875rem');
    });

    it('should handle theme switching correctly', () => {
      const lightTheme = createMuiThemeFromCssVars('light');
      const darkTheme = createMuiThemeFromCssVars('dark');
      
      expect(lightTheme.palette.mode).toBe('light');
      expect(darkTheme.palette.mode).toBe('dark');
      expect(lightTheme.palette.background.default).not.toBe(darkTheme.palette.background.default);
      expect(lightTheme.palette.background.paper).not.toBe(darkTheme.palette.background.paper);
    });
  });
});
