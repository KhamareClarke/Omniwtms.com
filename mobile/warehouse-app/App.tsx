import { useMemo } from "react";
import { SafeAreaView, ScrollView, Text, View, useColorScheme } from "react-native";

export default function App() {
  const dark = useColorScheme() === "dark";
  const styles = useMemo(
    () => ({
      bg: { backgroundColor: dark ? "#0d1020" : "#f5f7ff" },
      panel: { backgroundColor: dark ? "#171d34" : "#fff" },
      text: { color: dark ? "#f4f7ff" : "#111827" },
      sub: { color: dark ? "#c2c8df" : "#4b5563" }
    }),
    [dark]
  );
  return (
    <SafeAreaView style={[{ flex: 1 }, styles.bg]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[{ fontSize: 24, fontWeight: "700", marginBottom: 8 }, styles.text]}>OmniWTMS Warehouse</Text>
        <View style={[{ borderRadius: 12, padding: 14, marginBottom: 12 }, styles.panel]}>
          <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Core flow</Text>
          {[
            "Login",
            "View orders to pick",
            "Barcode scan SKUs",
            "Mark items picked",
            "Group into shipments",
            "Print labels",
            "Pack items",
            "Mark ready"
          ].map((s) => (
            <Text key={s} style={[{ marginBottom: 4 }, styles.sub]}>
              - {s}
            </Text>
          ))}
        </View>
        <View style={[{ borderRadius: 12, padding: 14 }, styles.panel]}>
          <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Platform capabilities</Text>
          {["Offline mode (SQLite sync queue)", "Push notifications", "Camera access", "Biometric login", "Dark mode", "Multi-language"]
            .map((s) => (
              <Text key={s} style={[{ marginBottom: 4 }, styles.sub]}>
                - {s}
              </Text>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
