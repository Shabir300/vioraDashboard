import { createTheme, Theme } from "@mui/material/styles";

type Mode = "light" | "dark";

function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  const trimmed = v.trim();
  return trimmed || fallback;
}

export function createMuiThemeFromCssVars(mode: Mode): Theme {
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

  return createTheme({
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
    },
    shape: { borderRadius: 12 },
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
            // Keep in sync with Tailwind body background
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
          containedPrimary: {
            '&&': {
              backgroundColor: brand500,
              color: "#ffffff",
              boxShadow: "var(--shadow-theme-xs)",
              "&:hover": {
                backgroundColor: brand600,
                boxShadow: "var(--shadow-theme-xs)",
              },
              "&.Mui-disabled": {
                backgroundColor: brand300,
                color: "#ffffff",
              },
            },
          },
          outlinedPrimary: {
            '&&': {
              borderColor: gray300,
              color: gray700,
              backgroundColor: "transparent",
              "&:hover": {
                borderColor: gray300,
                backgroundColor: isLight ? gray100 : "rgba(255,255,255,0.03)",
              },
            },
          },
          textPrimary: {
            '&&': {
              color: brand500,
              "&:hover": { backgroundColor: isLight ? gray100 : "rgba(255,255,255,0.03)" },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 16 } },
      },
      MuiTextField: {
        defaultProps: { size: "small", variant: "outlined" },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16 },
        },
      },
    },
  });
}


