import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </Pressable>
        <Text style={styles.title}>Termeni și Condiții</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.placeholder}>
          Termeni și condiții de utilizare a aplicației ABA Professional. Acești termeni reglementează drepturile și obligațiile utilizatorilor.
        </Text>
        <Text style={styles.paragraph}>
          Conținutul complet al termenilor și condițiilor va fi afișat aici.
        </Text>
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
  placeholder: { fontSize: 15, color: "#F1F5F9", lineHeight: 24, marginBottom: 16 },
  paragraph: { fontSize: 14, color: "#94A3B8", lineHeight: 22 },
});
