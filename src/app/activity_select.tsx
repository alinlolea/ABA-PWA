import { Colors } from "@/design/colors";
import { StyleSheet, Text, View } from "react-native";

export default function ActivitySelect() {
  return (
    <View style={styles.container}>
      <Text>Select Activity Configuration</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});