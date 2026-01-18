import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ThemeName = "pantryLight";

type ThemePalette = {
  name: ThemeName;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  text: string;
  textMuted: string;
  neutral: string;
  fontFamily: string;
  cardColor: string;
  chartLine: string;
};

const themePresets: Record<ThemeName, ThemePalette> = {
  pantryLight: {
    name: "pantryLight",
    background: "#FFFBEF",
    // surface: "#FFFFFF",
    // surfaceAlt: "#F7F5F3",
    // border: "#BBBDBC",
    primary: "#FAD1DA",
    primaryText: "#70000E",
    secondary: "#A5231C",
    // secondaryText: "#F2F0EF",
    text: "#70000E",
    // textMuted: "#733E24",
    // neutral: "#BBBDBC",
    // background: "#F5F5F5",      // LiPght gray
    surface: "#FFFFFF",         // White for cards
    surfaceAlt: "#E8E8E8",      // Slightly darker gray
    border: "#CCCCCC",          // Light gray
    // primary: "#001F3F",         // Deep Navy Blue
    // primaryText: "#FFFFFF",     // White text on navy
    // secondary: "#D4AF37",       // Metallic Gold for accents
    secondaryText: "#000000",   // Black text on gold
    // text: "#111111",            // Almost black for main text
    textMuted: "#666666",       // Dark gray for subtitles
    neutral: "#666666",
    cardColor: "#FFF9F4",
    chartLine:"#828F58",
    fontFamily:
      '"Roboto", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
  themeName: ThemeName;
  theme: ThemePalette;
  setThemeName: (name: ThemeName) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [themeName, setThemeName] = useState<ThemeName>("pantryLight");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedTheme = localStorage.getItem("themeName") as ThemeName | null;

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    if (storedTheme && themePresets[storedTheme]) {
      setThemeName(storedTheme);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const palette = themePresets[themeName];
    const root = document.documentElement;
    root.style.setProperty("--pp-bg", palette.background);
    root.style.setProperty("--pp-surface", palette.surface);
    root.style.setProperty("--pp-surface-alt", palette.surfaceAlt);
    root.style.setProperty("--pp-border", palette.border);
    root.style.setProperty("--pp-primary", palette.primary);
    root.style.setProperty("--pp-primary-text", palette.primaryText);
    root.style.setProperty("--pp-secondary", palette.secondary);
    root.style.setProperty("--pp-secondary-text", palette.secondaryText);
    root.style.setProperty("--pp-text", palette.text);
    root.style.setProperty("--pp-text-muted", palette.textMuted);
    root.style.setProperty("--pp-neutral", palette.neutral);
    root.style.setProperty("--pp-font-family", palette.fontFamily);
    localStorage.setItem("themeName", themeName);
  }, [themeName]);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setToken(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.clear();

  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        token,
        isAuthenticated: !!user,
        themeName,
        theme: themePresets[themeName],
        setThemeName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
