import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { Theme } from "@/design/theme";
import { auth } from "@/services/firebaseConfig";
import { signOut } from "firebase/auth";
import { Slot, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SIDEBAR_WIDTH = 270;

type SidebarProps = {
  selectedChildId: string | null;
};

function Sidebar({ selectedChildId }: SidebarProps) {
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

  const visualSkillsHref = "/visual-skills";
  const visualSkillsIsActive = pathname === visualSkillsHref;
  const visualSkillsIsHover = pressedItem === visualSkillsHref && !!selectedChildId;

  const disabledNavItems = [
    "Receptive Language",
    "Expressive Language",
    "Imitation",
    "Play Skills",
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
          {/* Home */}
          <Pressable
            style={[
              styles.navItem,
              pathname === "/main-dashboard" && styles.navItemActive,
              pressedItem === "/main-dashboard" && pathname !== "/main-dashboard" && styles.navItemHover,
            ]}
            onPress={() => router.push("/main-dashboard")}
            onPressIn={() => setPressedItem("/main-dashboard")}
            onPressOut={() => setPressedItem(null)}
          >
            <Ionicons
              name="home-outline"
              size={22}
              color={pathname === "/main-dashboard" ? Theme.colors.primaryDark : Theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.navLabel,
                pathname === "/main-dashboard" && styles.navLabelActive,
              ]}
            >
              Home
            </Text>
          </Pressable>
          <View style={styles.sidebarDivider} />
          <Text style={styles.sidebarSectionTitle}>Therapy Areas</Text>
          {/* Visual Skills – disabled when no child selected */}
          <TouchableOpacity
            disabled={!selectedChildId}
            onPress={() => {
              if (!selectedChildId) return;
              router.push("/visual-skills");
            }}
            onPressIn={() => selectedChildId && setPressedItem(visualSkillsHref)}
            onPressOut={() => setPressedItem(null)}
            style={[
              styles.navItem,
              !selectedChildId && { opacity: 0.4 },
              visualSkillsIsActive && styles.navItemActive,
              visualSkillsIsHover && !visualSkillsIsActive && styles.navItemHover,
            ]}
          >
            <Ionicons
              name="list-outline"
              size={22}
              color={visualSkillsIsActive ? Theme.colors.primaryDark : Theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.navLabel,
                visualSkillsIsActive && styles.navLabelActive,
              ]}
            >
              Visual Skills
            </Text>
          </TouchableOpacity>
          {disabledNavItems.map((label) => (
            <View key={label} style={[styles.navItem, styles.navItemDisabled]}>
              <Ionicons name="ellipse-outline" size={22} color={Theme.colors.textSecondary} />
              <Text style={styles.navLabelMuted}>{label}</Text>
            </View>
          ))}
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
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  return (
    <SelectedChildContext.Provider value={{ selectedChildId, setSelectedChildId }}>
      <View style={styles.root}>
        <Sidebar selectedChildId={selectedChildId} />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </SelectedChildContext.Provider>
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
  sidebarDivider: {
    height: 1,
    backgroundColor: "#E5EEF0",
    marginVertical: 16,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
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
  navItemDisabled: {
    opacity: 0.4,
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
