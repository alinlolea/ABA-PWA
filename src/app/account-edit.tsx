import PrimaryButton from "@/components/ui/PrimaryButton";
import { auth } from "@/config/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AccountEditScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user?.email) {
      Alert.alert("Eroare", "Nu există un utilizator autentificat.");
      return;
    }
    const trimmedNewPassword = newPassword.trim();
    const trimmedNewEmail = newEmail.trim();

    if (!trimmedNewPassword && trimmedNewEmail === user.email) {
      Alert.alert("Eroare", "Introdu o parolă nouă sau un email nou.");
      return;
    }

    if (trimmedNewPassword && trimmedNewPassword.length < 6) {
      Alert.alert("Eroare", "Parola nouă trebuie să aibă cel puțin 6 caractere.");
      return;
    }

    if (!currentPassword.trim()) {
      Alert.alert("Eroare", "Introdu parola curentă pentru a confirma.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword.trim());
      await reauthenticateWithCredential(user, credential);

      if (trimmedNewPassword) {
        await updatePassword(user, trimmedNewPassword);
      }
      if (trimmedNewEmail && trimmedNewEmail !== user.email) {
        await updateEmail(user, trimmedNewEmail);
      }

      Alert.alert("Succes", "Datele contului au fost actualizate.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Actualizare eșuată. Verifică parola curentă.";
      Alert.alert("Eroare", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </Pressable>
        <Text style={styles.title}>Editează datele contului</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Parolă curentă *</Text>
        <TextInput
          style={styles.input}
          placeholder="Parola curentă"
          placeholderTextColor="#94A3B8"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.label}>Parolă nouă</Text>
        <TextInput
          style={styles.input}
          placeholder="Min. 6 caractere (lăsați gol pentru a nu schimba)"
          placeholderTextColor="#94A3B8"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email nou (opțional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.buttons}>
          <PrimaryButton
            title={loading ? "Se salvează..." : "Salvează"}
            onPress={handleSave}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backButton: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: "600", color: "#F1F5F9" },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", color: "#94A3B8", marginBottom: 8 },
  input: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#F1F5F9",
    marginBottom: 20,
  },
  buttons: { marginTop: 8 },
});
