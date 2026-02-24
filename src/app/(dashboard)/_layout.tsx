import { auth } from "@/services/firebaseConfig";
import { signOut } from "firebase/auth";
import { Slot, usePathname, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SIDEBAR_WIDTH = 270;

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

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
      <View style={styles.navBlock}>
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Pressable
              key={href}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(href)}
            >
              <Ionicons
                name={icon}
                size={22}
                color={isActive ? "#2563EB" : "#64748B"}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={styles.navItem}
          onPress={() => {}}
        >
          <Ionicons name="person-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabelMuted}>Profil terapeut</Text>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/privacy-policy")}
        >
          <Ionicons name="shield-outline" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Privacy</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/account-edit")}
        >
          <Ionicons name="settings-outline" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Settings</Text>
        </Pressable>
        <Pressable style={[styles.navItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#64748B" />
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
    borderRightColor: "#E2E8F0",
    paddingVertical: 20,
    paddingHorizontal: 12,
    justifyContent: "space-between",
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
  },
  navItemActive: {
    backgroundColor: "#EFF6FF",
  },
  navLabel: {
    fontSize: 15,
    color: "#0F172A",
  },
  navLabelActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
  navLabelMuted: {
    fontSize: 15,
    color: "#94A3B8",
  },
  footer: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 16,
  },
  logoutItem: {
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
});
