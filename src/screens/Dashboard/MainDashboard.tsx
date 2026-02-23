import PrimaryButton from "@/components/ui/PrimaryButton";
import { Spacing } from "@/design/spacing";
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
import { useEffect, useRef, useState } from "react";
import {
  Alert,
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
const DROPDOWN_WIDTH = 220;

export default function MainDashboard() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [children, setChildren] = useState<ChildDoc[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const triggerRef = useRef<View>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [dataExportModalVisible, setDataExportModalVisible] = useState(false);
  const [dataExportJson, setDataExportJson] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

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

  const openAddModal = () => {
    setForm(defaultForm);
    setModalMode("add");
    setEditingId(null);
    setModalVisible(true);
    setDropdownVisible(false);
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
    setDropdownVisible(false);
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
    if (!name) {
      Alert.alert("Eroare", "Numele este obligatoriu.");
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
          birthDate: form.birthDate.trim(),
          notes: form.notes.trim(),
          userId: uid,
          createdAt: serverTimestamp(),
        });
        setSelectedChildId(ref.id);
      } else if (editingId) {
        await updateDoc(doc(db, "children", editingId), {
          name,
          birthDate: form.birthDate.trim(),
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
              setDropdownVisible(false);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Ștergere eșuată.";
              Alert.alert("Eroare", message);
            }
          },
        },
      ]
    );
  };

  const handleAdminDashboard = () => {
    router.push("/admin-dashboard");
  };

  const handleSessionDashboard = () => {
    if (!selectedChildId) {
      Alert.alert("Eroare", "Selectează un copil.");
      return;
    }
    router.push({ pathname: "/session", params: { childId: selectedChildId } });
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TopBar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>ABA Professional</Text>
          <View style={styles.topBarRight}>
            <Pressable style={styles.iconButtonTopBar} onPress={openSettings}>
              <Ionicons name="settings-outline" size={24} color="#F1F5F9" />
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#F1F5F9" />
            </Pressable>
          </View>
        </View>

        {/* Child Control Panel */}
        <View style={styles.childPanel}>
          <Text style={styles.panelLabel}>Copil activ</Text>
          <Pressable
            ref={triggerRef}
            style={styles.dropdownTrigger}
            onPress={() => {
              triggerRef.current?.measureInWindow((x, y, width, height) => {
                setDropdownLayout({ x, y, width, height });
                setDropdownVisible(true);
              });
            }}
          >
            <Text style={styles.dropdownTriggerText} numberOfLines={1}>
              {selectedChild?.name ?? "Selectează copil"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </Pressable>
          <View style={styles.iconRow}>
            <Pressable
              style={[styles.iconButton, !selectedChild && styles.iconButtonDisabled]}
              onPress={openEditModal}
              disabled={!selectedChild}
            >
              <Ionicons
                name="pencil"
                size={20}
                color={selectedChild ? "#3B82F6" : "#94A3B8"}
              />
            </Pressable>
            <Pressable
              style={[styles.iconButton, !selectedChild && styles.iconButtonDisabled]}
              onPress={handleDeleteChild}
              disabled={!selectedChild}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={selectedChild ? "#EF4444" : "#94A3B8"}
              />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={openAddModal}>
              <Ionicons name="add-circle" size={20} color="#3B82F6" />
            </Pressable>
          </View>
        </View>

        {/* Primary Action Section */}
        <View style={styles.primarySection}>
          <Pressable
            style={styles.sessionButton}
            onPress={handleSessionDashboard}
          >
            <Text style={styles.sessionButtonText}>Începe sesiunea</Text>
          </Pressable>
        </View>

        {/* Secondary Action */}
        <View style={styles.secondarySection}>
          <Pressable style={styles.adminButton} onPress={handleAdminDashboard}>
            <Text style={styles.adminButtonText}>Admin Dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Child dropdown: screen-level overlay */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        {dropdownVisible && (
          <>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setDropdownVisible(false)}
            />
            <View
              style={[
                styles.dropdownPanel,
                {
                  left: dropdownLayout.x,
                  top: dropdownLayout.y + dropdownLayout.height + 4,
                  width: DROPDOWN_WIDTH,
                },
              ]}
            >
              <FlatList
                data={children}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      item.id === selectedChildId && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedChildId(item.id);
                      setDropdownVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownItemText} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        )}
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
            <TextInput
              style={styles.input}
              placeholder="Data nașterii (ex. 2020-01-15)"
              placeholderTextColor="#94A3B8"
              value={form.birthDate}
              onChangeText={(t) => setForm((f) => ({ ...f, birthDate: t }))}
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
    backgroundColor: "#0F172A",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 24,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButtonTopBar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  childPanel: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    maxWidth: 220,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: "#F1F5F9",
    flex: 1,
    textAlign: "center",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
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
  primarySection: {
    marginHorizontal: 24,
    marginTop: 32,
    alignItems: "center",
  },
  sessionButton: {
    width: "100%",
    maxWidth: 320,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondarySection: {
    marginHorizontal: 24,
    marginTop: 32,
    alignItems: "center",
  },
  adminButton: {
    width: "100%",
    maxWidth: 320,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  adminButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F1F5F9",
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
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#F1F5F9",
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 80,
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
  dropdownPanel: {
    position: "absolute",
    width: DROPDOWN_WIDTH,
    maxHeight: 250,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    elevation: 10,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#F1F5F9",
  },
  dropdownItemSelected: {
    backgroundColor: "#334155",
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
