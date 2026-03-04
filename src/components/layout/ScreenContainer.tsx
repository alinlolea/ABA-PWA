import { Colors } from "@/design/colors";
import { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

type Props = {
  children: ReactNode;
};

export default function ScreenContainer({ children }: Props) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    width: "100%",
    ...(Platform.OS === "web"
      ? { height: "100%", minHeight: "100vh", overflow: "hidden" as const }
      : {}),
  },
});