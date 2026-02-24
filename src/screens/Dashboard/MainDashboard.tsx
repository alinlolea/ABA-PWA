import { OBJECTIVES } from "@/config/objectives";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { Spacing } from "@/design/spacing";
import { Theme } from "@/design/theme";
import { auth, db } from "@/services/firebaseConfig";
import { deleteUser, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
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
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaskInput from "react-native-mask-input";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type ChildDoc = {
  id: string;
  name: string;
  birthDate: string;
  notes: string;
  userId: string;
  createdAt: unknown;
};

const defaultForm = { name: "", birthDate: "", notes: "" };
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
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<"name" | "age" | "progress">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [childSearchQuery, setChildSearchQuery] = useState("");

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

  const screenWidth = Dimensions.get("window").width;
  const isNarrow = screenWidth < 900;
  const selectedObjective = OBJECTIVES.find((o) => o.id === selectedObjectiveId) ?? null;

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
        };
      });
      setChildren(list);
      setSelectedChildId((current) =>
        current && list.some((c) => c.id === current) ? current : null
      );
    });
    return () => unsubscribe();
  }, [uid]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  useEffect(() => {
    if (!selectedChildId) return;
    setSelectedObjectiveId(null);
    // Objectives and progress cards depend on selectedChildId; progress remains placeholder for now.
  }, [selectedChildId]);

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
    });
    setModalMode("edit");
    setEditingId(child.id);
    setModalVisible(true);
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
        });
        setSelectedChildId(ref.id);
      } else if (editingId) {
        await updateDoc(doc(db, "children", editingId), {
          name,
          birthDate,
          notes: form.notes.trim(),
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
    router.push({ pathname: "/session", params: { childId: selectedChildId } });
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
          <FlatList
            data={[]}
            keyExtractor={() => "static"}
            renderItem={() => null}
            ListHeaderComponent={
              <View style={styles.contentWrapper}>
                <View style={styles.addChildButtonRow}>
                  <Pressable style={styles.addChildButton} onPress={openAddModal}>
                    <Text style={styles.addChildButtonText}>Adaugă copil</Text>
                  </Pressable>
                </View>

                {/* 1. Full-width Children card (sortable table) */}
                <View style={styles.childrenCard}>
                  <View style={styles.childrenCardHeader}>
                    <Text style={styles.childrenCardTitle}>Copii</Text>
                    <TextInput
                      style={styles.childrenSearchInput}
                      placeholder="Caută copil..."
                      placeholderTextColor="#94A3B8"
                      value={childSearchQuery}
                      onChangeText={setChildSearchQuery}
                    />
                  </View>
                  <View style={styles.tableHeaderRow}>
                    <Pressable style={styles.tableHeaderCellName} onPress={() => handleSort("name")}>
                      <Text style={styles.tableHeaderText}>Nume</Text>
                      {sortField === "name" && (
                        <Text style={styles.tableSortIcon}>{sortDirection === "asc" ? "↑" : "↓"}</Text>
                      )}
                    </Pressable>
                    <Pressable style={styles.tableHeaderCell} onPress={() => handleSort("age")}>
                      <Text style={styles.tableHeaderText}>Vârstă</Text>
                      {sortField === "age" && (
                        <Text style={styles.tableSortIcon}>{sortDirection === "asc" ? "↑" : "↓"}</Text>
                      )}
                    </Pressable>
                    <Pressable style={styles.tableHeaderCell} onPress={() => handleSort("progress")}>
                      <Text style={styles.tableHeaderText}>Progres total</Text>
                      {sortField === "progress" && (
                        <Text style={styles.tableSortIcon}>{sortDirection === "asc" ? "↑" : "↓"}</Text>
                      )}
                    </Pressable>
                    <View style={styles.tableHeaderCellActions} />
                  </View>
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.columnScrollContent}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    overScrollMode="never"
                  >
                    {filteredAndSortedChildren.map((child) => {
                      const isSelected = selectedChildId === child.id;
                      const isHovered = hoveredRowId === child.id;
                      return (
                        <Pressable
                          key={child.id}
                          style={[
                            styles.tableRow,
                            isSelected && styles.tableRowSelected,
                            isHovered && !isSelected && styles.tableRowHover,
                          ]}
                          onPress={() => setSelectedChildId(child.id)}
                          onPressIn={() => setHoveredRowId(child.id)}
                          onPressOut={() => setHoveredRowId(null)}
                        >
                          <View style={styles.tableCellName}>
                            <Text style={styles.tableCellText} numberOfLines={1}>{child.name || "—"}</Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={styles.tableCellText}>{calculateAge(child.birthDate)}</Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={styles.tableCellText}>0%</Text>
                          </View>
                          <View style={styles.tableCellActions}>
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
                  </ScrollView>
                </View>

                {/* 2. Middle row: Objectives (left) + Progress (right) – fixed height, internal scroll */}
                <View style={[styles.middleRow, isNarrow && styles.middleRowStacked]}>
                  <View style={[styles.middleCard, styles.verticalCard]}>
                    <Text style={styles.columnTitle}>Obiective</Text>
                    <ScrollView
                      style={styles.columnScroll}
                      contentContainerStyle={{ paddingBottom: 16 }}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {selectedChild ? (
                        <>
                          {OBJECTIVES.map((obj) => {
                            const isSelected = selectedObjectiveId === obj.id;
                            return (
                              <Pressable
                                key={obj.id}
                                style={[styles.objectiveRow, isSelected && styles.objectiveRowSelected]}
                                onPress={() => setSelectedObjectiveId(obj.id)}
                              >
                                <Text
                                  style={[
                                    styles.objectiveRowText,
                                    isSelected && styles.objectiveRowTextSelected,
                                  ]}
                                  numberOfLines={2}
                                >
                                  {obj.id}. {obj.title}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </>
                      ) : (
                        <Text style={styles.columnPlaceholder}>Selectează un copil</Text>
                      )}
                    </ScrollView>
                  </View>
                  <View style={[styles.middleCard, styles.verticalCard]}>
                    <Text style={styles.columnTitle}>Progres pe categorii</Text>
                    <ScrollView
                      style={styles.columnScroll}
                      contentContainerStyle={{ paddingBottom: 16 }}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {selectedObjective ? (
                        <>
                          {selectedObjective.categories.map((cat) => (
                            <View key={cat.id} style={styles.categoryProgressRow}>
                              <Text style={styles.categoryProgressName}>{cat.label}</Text>
                              <View style={styles.progressBarBg}>
                                <View style={styles.progressBarPlaceholder} />
                              </View>
                              <Text style={styles.progressPlaceholderText}>Progres în calcul...</Text>
                            </View>
                          ))}
                        </>
                      ) : (
                        <Text style={styles.columnPlaceholder}>Selectează un obiectiv</Text>
                      )}
                    </ScrollView>
                  </View>
                </View>

                {/* 3. Stats row: 4 square cards at bottom */}
                <View style={styles.statsRow}>
                  <View style={styles.statCard} />
                  <View style={styles.statCard} />
                  <View style={styles.statCard} />
                  <View style={styles.statCard} />
                </View>
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dashboardScrollContent}
            style={styles.dashboardScroll}
          />

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
              <Text style={styles.floatingButtonText}>Începe sesiunea</Text>
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
            <Text style={styles.modalTitle}>
              {modalMode === "add" ? "Adaugă copil" : "Editează copil"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nume *"
              placeholderTextColor="#94A3B8"
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            />
            <MaskInput
              value={form.birthDate}
              onChangeText={(masked) => setForm((f) => ({ ...f, birthDate: masked }))}
              mask={DATE_MASK}
              keyboardType="numeric"
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Note (opțional)"
              placeholderTextColor="#94A3B8"
              value={form.notes}
              onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <PrimaryButton title="Salvează" onPress={handleSaveChild} />
              <View style={styles.spacer} />
              <Pressable style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelText}>Anulează</Text>
              </Pressable>
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
    overflow: "hidden",
    padding: 20,
    marginBottom: 24,
  },
  childrenCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tableHeaderCellName: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tableHeaderCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tableHeaderCellActions: {
    width: 80,
  },
  tableHeaderText: {
    fontWeight: "600",
    fontSize: 14,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
  },
  tableSortIcon: {
    fontSize: 12,
    color: Theme.colors.primary,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableRowHover: {
    backgroundColor: "rgba(44, 100, 104, 0.05)",
  },
  tableRowSelected: {
    backgroundColor: "rgba(44, 100, 104, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#2C6468",
  },
  tableCellName: {
    flex: 2,
    justifyContent: "center",
  },
  tableCell: {
    flex: 1,
    justifyContent: "center",
  },
  tableCellActions: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
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
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.textPrimary,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: Theme.colors.textPrimary,
    marginBottom: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 15,
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
