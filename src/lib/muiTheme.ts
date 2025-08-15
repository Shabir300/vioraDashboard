import { createTheme, Theme, PaletteMode } from "@mui/material/styles";
import { responsiveFontSizes } from "@mui/material/styles";

type Mode = "light" | "dark";

// TypeScript module augmentation for custom theme tokens
declare module '@mui/material/styles' {
  interface Palette {
    semantic: {
      success: string;
      info: string;
      warning: string;
      danger: string;
    };
    stage: {
      lead: string;
      contacted: string;
      negotiation: string;
      closed: string;
    };
    brand: {
      primary: string;
      secondary: string;
      neutral: string;
    };
  }
  
  interface PaletteOptions {
    semantic?: {
      success: string;
      info: string;
      warning: string;
      danger: string;
    };
    stage?: {
      lead: string;
      contacted: string;
      negotiation: string;
      closed: string;
    };
    brand?: {
      primary: string;
      secondary: string;
      neutral: string;
    };
  }

  interface Theme {
    vars: {
      radius: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
      density: {
        compact: number;
        comfortable: number;
        spacious: number;
      };
    };
  }

  interface ThemeOptions {
    vars?: {
      radius: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
      density: {
        compact: number;
        comfortable: number;
        spacious: number;
      };
    };
  }
}





declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    stageBadge: true;
    priorityBadge: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    pipelineAction: true;
  }
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  const trimmed = v.trim();
  return trimmed || fallback;
}

export function createMuiThemeFromCssVars(mode: PaletteMode): Theme {
  // Respect the app's active font set by Next.js layout (next/font)
  const readFontFamily = (): string => {
    if (typeof window === "undefined") return "inherit";
    const target = document.body || document.documentElement;
    const ff = getComputedStyle(target).fontFamily;
    return (ff && ff.trim()) || "inherit";
  };
  const appFont = readFontFamily();

  // Brand colors
  const brand500 = readCssVar("--color-brand-500", "#465fff");
  const brand600 = readCssVar("--color-brand-600", "#3641f5");
  const brand300 = readCssVar("--color-brand-300", "#9cb9ff");

  // Semantic colors
  const success500 = readCssVar("--color-success-500", "#12b76a");
  const error500 = readCssVar("--color-error-500", "#f04438");
  const warning500 = readCssVar("--color-orange-500", "#fb6514");
  const info500 = readCssVar("--color-blue-light-500", "#0ba5ec");

  // Grays
  const gray50 = readCssVar("--color-gray-50", "#f9fafb");
  const gray100 = readCssVar("--color-gray-100", "#f2f4f7");
  const gray200 = readCssVar("--color-gray-200", "#e4e7ec");
  const gray300 = readCssVar("--color-gray-300", "#d0d5dd");
  const gray400 = readCssVar("--color-gray-400", "#98a2b3");
  const gray500 = readCssVar("--color-gray-500", "#667085");
  const gray600 = readCssVar("--color-gray-600", "#475467");
  const gray700 = readCssVar("--color-gray-700", "#344054");
  const gray800 = readCssVar("--color-gray-800", "#1d2939");
  const gray900 = readCssVar("--color-gray-900", "#101828");
  const grayDark = readCssVar("--color-gray-dark", "#1a2231");

  const isLight = mode === "light";

  const stageColors = {
    lead: "#3B82F6",
    contacted: "#8B5CF6",
    qualified: "#8B5CF6",
    proposal: "#F59E0B",
    negotiation: "#EF4444",
    closed: "#10B981",
    lost: "#6B7280",
  };

  const priorityColors = {
    low: "#6B7280",
    medium: "#F59E0B",
    high: "#EF4444",
    urgent: "#DC2626",
  };

  const baseTheme = createTheme({
    palette: {
      mode,
      primary: { main: brand500, dark: brand600, light: brand300 },
      secondary: { main: info500 },
      success: { main: success500 },
      error: { main: error500 },
      warning: { main: warning500 },
      info: { main: info500 },
      grey: {
        50: gray50,
        100: gray100,
        200: gray200,
        300: gray300,
        400: gray400,
        500: gray500,
        600: gray600,
        700: gray700,
        800: gray800,
        900: gray900,
        A100: gray100,
        A200: gray200,
        A400: gray400,
        A700: gray700,
      },
      background: {
        default: isLight ? gray50 : gray900,
        paper: isLight ? "#ffffff" : grayDark,
      },
      // Custom semantic palette
      semantic: {
        success: success500,
        info: info500,
        warning: warning500,
        danger: error500,
      },
      // Pipeline stage colors
      stage: stageColors,
      // Brand colors
      brand: {
        primary: brand500,
        secondary: info500,
        neutral: gray500,
      },
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily: appFont,
      button: {
        textTransform: "none",
        fontWeight: 500,
        fontSize: "0.875rem",
        lineHeight: 1.25,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? gray50 : gray900,
          },
          '*, *::before, *::after': { boxSizing: 'border-box' },
          'button, input, textarea, select': { fontFamily: 'inherit' },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
          size: 'small',
        },
        styleOverrides: {
          root: {
            '&&': {
              textTransform: "none",
              borderRadius: 10,
              fontWeight: 500,
              fontFamily: 'inherit',
            },
          },
          sizeSmall: {
            // Approx Tailwind: px-4 py-2.5 text-sm
            '&&': {
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 16,
              paddingRight: 16,
              fontSize: "0.875rem",
              lineHeight: 1.25,
              borderRadius: 10,
              minHeight: 40,
            },
          },
          containedSizeSmall: {
            '&&': {
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 16,
              paddingRight: 16,
              fontSize: "0.875rem",
              lineHeight: 1.25,
              borderRadius: 10,
              minHeight: 40,
            },
          },
          outlinedSizeSmall: {
            '&&': {
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 16,
              paddingRight: 16,
              fontSize: "0.875rem",
              lineHeight: 1.25,
              borderRadius: 10,
              minHeight: 40,
            },
          },
          textSizeSmall: {
            '&&': {
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: "0.875rem",
              lineHeight: 1.25,
              borderRadius: 10,
              minHeight: 40,
            },
          },
          // Medium size buttons
          sizeMedium: {
            '&&': {
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 20,
              paddingRight: 20,
              fontSize: "1rem",
              lineHeight: 1.5,
              borderRadius: 12,
              minHeight: 48,
            },
          },
          containedSizeMedium: {
            '&&': {
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 20,
              paddingRight: 20,
              fontSize: "1rem",
              lineHeight: 1.5,
              borderRadius: 12,
              minHeight: 48,
            },
          },
          outlinedSizeMedium: {
            '&&': {
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 20,
              paddingRight: 20,
              fontSize: "1rem",
              lineHeight: 1.5,
              borderRadius: 12,
              minHeight: 48,
            },
          },
          textSizeMedium: {
            '&&': {
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 16,
              paddingRight: 16,
              fontSize: "1rem",
              lineHeight: 1.5,
              borderRadius: 12,
              minHeight: 48,
            },
          },
          // Large size buttons
          sizeLarge: {
            '&&': {
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 24,
              paddingRight: 24,
              fontSize: "1.125rem",
              lineHeight: 1.5,
              borderRadius: 14,
              minHeight: 56,
            },
          },
          containedSizeLarge: {
            '&&': {
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 24,
              paddingRight: 24,
              fontSize: "1.125rem",
              lineHeight: 1.5,
              borderRadius: 14,
              minHeight: 56,
            },
          },
          outlinedSizeLarge: {
            '&&': {
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 24,
              paddingRight: 24,
              fontSize: "1.125rem",
              lineHeight: 1.5,
              borderRadius: 14,
              minHeight: 56,
            },
          },
          textSizeLarge: {
            '&&': {
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 20,
              paddingRight: 20,
              fontSize: "1.125rem",
              lineHeight: 1.5,
              borderRadius: 14,
              minHeight: 56,
            },
          },
          containedPrimary: {
            backgroundColor: brand500,
            color: "#ffffff",
            '&:hover': {
              backgroundColor: brand600,
            },
          },
          containedSecondary: {
            backgroundColor: info500,
            color: "#ffffff",
            '&:hover': {
              backgroundColor: info500,
            },
          },
          outlined: {
            borderColor: isLight ? gray300 : gray600,
            color: isLight ? gray700 : gray200,
            '&:hover': {
              backgroundColor: isLight ? gray100 : "rgba(255,255,255,0.03)",
            },
          },
          text: {
            color: isLight ? gray700 : gray200,
            '&:hover': {
              backgroundColor: isLight ? gray100 : "rgba(255,255,255,0.03)",
            },
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: isLight ? "#ffffff" : grayDark,
            border: `1px solid ${isLight ? gray200 : gray700}`,
            borderRadius: 0,
            boxShadow: isLight 
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: isLight 
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                : "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
              transform: 'translateY(-2px)',
            },
          },
        },
        variants: [
          {
            props: { variant: 'pipelineCard' as any },
            style: {
              backgroundColor: isLight ? "#ffffff" : grayDark,
              border: `2px solid ${isLight ? gray200 : gray700}`,
              borderRadius: 0,
              padding: 16,
              cursor: 'pointer',
              '&:hover': {
                borderColor: brand500,
                backgroundColor: isLight ? gray100 : gray800,
              },
            },
          },
        ],
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: isLight ? "#ffffff" : grayDark,
            border: `1px solid ${isLight ? gray200 : gray700}`,
            borderRadius: 0,
          },
        },
        variants: [
          {
            props: { variant: 'stageColumn' as any },
            style: {
              backgroundColor: isLight ? "#ffffff" : grayDark,
              border: `2px solid ${isLight ? gray200 : gray700}`,
              borderRadius: 0,
              padding: 20,
              minHeight: 400,
              minWidth: 300,
            },
          },
        ],
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
          },
          colorPrimary: {
            backgroundColor: brand500,
            color: "#ffffff",
          },
          colorSecondary: {
            backgroundColor: info500,
            color: "#ffffff",
          },
          colorSuccess: {
            backgroundColor: success500,
            color: "#ffffff",
          },
          colorWarning: {
            backgroundColor: warning500,
            color: "#ffffff",
          },
          colorError: {
            backgroundColor: error500,
            color: "#ffffff",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isLight ? "#ffffff" : grayDark,
            borderRadius: 16,
            boxShadow: isLight 
              ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              : "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? "#ffffff" : grayDark,
            borderBottom: `1px solid ${isLight ? gray200 : gray700}`,
            boxShadow: isLight 
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.3)",
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            marginBottom: 4,
            '&:hover': {
              backgroundColor: isLight ? gray100 : gray800,
            },
          },
        },
      },
    },
  });

  return responsiveFontSizes(baseTheme);
}

// Export theme utilities
export const getStageColor = (stage: string, theme: Theme): string => {
  const stageColors = {
    lead: theme.palette.stage.lead,
    contacted: theme.palette.stage.contacted,
    negotiation: theme.palette.stage.negotiation,
    closed: theme.palette.stage.closed,
  };
  return stageColors[stage as keyof typeof stageColors] || theme.palette.grey[500];
};

export const getPriorityColor = (priority: string, theme: Theme): string => {
  const priorityColors = {
    low: theme.palette.grey[500],
    medium: theme.palette.warning.main,
    high: theme.palette.error.main,
    urgent: '#DC2626',
  };
  return priorityColors[priority as keyof typeof priorityColors] || theme.palette.grey[500];
};


