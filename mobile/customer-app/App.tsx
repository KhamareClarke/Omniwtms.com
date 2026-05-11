import { useMemo } from "react";
import { SafeAreaView, ScrollView, Text, View, useColorScheme } from "react-native";

export default function App() {
  const dark = useColorScheme() === "dark";
  const styles = useMemo(
    () => ({
      bg: { backgroundColor: dark ? "#0f1225" : "#f6f8ff" },
      panel: { backgroundColor: dark ? "#1b2240" : "#fff" },
      text: { color: dark ? "#f5f8ff" : "#111827" },
      sub: { color: dark ? "#c3cae5" : "#4b5563" }
    }),
    [dark]
  );
  return (
    <SafeAreaView style={[{ flex: 1 }, styles.bg]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[{ fontSize: 24, fontWeight: "700", marginBottom: 8 }, styles.text]}>OmniWTMS Customer</Text>
        <View style={[{ borderRadius: 12, padding: 14, marginBottom: 12 }, styles.panel]}>
          <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Core flow</Text>
          {[
            "Login or guest tracking",
            "Live order tracking",
            "Real-time courier map + ETA countdown",
            "Courier details",
            "Call / chat courier",
            "Rate delivery",
            "View POD"
          ].map((s) => (
            <Text key={s} style={[{ marginBottom: 4 }, styles.sub]}>
              - {s}
            </Text>
          ))}
        </View>
        <View style={[{ borderRadius: 12, padding: 14 }, styles.panel]}>
          <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Platform capabilities</Text>
          {["Offline mode", "Push notifications", "Biometric login", "Dark mode", "Multi-language"].map((s) => (
            <Text key={s} style={[{ marginBottom: 4 }, styles.sub]}>
              - {s}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
