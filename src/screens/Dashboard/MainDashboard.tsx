import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { Spacing } from "@/design/spacing";
import { Theme } from "@/design/theme";
import { auth, db } from "@/services/firebaseConfig";
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
    const rowHeight = 54; // 48 height + 6 marginBottom
    Animated.timing(selectionAnim, {
      toValue: index * rowHeight,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [selectedChildId, filteredAndSortedChildren, selectionAnim]);

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
      "Sigur doriți să ștergeți contul? Toate datele (copii, sesiuni) vor fi șterse permanent. Această acțiune nu poate fi anulată.",
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
          <View style={[styles.dashboardScrollContent, { flex: 1 }]}>
            <View style={styles.contentWrapper}>
              <View style={styles.addChildButtonRow}>
                <Pressable style={styles.addChildButton} onPress={openAddModal}>
                  <Text style={styles.addChildButtonText}>Add Child</Text>
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
                  <Text style={styles.childrenCardTitle}>Children in Therapy</Text>
                  <View style={styles.searchWrapper}>
                    <TextInput
                      style={styles.searchBar}
                      placeholder="Search child..."
                      placeholderTextColor="#94A3B8"
                      value={childSearchQuery}
                      onChangeText={setChildSearchQuery}
                    />
                    {childSearchQuery.length > 0 && (
                      <Pressable
                        style={styles.clearButton}
                        onPress={() => setChildSearchQuery("")}
                      >
                        <Text style={styles.clearButtonText}>×</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.nameColumn, styles.cellContainer, styles.nameColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Name</Text>
                  </View>
                  <View style={[styles.ageColumn, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Age</Text>
                  </View>
                  <View style={[styles.dateAddedColumn, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Added</Text>
                  </View>
                  <View style={[styles.lastSessionColumn, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Last Session</Text>
                  </View>
                  <View style={[styles.actionsColumnHeader, styles.cellContainer, styles.centerColumnAlign]}>
                    <Text style={styles.tableHeaderText}>Actions</Text>
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
                              size={18}
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
                            <Ionicons name="pencil" size={18} color={Theme.colors.primary} />
                          </Pressable>
                          <Pressable
                            style={styles.tableRowIconButton}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              handleDeleteChildFor(child);
                            }}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
                  <Text style={styles.premiumCardTitle}>CONSISTENCY</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>4</Text>
                      <Text style={styles.metricLabel}>Sessions this week</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>12</Text>
                      <Text style={styles.metricLabel}>Sessions this month</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>28</Text>
                      <Text style={styles.metricLabel}>Mastered items</Text>
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
                  <Text style={styles.premiumCardTitle}>LEARNING SPEED</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValueAccent}>78%</Text>
                      <Text style={styles.metricLabel}>Avg accuracy / session</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValue}>24</Text>
                      <Text style={styles.metricLabel}>Trials per session</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricValuePositive}>↑ +6%</Text>
                      <Text style={styles.metricLabel}>Improvement trend</Text>
                    </View>
                  </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Floating button – always visible */}
          <View style={styles.floatingButtonContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={[
                styles.floatingButton,
                !selectedChildId && styles.floatingButtonDisabled,
              ]}
              onPress={handleSessionDashboard}
              disabled={!selectedChildId}
              activeOpacity={0.8}
            >
              <Text style={styles.floatingButtonText}>Choose Objectives</Text>
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
            <Text style={styles.fieldLabel}>Name</Text>
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
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => handleSettingsOption("privacy")}>
              <Text style={styles.settingsRowText}>Politica de Confidențialitate</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => handleSettingsOption("terms")}>
              <Text style={styles.settingsRowText}>Termeni și Condiții</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => handleSettingsOption("account")}>
              <Text style={styles.settingsRowText}>Editează datele contului</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>
            <Pressable
              style={styles.settingsRow}
              onPress={() => handleSettingsOption("export")}
              disabled={exportLoading}
            >
              <Text style={styles.settingsRowText}>
                {exportLoading ? "Se încarcă..." : "Descarcă datele contului"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>
            <Pressable
              style={[styles.settingsRow, styles.settingsRowDestructive]}
              onPress={() => handleSettingsOption("delete")}
            >
              <Text style={styles.settingsRowTextDestructive}>Ștergere cont</Text>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  dashboardScrollWrapper: {
    flex: 1,
  },
  dashboardScroll: {
    flex: 1,
  },
  dashboardScrollContent: {
    padding: 24,
    paddingBottom: 140,
  },
  contentWrapper: {
    padding: 0,
  },
  addChildButtonRow: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  addChildButton: {
    backgroundColor: "#2C6468",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addChildButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  childrenCardFullWidth: {
    width: "100%",
    marginBottom: 24,
    maxHeight: 320,
    overflow: "hidden",
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  childrenCard: {
    width: "100%",
    height: 340,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
  },
  childrenCardContent: {
    padding: 20,
    flex: 1,
  },
  childrenCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  childrenCardTitle: {
    fontSize: Theme.typography.title.fontSize,
    fontWeight: Theme.typography.title.fontWeight,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
  },
  childrenSearchInput: {
    width: 260,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  searchWrapper: {
    position: "relative",
    width: 240,
    height: 36,
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  clearButton: {
    position: "absolute",
    right: 8,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "600",
  },
  noResultsContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#64748B",
  },
  childrenTableScroll: {
    maxHeight: 200,
  },
  middleRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  middleRowStacked: {
    flexDirection: "column",
  },
  middleCard: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  verticalCard: {
    width: "48%",
    height: 480,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  statsRowNew: {
    flexDirection: "row",
    gap: 24,
  },
  premiumCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    position: "relative",
    overflow: "hidden",
  },
  cardAccentWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: "hidden",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardAccentLine: {
    flex: 1,
  },
  cardContent: {
    padding: 24,
  },
  premiumCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#64748B",
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricBlock: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "600",
    color: Theme.colors.textPrimary,
  },
  metricValueAccent: {
    fontSize: 26,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  metricValuePositive: {
    fontSize: 26,
    fontWeight: "600",
    color: "#16A34A",
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
  },
  columnCard: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 20,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  columnScroll: {
    flex: 1,
  },
  columnScrollContent: {
    paddingBottom: 20,
  },
  panelLabel: {
    fontSize: Theme.typography.sectionHeader.fontSize,
    fontWeight: Theme.typography.sectionHeader.fontWeight,
    color: Theme.colors.textSecondary,
    marginBottom: 10,
    textTransform: Theme.typography.sectionHeader.textTransform,
    letterSpacing: Theme.typography.sectionHeader.letterSpacing,
    fontFamily: Theme.fontFamily.medium,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  nameColumn: { flex: 1 },
  ageColumn: { width: 100 },
  dateAddedColumn: { width: 130 },
  lastSessionColumn: { width: 140 },
  cellContainer: {
    justifyContent: "center",
  },
  nameColumnAlign: {
    alignItems: "flex-start",
  },
  centerColumnAlign: {
    alignItems: "center",
  },
  endColumnAlign: {
    alignItems: "flex-end",
  },
  actionsColumn: {
    width: 110,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionsColumnHeader: {
    width: 110,
    flexDirection: "row",
    justifyContent: "center",
  },
  tableHeaderText: {
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
  },
  tableSortIcon: {
    fontSize: 12,
    color: Theme.colors.primary,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    position: "relative",
    overflow: "hidden",
  },
  selectionScrollContent: {
    position: "relative",
  },
  animatedSelectionBar: {
    position: "absolute",
    left: 0,
    width: 4,
    height: 48,
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  childRowPressed: {
    backgroundColor: "rgba(44,100,104,0.08)",
  },
  childRowSelected: {
    backgroundColor: "rgba(44,100,104,0.12)",
  },
  tableRowIconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  tableCellText: {
    fontSize: Theme.typography.body.fontSize,
    lineHeight: 20,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.regular,
  },
  columnTitle: {
    fontSize: Theme.typography.title.fontSize,
    fontWeight: Theme.typography.title.fontWeight,
    color: Theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: Theme.fontFamily.semiBold,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    maxWidth: 260,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.buttonGrey,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dropdownTriggerText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    color: Theme.colors.textPrimary,
    flex: 1,
    textAlign: "center",
    fontFamily: Theme.fontFamily.regular,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.buttonGrey,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  objectiveRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.progressBg,
  },
  objectiveRowSelected: {
    backgroundColor: Theme.colors.activeBg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  objectiveRowText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.regular,
  },
  objectiveRowTextSelected: {
    color: Theme.colors.primaryDark,
    fontWeight: "600",
    fontFamily: Theme.fontFamily.semiBold,
  },
  columnPlaceholder: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.textSecondary,
    fontStyle: "italic",
    fontFamily: Theme.fontFamily.regular,
  },
  categoryProgressRow: {
    marginBottom: 16,
  },
  categoryProgressName: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.sectionHeader.fontWeight,
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    fontFamily: Theme.fontFamily.medium,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Theme.colors.progressBg,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarPlaceholder: {
    height: "100%",
    width: "0%",
    backgroundColor: Theme.colors.progressFill,
    borderRadius: 4,
  },
  progressPlaceholderText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontStyle: "italic",
    fontFamily: Theme.fontFamily.regular,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  floatingButton: {
    backgroundColor: "#2C6468",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  floatingButtonDisabled: {
    opacity: 0.5,
  },
  floatingButtonText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Theme.fontFamily.semiBold,
  },
  bottomSection: {
    padding: 24,
    alignItems: "center",
  },
  sessionButton: {
    width: "100%",
    maxWidth: 320,
    height: 48,
    borderRadius: 12,
    backgroundColor: Theme.colors.buttonGrey,
    borderWidth: 1,
    borderColor: Theme.colors.borderButton,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionButtonHover: {
    backgroundColor: Theme.colors.buttonGreyHover,
  },
  sessionButtonDisabled: {
    opacity: 0.5,
  },
  sessionButtonText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: "600",
    color: Theme.colors.primaryDark,
    fontFamily: Theme.fontFamily.semiBold,
  },
  spacer: {
    width: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: "#EEF2F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.textPrimary,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Theme.colors.textPrimary,
    backgroundColor: "#F9FBFC",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  voiceToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 28,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  cancelText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  settingsModalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: "auto",
    marginBottom: 0,
  },
  settingsModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  settingsRowText: {
    fontSize: 16,
    color: "#F1F5F9",
  },
  settingsRowDestructive: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  settingsRowTextDestructive: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "500",
  },
  settingsCancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  dataExportModalBox: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dataExportScroll: {
    maxHeight: 400,
  },
  dataExportScrollContent: {
    paddingVertical: 12,
  },
  dataExportJson: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#94A3B8",
  },
});
