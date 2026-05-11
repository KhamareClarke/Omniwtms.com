import { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
  useColorScheme,
  TextInput,
  FlatList,
} from "react-native";

type Tab = "pick" | "pack" | "labels" | "settings";

type PickLine = { id: string; sku: string; qty: number; picked: boolean };

const INITIAL_LINES: PickLine[] = [
  { id: "1", sku: "SKU-BOLT-10", qty: 4, picked: false },
  { id: "2", sku: "SKU-PALLET-A", qty: 1, picked: false },
  { id: "3", sku: "SKU-FILTER-X", qty: 12, picked: false },
];

export default function App() {
  const dark = useColorScheme() === "dark";
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState<Tab>("pick");
  const [lines, setLines] = useState(INITIAL_LINES);
  const [scan, setScan] = useState("");
  const [shipGroup, setShipGroup] = useState<string[]>([]);

  const styles = useMemo(
    () => ({
      bg: { backgroundColor: dark ? "#0d1020" : "#f5f7ff" },
      panel: { backgroundColor: dark ? "#171d34" : "#fff", borderRadius: 12, padding: 14, marginBottom: 12 },
      text: { color: dark ? "#f4f7ff" : "#111827" },
      sub: { color: dark ? "#c2c8df" : "#4b5563" },
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

  const toggle = (id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, picked: !l.picked } : l)));
  };

  const tabBtn = (id: Tab, label: string) => (
    <Pressable key={id} onPress={() => setTab(id)} style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
      <Text style={{ color: tab === id ? "#3456FF" : dark ? "#e5e7eb" : "#374151", fontWeight: tab === id ? "700" : "500" }}>
        {label}
      </Text>
    </Pressable>
  );

  if (!signedIn) {
    return (
      <SafeAreaView style={[{ flex: 1 }, styles.bg]}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={[{ fontSize: 24, fontWeight: "700", marginBottom: 8 }, styles.text]}>OmniWTMS Warehouse</Text>
          <View style={styles.panel}>
            <Text style={[styles.sub, { marginBottom: 12 }]}>
              Pick → pack → print labels → mark ready. Barcode field simulates scanner; extend with expo-barcode-scanner.
            </Text>
            <Pressable onPress={() => setSignedIn(true)} style={{ backgroundColor: "#3456FF", padding: 14, borderRadius: 10 }}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1 }, styles.bg]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={[{ fontSize: 20, fontWeight: "700" }, styles.text]}>Warehouse</Text>
        <Text style={styles.sub}>Order #SO-88421 · Priority standard</Text>
      </View>
      {tab === "pick" ? (
        <FlatList
          data={lines}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <View style={[styles.panel, { marginBottom: 12 }]}>
              <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Scan SKU</Text>
              <TextInput
                value={scan}
                onChangeText={setScan}
                placeholder="Camera scan or keyboard"
                placeholderTextColor={dark ? "#64748b" : "#9ca3af"}
                style={{
                  borderWidth: 1,
                  borderColor: dark ? "#334155" : "#d1d5db",
                  borderRadius: 8,
                  padding: 10,
                  color: dark ? "#f8fafc" : "#111827",
                  marginBottom: 8,
                }}
              />
              <Pressable
                onPress={() => {
                  const m = lines.find((l) => l.sku.toLowerCase() === scan.toLowerCase());
                  if (m) toggle(m.id);
                  setScan("");
                }}
                style={{ backgroundColor: "#111827", padding: 10, borderRadius: 8 }}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>Apply scan</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => toggle(item.id)} style={[styles.panel, item.picked ? { borderWidth: 2, borderColor: "#16a34a" } : null]}>
              <Text style={[styles.text, { fontWeight: "700" }]}>{item.sku}</Text>
              <Text style={styles.sub}>Qty {item.qty}</Text>
              <Text style={{ marginTop: 6, color: item.picked ? "#4ade80" : "#f97316", fontWeight: "600" }}>
                {item.picked ? "Picked" : "Tap when picked"}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 88 }}>
          {tab === "pack" ? (
            <View style={styles.panel}>
              <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Pack & group shipments</Text>
              <Text style={[styles.sub, { marginBottom: 12 }]}>
                Selected picked lines can be grouped for a shipment label batch.
              </Text>
              <Pressable
                onPress={() => {
                  const ids = lines.filter((l) => l.picked).map((l) => l.id);
                  setShipGroup(ids);
                }}
                style={{ backgroundColor: "#3456FF", padding: 12, borderRadius: 10, marginBottom: 8 }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>Group picked into shipment</Text>
              </Pressable>
              <Text style={styles.sub}>Shipment batch: {shipGroup.length ? shipGroup.join(", ") : "none yet"}</Text>
            </View>
          ) : null}
          {tab === "labels" ? (
            <View style={styles.panel}>
              <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Print labels</Text>
              <Text style={styles.sub}>
                Integrate with Bluetooth/Zebra SDK or server-side label PDF (see web dashboard). This button marks the
                batch as label-printed in workflow.
              </Text>
              <Pressable style={{ marginTop: 12, backgroundColor: "#111827", padding: 12, borderRadius: 10 }}>
                <Text style={{ color: "#fff", textAlign: "center" }}>Simulate print job</Text>
              </Pressable>
            </View>
          ) : null}
          {tab === "settings" ? (
            <View style={styles.panel}>
              <Text style={[styles.text, { fontWeight: "600" }]}>Offline · push · biometric</Text>
              <Text style={[styles.sub, { marginTop: 8 }]}>
                Mirror courier-app services (SQLite queue, expo-notifications) for warehouse floor reliability.
              </Text>
              <Pressable onPress={() => setSignedIn(false)} style={{ marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: "#b91c1c22" }}>
                <Text style={{ color: "#fecaca", textAlign: "center", fontWeight: "600" }}>Sign out</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
      <View style={[styles.tabBar, { backgroundColor: dark ? "#0d1020" : "#f5f7ff" }]}>
        {tabBtn("pick", "Pick")}
        {tabBtn("pack", "Pack")}
        {tabBtn("labels", "Labels")}
        {tabBtn("settings", "More")}
      </View>
    </SafeAreaView>
  );
}
