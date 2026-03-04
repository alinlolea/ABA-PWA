import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { Spacing } from "@/design/spacing";
import { Theme } from "@/design/theme";
import { TouchTarget } from "@/design/touch";
import { useResponsive } from "@/utils/responsive";
import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { deleteUser, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaskInput from "react-native-mask-input";
import { SafeAreaView } from "react-native-safe-area-context";

type ChildDoc = {
  id: string;
  name: string;
  birthDate: string;
  notes: string;
  userId: string;
  createdAt: unknown;
  lastSessionAt?: unknown;
  voiceEnabled?: boolean;
};

const defaultForm = { name: "", birthDate: "", notes: "", voiceEnabled: true };
const DATE_FORMAT_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DATE_MASK = [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/];

function validateBirthDate(birthDate: string): boolean {
  if (!birthDate || birthDate.length !== 10) return false;
  if (!DATE_FORMAT_REGEX.test(birthDate)) return false;
  const [dayStr, monthStr, yearStr] = birthDate.split("/");
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  const currentYear = new Date().getFullYear();
  if (year < 2000 || year > currentYear) return false;
  return true;
}

/** Compute age in years from date of birth. Supports DD/MM/YYYY and ISO-style strings. */
function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth?.trim()) return 0;
  const s = dateOfBirth.trim();
  let d: Date;
  if (DATE_FORMAT_REGEX.test(s)) {
    const [day, month, year] = s.split("/").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(s);
  }
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age -= 1;
  return Math.max(0, age);
}

function formatTimestamp(ts: unknown): string {
  if (ts == null) return "—";
  const d = typeof (ts as { toDate?: () => Date }).toDate === "function"
    ? (ts as { toDate: () => Date }).toDate()
    : ts instanceof Date
      ? ts
      : new Date(ts as string | number);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function MainDashboard() {
  const router = useRouter();
  const { rs } = useResponsive();
  const uid = auth.currentUser?.uid;
  const { setSelectedChildId: setGlobalSelectedChildId } = useContext(SelectedChildContext);

  const [children, setChildren] = useState<ChildDoc[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    setGlobalSelectedChildId(selectedChildId ?? null);
  }, [selectedChildId, setGlobalSelectedChildId]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [dataExportModalVisible, setDataExportModalVisible] = useState(false);
  const [dataExportJson, setDataExportJson] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [sortField, setSortField] = useState<"name" | "age" | "progress">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [childSearchQuery, setChildSearchQuery] = useState("");
  const selectionAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: Theme.colors.background },
        mainContainer: { flex: 1 },
        dashboardScrollWrapper: { flex: 1 },
        dashboardScroll: { flex: 1 },
        dashboardScrollContent: { padding: rs(24), paddingBottom: rs(140) },
        contentWrapper: { padding: 0 },
        addChildButtonRow: { alignItems: "flex-end" as const, marginBottom: rs(16) },
        addChildButton: {
          backgroundColor: "#2C6468",
          paddingVertical: rs(10),
          paddingHorizontal: rs(16),
          borderRadius: rs(8),
          minHeight: TouchTarget.minSize,
          justifyContent: "center",
        },
        addChildButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: rs(15) },
        childrenCardFullWidth: {
          width: "100%",
          marginBottom: rs(24),
          maxHeight: 320,
          overflow: "hidden",
          backgroundColor: Theme.colors.card,
          borderRadius: rs(16),
          padding: rs(20),
        },
        childrenCard: {
          width: "100%",
          flex: 1,
          minHeight: 340,
          borderRadius: rs(16),
          backgroundColor: "#FFFFFF",
          marginBottom: rs(24),
          position: "relative" as const,
          overflow: "hidden",
        },
        childrenCardContent: { padding: rs(20), flex: 1 },
        childrenCardHeader: {
          flexDirection: "row" as const,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: rs(16),
          paddingHorizontal: rs(16),
        },
        childrenCardTitle: {
          fontSize: rs(Theme.typography.title.fontSize),
          fontWeight: Theme.typography.title.fontWeight,
          color: Theme.colors.textPrimary,
          fontFamily: Theme.fontFamily.semiBold,
        },
        searchWrapper: { position: "relative" as const, width: rs(240), height: rs(36), justifyContent: "center" },
        searchBar: {
          flex: 1,
          height: rs(36),
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: rs(10),
          paddingHorizontal: rs(12),
          fontSize: rs(14),
          color: Theme.colors.textPrimary,
        },
        clearButton: { position: "absolute" as const, right: rs(8), height: rs(36), justifyContent: "center", alignItems: "center" },
        clearButtonText: { fontSize: rs(18), color: "#94A3B8", fontWeight: "600" },
        noResultsContainer: { paddingVertical: rs(32), alignItems: "center", justifyContent: "center" },
        noResultsText: { fontSize: rs(14), color: "#64748B" },
        statsRowNew: { flexDirection: "row" as const, gap: rs(24) },
        premiumCard: {
          flex: 1,
          backgroundColor: "#FFFFFF",
          borderRadius: rs(16),
          borderWidth: 1,
          borderColor: "#EEF2F4",
          position: "relative" as const,
          overflow: "hidden",
        },
        cardContent: { padding: rs(24) },
        premiumCardTitle: { fontSize: rs(12), fontWeight: "600", letterSpacing: 1, color: "#64748B", marginBottom: rs(20) },
        metricValue: { fontSize: rs(26), fontWeight: "600", color: Theme.colors.textPrimary },
        metricValueAccent: { fontSize: rs(26), fontWeight: "600", color: Theme.colors.primary },
        metricValuePositive: { fontSize: rs(26), fontWeight: "600", color: "#16A34A" },
        metricLabel: { fontSize: rs(11), color: "#64748B", textAlign: "center" as const, marginTop: rs(6), textTransform: "uppercase" as const, letterSpacing: 0.5 },
        metricDivider: { width: 1, height: rs(40), backgroundColor: "#E2E8F0" },
        tableHeaderRow: {
          flexDirection: "row" as const,
          alignItems: "center",
          height: rs(48),
          paddingHorizontal: rs(16),
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
        },
        nameColumn: { flex: 1 },
        ageColumn: { width: rs(100) },
        dateAddedColumn: { width: rs(130) },
        lastSessionColumn: { width: rs(140) },
        cellContainer: { justifyContent: "center" },
        nameColumnAlign: { alignItems: "flex-start" as const },
        centerColumnAlign: { alignItems: "center" },
        endColumnAlign: { alignItems: "flex-end" as const },
        actionsColumn: { width: rs(110), flexDirection: "row" as const, justifyContent: "center", alignItems: "center" },
        actionsColumnHeader: { width: rs(110), flexDirection: "row" as const, justifyContent: "center" },
        tableHeaderText: { fontWeight: "600", fontSize: rs(14), lineHeight: rs(20), color: Theme.colors.textPrimary, fontFamily: Theme.fontFamily.semiBold },
        childRow: {
          flexDirection: "row" as const,
          alignItems: "center",
          height: rs(48),
          paddingHorizontal: rs(16),
          borderRadius: rs(12),
          marginBottom: rs(6),
          position: "relative" as const,
          overflow: "hidden",
        },
        selectionScrollContent: { position: "relative" as const },
        animatedSelectionBar: { position: "absolute" as const, left: 0, width: 4, height: rs(48), backgroundColor: Theme.colors.primary, borderRadius: rs(2) },
        childRowPressed: { backgroundColor: "rgba(44,100,104,0.08)" },
        childRowSelected: { backgroundColor: "rgba(44,100,104,0.12)" },
        tableRowIconButton: { width: rs(36), height: rs(36), alignItems: "center", justifyContent: "center", borderRadius: rs(8) },
        tableCellText: { fontSize: rs(Theme.typography.body.fontSize), lineHeight: rs(20), color: Theme.colors.textPrimary, fontFamily: Theme.fontFamily.regular },
        floatingButtonContainer: { position: "absolute" as const, bottom: rs(32), left: 0, right: 0, alignItems: "center" },
        floatingButton: { backgroundColor: "#2C6468", paddingVertical: rs(14), paddingHorizontal: rs(40), borderRadius: rs(14), alignItems: "center", justifyContent: "center", minHeight: TouchTarget.minSize },
        floatingButtonDisabled: { opacity: 0.5 },
        floatingButtonText: { fontSize: rs(Theme.typography.body.fontSize), fontWeight: "600", color: "#FFFFFF", fontFamily: Theme.fontFamily.semiBold },
        modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: Spacing.xl },
        modalBox: {
          width: "100%",
          maxWidth: 420,
          backgroundColor: "#FFFFFF",
          borderRadius: rs(16),
          padding: rs(28),
          borderWidth: 1,
          borderColor: "#EEF2F4",
          position: "relative" as const,
        },
        modalTitle: { fontSize: rs(18), fontWeight: "600", color: Theme.colors.textPrimary, marginBottom: rs(24) },
        fieldLabel: { fontSize: rs(12), fontWeight: "600", letterSpacing: 0.5, color: "#64748B", textTransform: "uppercase" as const, marginBottom: rs(6), marginTop: rs(12) },
        input: {
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: rs(12),
          paddingVertical: rs(12),
          paddingHorizontal: rs(14),
          fontSize: rs(15),
          color: Theme.colors.textPrimary,
          backgroundColor: "#F9FBFC",
        },
        notesInput: { height: rs(80), textAlignVertical: "top" as const },
        voiceToggleRow: { flexDirection: "row" as const, alignItems: "center", justifyContent: "space-between", marginTop: rs(16) },
        modalButtons: { flexDirection: "row" as const, justifyContent: "flex-end", marginTop: rs(28) },
        saveButton: { backgroundColor: Theme.colors.primary, paddingVertical: rs(12), paddingHorizontal: rs(24), borderRadius: rs(12) },
        saveButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: rs(14) },
        cancelButton: { paddingVertical: rs(12), paddingHorizontal: rs(20), marginRight: rs(12) },
        cancelText: { fontSize: rs(14), color: "#94A3B8" },
        settingsModalBox: {
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#1E293B",
          borderRadius: rs(16),
          padding: rs(24),
          borderWidth: 1,
          borderColor: "#334155",
          marginTop: "auto",
          marginBottom: 0,
        },
        settingsModalTitle: { fontSize: rs(20), fontWeight: "600", color: "#F1F5F9", marginBottom: rs(20) },
        settingsRow: {
          flexDirection: "row" as const,
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: rs(14),
          paddingHorizontal: rs(4),
          borderBottomWidth: 1,
          borderBottomColor: "#334155",
        },
        settingsRowText: { fontSize: rs(16), color: "#F1F5F9" },
        settingsRowDestructive: { borderBottomWidth: 0, marginTop: rs(8) },
        settingsRowTextDestructive: { fontSize: rs(16), color: "#EF4444", fontWeight: "500" },
        settingsCancelButton: { marginTop: rs(20), paddingVertical: rs(14), alignItems: "center" },
        dataExportModalBox: {
          width: "100%",
          maxWidth: 400,
          maxHeight: "80%",
          backgroundColor: "#1E293B",
          borderRadius: rs(16),
          padding: rs(24),
          borderWidth: 1,
          borderColor: "#334155",
        },
        dataExportScroll: { maxHeight: rs(400) },
        dataExportScrollContent: { paddingVertical: rs(12) },
        dataExportJson: { fontFamily: "monospace", fontSize: rs(12), color: "#94A3B8" },
        cardAccentWrapper: { position: "absolute" as const, top: 0, left: 0, right: 0, height: 2, overflow: "hidden", borderTopLeftRadius: rs(16), borderTopRightRadius: rs(16) },
        cardAccentLine: { flex: 1 },
        metricsRow: { flexDirection: "row" as const, alignItems: "center", justifyContent: "space-between" },
        metricBlock: { flex: 1, alignItems: "center" },
        columnScroll: { flex: 1 },
        columnScrollContent: { paddingBottom: rs(20) },
      }),
    [rs]
  );

  const filteredAndSortedChildren = useMemo(() => {
    let result = [...children];
    const searchQuery = childSearchQuery.trim().toLowerCase();
    if (searchQuery) {
      result = result.filter((c) =>
        (c.name || "").toLowerCase().includes(searchQuery)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      } else if (sortField === "age") {
        cmp = calculateAge(a.birthDate) - calculateAge(b.birthDate);
      } else {
        cmp = 0;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return result;
  }, [children, childSearchQuery, sortField, sortDirection]);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "children"),
      where("userId", "==", uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChildDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? "",
          birthDate: data.birthDate ?? "",
          notes: data.notes ?? "",
          userId: data.userId ?? "",
          createdAt: data.createdAt,
          lastSessionAt: data.lastSessionAt,
          voiceEnabled: data.voiceEnabled !== false,
        };
      });
      setChildren(list);
      setSelectedChildId((current) =>
        current && list.some((c) => c.id === current) ? current : null
      );
    });
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!selectedChildId) return;
    const index = filteredAndSortedChildren.findIndex(
      (c) => c.id === selectedChildId
    );
    if (index === -1) return;
    const rowHeight = rs(54); // 48 height + 6 marginBottom
    Animated.timing(selectionAnim, {
      toValue: index * rowHeight,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [selectedChildId, filteredAndSortedChildren, selectionAnim, rs]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const openAddModal = () => {
    setForm(defaultForm);
    setModalMode("add");
    setEditingId(null);
    setModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedChild) return;
    setForm({
      name: selectedChild.name,
      birthDate: selectedChild.birthDate,
      notes: selectedChild.notes,
      voiceEnabled: selectedChild.voiceEnabled !== false,
    });
    setModalMode("edit");
    setEditingId(selectedChild.id);
    setModalVisible(true);
  };

  const openEditModalForChild = (child: ChildDoc) => {
    setSelectedChildId(child.id);
    setForm({
      name: child.name,
      birthDate: child.birthDate,
      notes: child.notes,
      voiceEnabled: child.voiceEnabled !== false,
    });
    setModalMode("edit");
    setEditingId(child.id);
    setModalVisible(true);
  };

  const handleToggleVoiceFor = async (child: ChildDoc, e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    const next = child.voiceEnabled !== false ? false : true;
    setChildren((prev) =>
      prev.map((c) => (c.id === child.id ? { ...c, voiceEnabled: next } : c))
    );
    try {
      await updateDoc(doc(db, "children", child.id), { voiceEnabled: next });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nu s-a putut actualiza.";
      Alert.alert("Eroare", message);
      setChildren((prev) =>
        prev.map((c) => (c.id === child.id ? { ...c, voiceEnabled: !next } : c))
      );
    }
  };

  const handleDeleteChildFor = (child: ChildDoc) => {
    Alert.alert(
      "Șterge copil",
      `Sigur ștergi pe ${child.name}?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "children", child.id));
              if (selectedChildId === child.id) {
                setSelectedChildId(null);
              }
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Ștergere eșuată.";
              Alert.alert("Eroare", message);
            }
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      Alert.alert("Eroare", "Nu s-a putut deconecta.");
    }
  };

  const handleSaveChild = async () => {
    const name = form.name.trim();
    const birthDate = form.birthDate.trim();
    if (!name) {
      Alert.alert("Eroare", "Numele este obligatoriu.");
      return;
    }
    if (!birthDate) {
      Alert.alert("Eroare", "Data nașterii este obligatorie.");
      return;
    }
    if (!validateBirthDate(birthDate)) {
      Alert.alert(
        "Eroare",
        "Data nașterii trebuie să fie în format DD/MM/YYYY (zi 1–31, lună 1–12, an de la 2000 până în anul curent)."
      );
      return;
    }
    if (!uid) {
      Alert.alert("Eroare", "Trebuie să fii autentificat.");
      return;
    }
    try {
      if (modalMode === "add") {
        const ref = await addDoc(collection(db, "children"), {
          name,
          birthDate,
          notes: form.notes.trim(),
          userId: uid,
          createdAt: serverTimestamp(),
          lastSessionAt: null,
          voiceEnabled: form.voiceEnabled !== false,
        });
        setSelectedChildId(ref.id);
      } else if (editingId) {
        await updateDoc(doc(db, "children", editingId), {
          name,
          birthDate,
          notes: form.notes.trim(),
          voiceEnabled: form.voiceEnabled !== false,
        });
      }
      closeModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Salvare eșuată.";
      Alert.alert("Eroare", message);
    }
  };

  const handleDeleteChild = () => {
    if (!selectedChild) return;
    Alert.alert(
      "Șterge copil",
      `Sigur ștergi pe ${selectedChild.name}?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "children", selectedChild.id));
              if (selectedChildId === selectedChild.id) {
                setSelectedChildId(null);
              }
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Ștergere eșuată.";
              Alert.alert("Eroare", message);
            }
          },
        },
      ]
    );
  };

  const handleSessionDashboard = () => {
    if (!selectedChildId) {
      Alert.alert("Eroare", "Selectează un copil.");
      return;
    }
    router.push({ pathname: "/visual-skills", params: { childId: selectedChildId } });
  };

  const handleSort = (field: "name" | "age" | "progress") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const openSettings = () => setSettingsModalVisible(true);
  const closeSettings = () => setSettingsModalVisible(false);

  const handleSettingsOption = (action: string) => {
    closeSettings();
    switch (action) {
      case "gdpr":
        router.push("/gdpr");
        break;
      case "privacy":
        router.push("/privacy-policy");
        break;
      case "terms":
        router.push("/terms");
        break;
      case "account":
        router.push("/account-edit");
        break;
      case "export":
        handleExportData();
        break;
      case "delete":
        handleDeleteAccount();
        break;
    }
  };

  const handleExportData = async () => {
    if (!uid) return;
    setExportLoading(true);
    try {
      const userDocSnap = await getDoc(doc(db, "users", uid));
      const userData = userDocSnap.exists() ? userDocSnap.data() : null;

      const childrenSnap = await getDocs(
        query(collection(db, "children"), where("userId", "==", uid))
      );
      const childrenData = childrenSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      let sessionsData: unknown[] = [];
      try {
        const sessionsSnap = await getDocs(
          query(collection(db, "sessions"), where("userId", "==", uid))
        );
        sessionsData = sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        // sessions collection might not exist
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        auth: { uid: auth.currentUser?.uid, email: auth.currentUser?.email ?? null },
        user: userData,
        children: childrenData,
        sessions: sessionsData,
      };
      setDataExportJson(JSON.stringify(payload, null, 2));
      setDataExportModalVisible(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Descărcare date eșuată.";
      Alert.alert("Eroare", message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Ștergere cont",
      "Sigur doriți să ștergeți contul? Toate datele (copii, sesiuni) vor fi șterse permanent. Aceasta acțiune nu poate fi anulată.",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge cont",
          style: "destructive",
          onPress: async () => {
            if (!uid || !auth.currentUser) return;
            try {
              const userRef = doc(db, "users", uid);
              try {
                await deleteDoc(userRef);
              } catch {
                // user doc may not exist
              }
              const childrenSnap = await getDocs(
                query(collection(db, "children"), where("userId", "==", uid))
              );
              for (const d of childrenSnap.docs) {
                await deleteDoc(doc(db, "children", d.id));
              }
              try {
                const sessionsSnap = await getDocs(
                  query(collection(db, "sessions"), where("userId", "==", uid))
                );
                for (const d of sessionsSnap.docs) {
                  await deleteDoc(doc(db, "sessions", d.id));
                }
              } catch {
                // sessions may not exist
              }
              await deleteUser(auth.currentUser);
              router.replace("/login");
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Ștergere cont eșuată.";
              Alert.alert("Eroare", message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.mainContainer}>
        <View style={styles.dashboardScrollWrapper}>
          <ScrollView
            style={{ flex: 1 }}
          contentContainerStyle={styles.dashboardScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentWrapper}>
              <View style={styles.addChildButtonRow}>
                <Pressable style={styles.addChildButton} onPress={openAddModal}>
                  <Text style={styles.addChildButtonText}>Adaugă Copil</Text>
                </Pressable>
              </View>

              {/* 1. Full-width Children card (sortable table) */}
              <View style={styles.childrenCard}>
                <View style={styles.cardAccentWrapper}>
                  <LinearGradient
                    colors={[
                      "rgba(44,100,104,0)",
                      "rgba(44,100,104,0.9)",
                      "rgba(44,100,104,0.9)",
                      "rgba(44,100,104,0)",
                    ]}
                    locations={[0, 0.2, 0.8, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardAccentLine}
                  />
                </View>
                <View style={styles.childrenCardContent}>
                <View style={styles.childrenCardHeader}>
                  <Text style={styles.childrenCardTitle}>Copii în terapie</Text>
                  <View style={styles.searchWrapper}>
                    <TextInput
                      style={styles.searchBar}
                      placeholder="Caută copil"
                      placeholderTextColor="#94A3B8"
                      value={childSearchQuery}
                      onChangeText={setChildSearchQuery}
                    />
                    {childSearchQuery.length > 0 && (
                      <Pressable style={styles.clearButton} onPress={() => setChildSearchQuery("")}>
                        <Text style={styles.clearButtonText}>×</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.nameColumn, styles.cellContainer, styles.nameColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Nume</Text>
                  </View>
                  <View style={[styles.ageColumn, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Vârstă</Text>
                  </View>
                  <View style={[styles.dateAddedColumn, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Adăugat</Text>
                  </View>
                  <View style={[styles.lastSessionColumn, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Ultima sesiune</Text>
                  </View>
                  <View style={[styles.actionsColumnHeader, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Acțiuni</Text>
                  </View>
                </View>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.columnScrollContent}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  overScrollMode="never"
                >
                  <View style={styles.selectionScrollContent}>
                    {selectedChildId && filteredAndSortedChildren.length > 0 && (
                      <Animated.View
                        style={[
                          styles.animatedSelectionBar,
                          { transform: [{ translateY: selectionAnim }] },
                        ]}
                      />
                    )}
                    {filteredAndSortedChildren.length === 0 ? (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>No results found</Text>
                      </View>
                    ) : filteredAndSortedChildren.map((child) => {
                      const isSelected = selectedChildId === child.id;
                      return (
                        <Pressable
                          key={child.id}
                          style={({ pressed }) => [
                            styles.childRow,
                            pressed && styles.childRowPressed,
                            isSelected && styles.childRowSelected,
                          ]}
                          onPress={() => setSelectedChildId(child.id)}
                          onPressIn={() => setHoveredRowId(child.id)}
                          onPressOut={() => setHoveredRowId(null)}
                        >
                          <View style={[styles.nameColumn, styles.cellContainer, styles.nameColumnAlign]}>
                          <Text style={styles.tableCellText} numberOfLines={1}>{child.name || "—"}</Text>
                        </View>
                        <View style={[styles.ageColumn, styles.cellContainer, styles.centerColumnAlign]}>
                          <Text style={styles.tableCellText}>{calculateAge(child.birthDate)}</Text>
                        </View>
                        <View style={[styles.dateAddedColumn, styles.cellContainer, styles.centerColumnAlign]}>
                          <Text style={styles.tableCellText} numberOfLines={1}>
                            {formatTimestamp(child.createdAt)}
                          </Text>
                        </View>
                        <View style={[styles.lastSessionColumn, styles.cellContainer, styles.centerColumnAlign]}>
                          <Text style={styles.tableCellText} numberOfLines={1}>
                            {child.lastSessionAt ? formatTimestamp(child.lastSessionAt) : "—"}
                          </Text>
                        </View>
                        <View style={styles.actionsColumn}>
                          <Pressable
                            style={styles.tableRowIconButton}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              handleToggleVoiceFor(child, e);
                            }}
                          >
                            <Ionicons
                              name={child.voiceEnabled !== false ? "volume-high" : "volume-mute"}
                              size={rs(18)}
                              color={child.voiceEnabled !== false ? Theme.colors.primary : "#94A3B8"}
                            />
                          </Pressable>
                          <Pressable
                            style={styles.tableRowIconButton}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              openEditModalForChild(child);
                            }}
                          >
                            <Ionicons name="pencil" size={rs(18)} color={Theme.colors.primary} />
                          </Pressable>
                          <Pressable
                            style={styles.tableRowIconButton}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              handleDeleteChildFor(child);
                            }}
                          >
                            <Ionicons name="trash-outline" size={rs(18)} color="#EF4444" />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
                  </View>
                </ScrollView>
                </View>
              </View>

              {/* Stats row: 2 premium horizontal cards */}
              <View style={styles.statsRowNew}>
                {/* CONSISTENCY CARD */}
                <View style={styles.premiumCard}>
                  <View style={styles.cardAccentWrapper}>
                    <LinearGradient
                      colors={[
                        "rgba(44,100,104,0)",
                        "rgba(44,100,104,0.9)",
                        "rgba(44,100,104,0.9)",
                        "rgba(44,100,104,0)",
                      ]}
                      locations={[0, 0.2, 0.8, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cardAccentLine}
                    />
                  </View>
                  <View style={styles.cardContent}>
                  <Text style={styles.premiumCardTitle}>CONSECVENȚĂ</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>4</Text>
                      <Text style={styles.metricLabel}>sesiuni săptămâna asta</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>12</Text>
                      <Text style={styles.metricLabel}>sesiuni luna asta</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>28</Text>
                      <Text style={styles.metricLabel}>itemi masterați</Text>
                    </View>
                  </View>
                  </View>
                </View>
                {/* LEARNING SPEED CARD */}
                <View style={styles.premiumCard}>
                  <View style={styles.cardAccentWrapper}>
                    <LinearGradient
                      colors={[
                        "rgba(44,100,104,0)",
                        "rgba(44,100,104,0.9)",
                        "rgba(44,100,104,0.9)",
                        "rgba(44,100,104,0)",
                      ]}
                      locations={[0, 0.2, 0.8, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cardAccentLine}
                    />
                  </View>
                  <View style={styles.cardContent}>
                  <Text style={styles.premiumCardTitle}>VITEZĂ DE ÎNVĂȚARE</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValueAccent}>78%</Text>
                      <Text style={styles.metricLabel}>acuratețe / sesiune</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>24</Text>
                      <Text style={styles.metricLabel}>încercări pe sesiune</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValuePositive}>↑ +6%</Text>
                      <Text style={styles.metricLabel}>progres</Text>
                    </View>
                  </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Floating button — always visible */}
          <View style={styles.floatingButtonContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={[styles.floatingButton, !selectedChildId && styles.floatingButtonDisabled]}
              onPress={handleSessionDashboard}
              disabled={!selectedChildId}
              activeOpacity={0.8}
            >
              <Text style={styles.floatingButtonText}>Alege Obiectivele</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add / Edit child modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
                  colors={[
                    "rgba(255,0,0,0)",
                    "rgba(255,0,0,1)",
                    "rgba(255,0,0,1)",
                    "rgba(255,0,0,0)",
                  ]}
                  locations={[0, 0.2, 0.8, 1]}
                  style={styles.cardAccentLine}
                />
            <Text style={styles.modalTitle}>
              {modalMode === "add" ? "Adaugă copil" : "Editează copil"}
            </Text>
            <Text style={styles.fieldLabel}>Nume</Text>
            <TextInput
              style={styles.input}
              placeholder="Nume *"
              placeholderTextColor="#94A3B8"
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            />
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <MaskInput
              value={form.birthDate}
              onChangeText={(masked) => setForm((f) => ({ ...f, birthDate: masked }))}
              mask={DATE_MASK}
              keyboardType="numeric"
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Note (opțional)"
              placeholderTextColor="#94A3B8"
              value={form.notes}
              onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
              multiline
              numberOfLines={3}
            />
            <View style={styles.voiceToggleRow}>
              <Text style={styles.fieldLabel}>Voce (TTS)</Text>
              <Switch
                value={form.voiceEnabled !== false}
                onValueChange={(v) => setForm((f) => ({ ...f, voiceEnabled: v }))}
              />
            </View>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChild}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Settings modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSettings}
      >
        <Pressable style={styles.modalOverlay} onPress={closeSettings}>
          <Pressable style={styles.settingsModalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.settingsModalTitle}>Setări</Text>
            <Pressable style={styles.settingsRow} onPress={() => handleSettingsOption("gdpr")}>
              <Text style={styles.settingsRowText}>GDPR</Text>
              <Ionicons name="chevron-forward" size={rs(20)} color="#94A3B8" />
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => handleSettingsOption("privacy")}>
              <Text style={styles.settingsRowText}>Politica de Confidențialitate</Text>
              <Ionicons name="chevron-forward" size={rs(20)} color="#94A3B8" />
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => handleSettingsOption("terms")}>
              <Text style={styles.settingsRowText}>Termeni și Condiții</Text>
              <Ionicons name="chevron-forward" size={rs(20)} color="#94A3B8" />
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => handleSettingsOption("account")}>
              <Text style={styles.settingsRowText}>Editează datele contului</Text>
              <Ionicons name="chevron-forward" size={rs(20)} color="#94A3B8" />
            </Pressable>
            <Pressable
              style={styles.settingsRow}
              onPress={() => handleSettingsOption("export")}
              disabled={exportLoading}
            >
              <Text style={styles.settingsRowText}>
                {exportLoading ? "Se încarcă..." : "Descarcă datele contului"}
              </Text>
              <Ionicons name="chevron-forward" size={rs(20)} color="#94A3B8" />
            </Pressable>
            <Pressable
              style={[styles.settingsRow, styles.settingsRowDestructive]}
              onPress={() => handleSettingsOption("delete")}
            >
              <Text style={styles.settingsRowTextDestructive}>Ștergere cont</Text>
              <Ionicons name="trash-outline" size={rs(20)} color="#EF4444" />
            </Pressable>
            <Pressable style={styles.settingsCancelButton} onPress={closeSettings}>
              <Text style={styles.cancelText}>Închide</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Data export modal */}
      <Modal
        visible={dataExportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDataExportModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDataExportModalVisible(false)}
        >
          <Pressable style={styles.dataExportModalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Datele contului</Text>
            <ScrollView
              style={styles.dataExportScroll}
              contentContainerStyle={styles.dataExportScrollContent}
            >
              <Text style={styles.dataExportJson}>{dataExportJson}</Text>
            </ScrollView>
            <Pressable
              style={styles.settingsCancelButton}
              onPress={() => setDataExportModalVisible(false)}
            >
              <Text style={styles.cancelText}>Închide</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}