"use client";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createMuiThemeFromCssVars } from "@/lib/muiTheme";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const muiTheme = React.useMemo(() => createMuiThemeFromCssVars(theme), [theme]);
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div>{children}</div>
    </MuiThemeProvider>
  );
}
