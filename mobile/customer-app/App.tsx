import { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
  useColorScheme,
  TextInput,
  Linking,
} from "react-native";

type Tab = "track" | "order" | "rate" | "settings";

export default function App() {
  const dark = useColorScheme() === "dark";
  const [tab, setTab] = useState<Tab>("track");
  const [guestId, setGuestId] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [rating, setRating] = useState(0);

  const styles = useMemo(
    () => ({
      bg: { backgroundColor: dark ? "#0f1225" : "#f6f8ff" },
      panel: { backgroundColor: dark ? "#1b2240" : "#fff", borderRadius: 12, padding: 14, marginBottom: 12 },
      text: { color: dark ? "#f5f8ff" : "#111827" },
      sub: { color: dark ? "#c3cae5" : "#4b5563" },
      tabBar: {
        flexDirection: "row" as const,
        borderTopWidth: 1,
        borderTopColor: dark ? "#1f2937" : "#e5e7eb",
        paddingVertical: 8,
        justifyContent: "space-around" as const,
      },
    }),
    [dark]
  );

  const tabBtn = (id: Tab, label: string) => (
    <Pressable key={id} onPress={() => setTab(id)} style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
      <Text style={{ color: tab === id ? "#3456FF" : dark ? "#e5e7eb" : "#374151", fontWeight: tab === id ? "700" : "500" }}>
        {label}
      </Text>
    </Pressable>
  );

  const openTrackWeb = () => {
    const id = guestId.trim() || "DEMO-PKG";
    void Linking.openURL(`https://omniwtms.com/track/${encodeURIComponent(id)}`);
  };

  return (
    <SafeAreaView style={[{ flex: 1 }, styles.bg]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[{ fontSize: 24, fontWeight: "700", marginBottom: 4 }, styles.text]}>OmniWTMS Customer</Text>
        <Text style={[styles.sub, { marginBottom: 12 }]}>Guest tracking, live status, ETA mock, courier handoff.</Text>

        {!signedIn ? (
          <View style={styles.panel}>
            <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Account</Text>
            <Pressable onPress={() => setSignedIn(true)} style={{ backgroundColor: "#3456FF", padding: 12, borderRadius: 10, marginBottom: 8 }}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>Sign in (demo)</Text>
            </Pressable>
            <Text style={styles.sub}>Or use Track tab as guest with package / order id.</Text>
          </View>
        ) : null}

        {tab === "track" ? (
          <View style={styles.panel}>
            <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Track shipment</Text>
            <TextInput
              placeholder="Package / tracking id"
              placeholderTextColor={dark ? "#64748b" : "#9ca3af"}
              value={guestId}
              onChangeText={setGuestId}
              style={{
                borderWidth: 1,
                borderColor: dark ? "#334155" : "#d1d5db",
                borderRadius: 8,
                padding: 10,
                color: dark ? "#f8fafc" : "#111827",
                marginBottom: 8,
              }}
            />
            <Pressable onPress={openTrackWeb} style={{ backgroundColor: "#3456FF", padding: 12, borderRadius: 10, marginBottom: 8 }}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>Open tracking page</Text>
            </Pressable>
            <View style={{ padding: 10, backgroundColor: dark ? "#0f172a" : "#f1f5f9", borderRadius: 8 }}>
              <Text style={[styles.text, { fontWeight: "600" }]}>Live status (sample)</Text>
              <Text style={[styles.sub, { marginTop: 6 }]}>Courier: Alex · Vehicle: Van 12</Text>
              <Text style={[styles.sub]}>ETA: ~18 min · Last ping: 2 min ago</Text>
              <Pressable onPress={() => void Linking.openURL("tel:+440000000000")} style={{ marginTop: 10 }}>
                <Text style={{ color: "#60a5fa", fontWeight: "600" }}>Call courier</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {tab === "order" ? (
          <View style={styles.panel}>
            <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Order timeline</Text>
            <Text style={styles.sub}>Confirmed → Picked → Out for delivery → (you are here)</Text>
          </View>
        ) : null}

        {tab === "rate" ? (
          <View style={styles.panel}>
            <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Rate delivery</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <Text style={{ fontSize: 28, opacity: n <= rating ? 1 : 0.3 }}>★</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={{ backgroundColor: "#111827", padding: 12, borderRadius: 10 }}>
              <Text style={{ color: "#fff", textAlign: "center" }}>Submit rating ({rating || "—"})</Text>
            </Pressable>
          </View>
        ) : null}

        {tab === "settings" ? (
          <View style={styles.panel}>
            <Text style={[styles.text, { fontWeight: "600" }]}>POD & notifications</Text>
            <Text style={[styles.sub, { marginTop: 8 }]}>
              Link to customer portal POD URL from delivery-complete email; enable push for status changes.
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.tabBar, { backgroundColor: dark ? "#0f1225" : "#f6f8ff" }]}>
        {tabBtn("track", "Track")}
        {tabBtn("order", "Order")}
        {tabBtn("rate", "Rate")}
        {tabBtn("settings", "More")}
      </View>
    </SafeAreaView>
  );
}
