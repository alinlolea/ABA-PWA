import { Theme } from "@/design/theme";
import { auth } from "@/services/firebaseConfig";
import { signOut } from "firebase/auth";
import { Slot, usePathname, useRouter } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

const SIDEBAR_WIDTH = 270;

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      Alert.alert("Eroare", "Nu s-a putut deconecta.");
    }
  };

  const navItems: { href: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { href: "/main-dashboard", label: "Home", icon: "home-outline" },
    { href: "/session", label: "Session", icon: "list-outline" },
  ];

  return (
    <View style={styles.sidebar}>
      <View>
        <View style={styles.brandSection}>
          <Image
            source={require("../../../assets/images/digital-aba-therapy-logo.png")}
            style={styles.logoImage}
          />
        </View>
        <View style={styles.brandDivider} />
        <View style={styles.navBlock}>
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            const isHover = pressedItem === href;
            return (
              <Pressable
                key={href}
                style={[
                  styles.navItem,
                  isActive && styles.navItemActive,
                  isHover && !isActive && styles.navItemHover,
                ]}
                onPress={() => router.push(href)}
                onPressIn={() => setPressedItem(href)}
                onPressOut={() => setPressedItem(null)}
              >
                <Ionicons
                  name={icon}
                  size={22}
                  color={isActive ? Theme.colors.primaryDark : Theme.colors.textSecondary}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.navItem, pressedItem === "profil" && styles.navItemHover]}
            onPress={() => {}}
            onPressIn={() => setPressedItem("profil")}
            onPressOut={() => setPressedItem(null)}
          >
            <Ionicons name="person-outline" size={22} color={Theme.colors.textSecondary} />
            <Text style={styles.navLabelMuted}>Profil terapeut</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.footerWrap}>
        <View style={styles.separator} />
        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/privacy-policy")}
        >
          <Ionicons name="shield-outline" size={22} color={Theme.colors.textSecondary} />
          <Text style={styles.navLabel}>Privacy</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/account-edit")}
        >
          <Ionicons name="settings-outline" size={22} color={Theme.colors.textSecondary} />
          <Text style={styles.navLabel}>Settings</Text>
        </Pressable>
        <Pressable style={[styles.navItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Theme.colors.textSecondary} />
          <Text style={styles.navLabel}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DashboardLayout() {
  return (
    <View style={styles.root}>
      <Sidebar />
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: Theme.colors.sidebarBorder,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: "column",
  },
  brandSection: {
    height: 130,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 220,
    height: 90,
    resizeMode: "contain",
  },
  brandDivider: {
    height: 1,
    backgroundColor: "rgba(44, 100, 104, 0.25)",
    marginVertical: 16,
  },
  navBlock: {
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderLeftWidth: 0,
  },
  navItemActive: {
    backgroundColor: Theme.colors.activeBg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  navItemHover: {
    backgroundColor: Theme.colors.hoverBg,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.medium,
  },
  navLabelActive: {
    color: Theme.colors.primaryDark,
    fontWeight: "600",
    fontFamily: Theme.fontFamily.semiBold,
  },
  navLabelMuted: {
    fontSize: 15,
    fontWeight: "500",
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
  },
  footerWrap: {
    marginTop: "auto",
    gap: 4,
    paddingTop: 16,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.colors.dividerLime,
    marginBottom: 12,
  },
  logoutItem: {
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
});
