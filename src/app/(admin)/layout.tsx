"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createMuiThemeFromCssVars } from "@/lib/muiTheme";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { theme } = useTheme();
  const muiTheme = React.useMemo(() => createMuiThemeFromCssVars(theme), [theme]);

  // When any modal/overlay opens, blur header focus and make header inert (generic, not MUI-specific)
  useEffect(() => {
    const header = document.getElementById("app-header");
    if (!header) return;
    let prevAnyOpen = false;
    const observer = new MutationObserver(() => {
      const anyOpen = !!document.querySelector(
        "[aria-modal='true'], .MuiDialog-root:not([aria-hidden='true']), .flatpickr-calendar.open, .fc-popover, [data-overlay='true']"
      );
      if (anyOpen === prevAnyOpen) return; // Only react on state transition
      prevAnyOpen = anyOpen;
      if (anyOpen) {
        (document.activeElement as HTMLElement | null)?.blur?.();
        // Do NOT set inert on the whole header to avoid blocking sidebar interactions/events.
        // Instead, only disable pointer-events to prevent accidental clicks while modal is open.
        header.style.pointerEvents = "none";
        header.style.userSelect = "none";
      } else {
        header.style.pointerEvents = "";
        header.style.userSelect = "";
      }
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ["aria-hidden", "aria-modal", "class"] });
    return () => observer.disconnect();
  }, []);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
      </div>
    </MuiThemeProvider>
  );
}
