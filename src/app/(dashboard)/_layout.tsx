import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { Colors } from "@/design/colors";
import { Theme } from "@/design/theme";
import { TouchTarget } from "@/design/touch";
import { auth } from "@/config/firebase";
import { signOut } from "firebase/auth";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useResponsive } from "@/utils/responsive";
import { Slot, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
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
  const { rs } = useResponsive();
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const { installPWA, canInstall } = usePWAInstall();

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

  const receptiveLanguageHref = "/receptive-language";
  const receptiveLanguageIsActive = pathname === receptiveLanguageHref;
  const receptiveLanguageIsHover = pressedItem === receptiveLanguageHref && !!selectedChildId;

  const readingHref = "/reading";
  const readingIsActive = pathname === readingHref;
  const readingIsHover = pressedItem === readingHref && !!selectedChildId;

  const disabledNavItems = [
    "Etichetare",
    "Limbaj expresiv",
  ];

  return (
    <View style={[styles.sidebar, { width: rs(270) }]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingVertical: rs(20),
            paddingHorizontal: rs(16),
          }}
          showsVerticalScrollIndicator={false}
        >
        <View style={[styles.brandSection, { height: rs(130), paddingTop: rs(32), paddingBottom: rs(24), paddingHorizontal: rs(16) }]}>
          <Image
            source={require("../../../assets/images/digital-aba-therapy-logo.png")}
            style={[styles.logoImage, { width: rs(220), height: rs(90) }]}
          />
        </View>
        <View style={[styles.brandDivider, { marginVertical: rs(16) }]} />
        <View style={[styles.navBlock, { gap: rs(4) }]}>
          {/* Home */}
          <Pressable
            style={[
              styles.navItem,
              { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10) },
              pathname === "/main-dashboard" && [styles.navItemActive, { borderLeftWidth: rs(4) }],
              pressedItem === "/main-dashboard" && pathname !== "/main-dashboard" && styles.navItemHover,
            ]}
            onPress={() => router.push("/main-dashboard")}
            onPressIn={() => setPressedItem("/main-dashboard")}
            onPressOut={() => setPressedItem(null)}
          >
            <Ionicons
              name="home-outline"
              size={rs(22)}
              color={pathname === "/main-dashboard" ? Theme.colors.primaryDark : Theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.navLabel,
                { fontSize: rs(15) },
                pathname === "/main-dashboard" && styles.navLabelActive,
              ]}
            >
              Panou principal
            </Text>
          </Pressable>
          <View style={[styles.sidebarDivider, { marginVertical: rs(16) }]} />
          <Text style={[styles.sidebarSectionTitle, { fontSize: rs(12), marginBottom: rs(12) }]}>Arie Terapeutică</Text>
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
              { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10) },
              !selectedChildId && { opacity: 0.4 },
              visualSkillsIsActive && [styles.navItemActive, { borderLeftWidth: rs(4) }],
              visualSkillsIsHover && !visualSkillsIsActive && styles.navItemHover,
            ]}
          >
            <Ionicons
              name="shapes-outline"
              size={rs(22)}
              color={Colors.textPrimary}
            />
            <Text
              style={[
                styles.navLabel,
                { fontSize: rs(15) },
                visualSkillsIsActive && styles.navLabelActive,
              ]}
            >
              Discriminare vizuală
            </Text>
          </TouchableOpacity>
          {/* Receptive Language – disabled when no child selected */}
          <TouchableOpacity
            disabled={!selectedChildId}
            onPress={() => {
              if (!selectedChildId) return;
              router.push("/receptive-language");
            }}
            onPressIn={() => selectedChildId && setPressedItem(receptiveLanguageHref)}
            onPressOut={() => setPressedItem(null)}
            style={[
              styles.navItem,
              { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10) },
              !selectedChildId && { opacity: 0.4 },
              receptiveLanguageIsActive && [styles.navItemActive, { borderLeftWidth: rs(4) }],
              receptiveLanguageIsHover && !receptiveLanguageIsActive && styles.navItemHover,
            ]}
          >
            <Ionicons
              name="ear-outline"
              size={rs(22)}
              color={Colors.textPrimary}
            />
            <Text
              style={[
                styles.navLabel,
                { fontSize: rs(15) },
                receptiveLanguageIsActive && styles.navLabelActive,
              ]}
            >
              Limbaj receptiv
            </Text>
          </TouchableOpacity>
          {/* Reading – disabled when no child selected */}
          <TouchableOpacity
            disabled={!selectedChildId}
            onPress={() => {
              if (!selectedChildId) return;
              router.push("/reading");
            }}
            onPressIn={() => selectedChildId && setPressedItem(readingHref)}
            onPressOut={() => setPressedItem(null)}
            style={[
              styles.navItem,
              { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10) },
              !selectedChildId && { opacity: 0.4 },
              readingIsActive && [styles.navItemActive, { borderLeftWidth: rs(4) }],
              readingIsHover && !readingIsActive && styles.navItemHover,
            ]}
          >
            <Ionicons
              name="book-outline"
              size={rs(22)}
              color={Colors.textPrimary}
            />
            <Text
              style={[
                styles.navLabel,
                { fontSize: rs(15) },
                readingIsActive && styles.navLabelActive,
              ]}
            >
              Citire
            </Text>
          </TouchableOpacity>
          {disabledNavItems.map((label) => (
            <View key={label} style={[styles.navItem, styles.navItemDisabled, { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10) }]}>
              <Ionicons name="ellipse-outline" size={rs(22)} color={Theme.colors.textSecondary} />
              <Text style={[styles.navLabelMuted, { fontSize: rs(15) }]}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.footerWrap, { gap: rs(4), paddingTop: rs(16) }]}>
        <View style={[styles.separator, { marginBottom: rs(12) }]} />
        {Platform.OS === "web" && canInstall && (
          <Pressable
            style={[styles.navItem, styles.installItem, { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10), minHeight: TouchTarget.minSize }]}
            onPress={installPWA}
          >
            <Ionicons name="download-outline" size={rs(22)} color={Theme.colors.primary} />
            <Text style={[styles.navLabel, { fontSize: rs(15), color: Theme.colors.primary }]}>Instalare aplicație</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.navItem, { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10) }]}
          onPress={() => router.push("/privacy-policy")}
        >
          <Ionicons name="shield-outline" size={rs(22)} color={Theme.colors.textSecondary} />
          <Text style={[styles.navLabel, { fontSize: rs(15) }]}>Confidențialitate</Text>
        </Pressable>
        <Pressable
          style={[styles.navItem, { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10) }]}
          onPress={() => router.push("/account-edit")}
        >
          <Ionicons name="settings-outline" size={rs(22)} color={Theme.colors.textSecondary} />
          <Text style={[styles.navLabel, { fontSize: rs(15) }]}>Setări</Text>
        </Pressable>
        <Pressable style={[styles.navItem, styles.logoutItem, { gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(10), marginTop: rs(4) }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={rs(22)} color={Theme.colors.textSecondary} />
          <Text style={[styles.navLabel, { fontSize: rs(15) }]}>Ieșire</Text>
        </Pressable>
      </View>
        </ScrollView>
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
    overflow: "hidden",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: Theme.colors.sidebarBorder,
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
    minHeight: TouchTarget.minSize,
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
  installItem: {
    backgroundColor: Theme.colors.activeBg,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
});
