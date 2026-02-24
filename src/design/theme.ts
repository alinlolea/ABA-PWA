/**
 * Centralized theme for ABA app.
 * Slate + Teal Soft (premium). Use Inter font (loaded in root layout).
 */
export const Theme = {
  colors: {
    primary: "#2C6468",
    primaryDark: "#2C6468",
    dividerLime: "rgba(44, 100, 104, 0.25)",
    background: "#F4F7F8",
    card: "#FFFFFF",
    buttonGrey: "#E8F1F2",
    buttonGreyHover: "#D6E6E8",
    progressBg: "#E3EEF0",
    progressFill: "#3F8E92",
    textPrimary: "#1E293B",
    textSecondary: "#64748B",
    borderButton: "#D6E6E8",
    sidebarBorder: "rgba(44, 100, 104, 0.25)",
    activeBg: "rgba(44, 100, 104, 0.08)",
    hoverBg: "rgba(44, 100, 104, 0.06)",
  },
  typography: {
    title: { fontSize: 20, fontWeight: "600" as const },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "500" as const,
      color: "#64748B",
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
    body: { fontSize: 14, fontWeight: "400" as const },
  },
  fontFamily: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
  },
};
