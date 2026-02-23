import ScreenContainer from "@/components/layout/ScreenContainer";
import { Colors } from "@/design/colors";
import { Typography } from "@/design/typography";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Secțiune în dezvoltare.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
});
