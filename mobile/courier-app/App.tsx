import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
  useColorScheme,
  FlatList,
  Linking,
  TextInput,
  Alert,
} from "react-native";
import { biometricLogin, canUseBiometric } from "./src/services/biometric";
import { initOffline, queueEvent, getQueuedEvents, clearAllQueuedEvents } from "./src/services/offline";
import { registerPushToken } from "./src/services/push";

const MOCK_DELIVERIES = [
  { id: "1", ref: "PKG-2041", addr: "12 Wharf Rd, London", status: "out_for_delivery", lat: 51.52, lng: -0.12 },
  { id: "2", ref: "PKG-2042", addr: "88 High St, Manchester", status: "pending", lat: 53.48, lng: -2.24 },
];

type Tab = "home" | "stops" | "scan" | "earnings" | "chat" | "settings";

const card = { padding: 14, borderRadius: 12, marginBottom: 10 };

export default function App() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const [signedIn, setSignedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [selectedStop, setSelectedStop] = useState<(typeof MOCK_DELIVERIES)[0] | null>(MOCK_DELIVERIES[0]);
  const [scanValue, setScanValue] = useState("");

  useEffect(() => {
    initOffline();
    registerPushToken().then(setToken).catch(() => setToken(null));
  }, []);

  const styles = useMemo(
    () => ({
      bg: { backgroundColor: dark ? "#0b1020" : "#f4f7ff" },
      panel: { backgroundColor: dark ? "#141b34" : "#ffffff" },
      text: { color: dark ? "#f5f8ff" : "#111827" },
      sub: { color: dark ? "#b8c0d9" : "#4b5563" },
      tabBar: {
        flexDirection: "row" as const,
        borderTopWidth: 1,
        borderTopColor: dark ? "#1f2937" : "#e5e7eb",
        paddingTop: 8,
        paddingBottom: 4,
        gap: 4,
        justifyContent: "space-around" as const,
      },
      tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center" as const },
      tabActive: { borderBottomWidth: 2, borderBottomColor: "#3456FF" },
    }),
    [dark]
  );

  const quickAction = (name: string) => queueEvent("courier_action", { name, at: new Date().toISOString() });

  const openMaps = (item: (typeof MOCK_DELIVERIES)[0]) => {
    const q = encodeURIComponent(item.addr);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const callCustomer = () => void Linking.openURL("tel:+440000000000");

  const tabBtn = (id: Tab, label: string) => (
    <Pressable key={id} onPress={() => setTab(id)} style={[styles.tabBtn, tab === id ? styles.tabActive : null]}>
      <Text style={[styles.text, { fontSize: 11, fontWeight: tab === id ? "700" : "500" }]}>{label}</Text>
    </Pressable>
  );

  const renderHome = () => (
    <View>
      <View style={[card, styles.panel]}>
        <Text style={[{ fontSize: 16, fontWeight: "600", marginBottom: 8 }, styles.text]}>Active stop</Text>
        {selectedStop ? (
          <>
            <Text style={[styles.text, { fontWeight: "600" }]}>{selectedStop.ref}</Text>
            <Text style={[styles.sub, { marginVertical: 6 }]}>{selectedStop.addr}</Text>
            <Text style={[styles.sub, { marginBottom: 10 }]}>Status: {selectedStop.status}</Text>
            <Pressable
              onPress={() => openMaps(selectedStop)}
              style={{ backgroundColor: "#3456FF", padding: 12, borderRadius: 10, marginBottom: 8 }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>Open in Maps</Text>
            </Pressable>
            <Pressable
              onPress={callCustomer}
              style={{ borderWidth: 1, borderColor: "#3456FF", padding: 12, borderRadius: 10, marginBottom: 8 }}
            >
              <Text style={[{ textAlign: "center", fontWeight: "600" }, styles.text]}>Call customer</Text>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => quickAction("POD_photo")}
                style={{ flex: 1, backgroundColor: "#111827", padding: 10, borderRadius: 10 }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontSize: 12 }}>Photo POD</Text>
              </Pressable>
              <Pressable
                onPress={() => quickAction("POD_signature")}
                style={{ flex: 1, backgroundColor: "#111827", padding: 10, borderRadius: 10 }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontSize: 12 }}>Signature</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
      <View style={[card, styles.panel]}>
        <Text style={[{ fontSize: 16, fontWeight: "600", marginBottom: 8 }, styles.text]}>Time tracking</Text>
        <Pressable
          onPress={() => quickAction("clock_in")}
          style={{ backgroundColor: "#3456FF", padding: 10, borderRadius: 10, marginBottom: 8 }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Clock in</Text>
        </Pressable>
        <Pressable
          onPress={() => quickAction("clock_out")}
          style={{ borderWidth: 1, borderColor: "#3456FF55", padding: 10, borderRadius: 10, marginBottom: 8 }}
        >
          <Text style={[{ textAlign: "center" }, styles.text]}>Clock out</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const n = getQueuedEvents().length;
            Alert.alert("Offline queue", `${n} event(s) queued. Clear demo queue?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: () => clearAllQueuedEvents() },
            ]);
          }}
          style={{ borderWidth: 1, borderColor: "#94a3b8", padding: 10, borderRadius: 10 }}
        >
          <Text style={[{ textAlign: "center", fontSize: 12 }, styles.sub]}>View / clear offline queue</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStops = () => (
    <FlatList
      data={MOCK_DELIVERIES}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ paddingBottom: 24 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => setSelectedStop(item)}
          style={[card, styles.panel, selectedStop?.id === item.id ? { borderWidth: 2, borderColor: "#3456FF" } : null]}
        >
          <Text style={[styles.text, { fontWeight: "700" }]}>{item.ref}</Text>
          <Text style={styles.sub}>{item.addr}</Text>
          <Text style={[styles.sub, { marginTop: 6 }]}>{item.status}</Text>
        </Pressable>
      )}
    />
  );

  const renderScan = () => (
    <View style={[card, styles.panel]}>
      <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Barcode verification</Text>
      <Text style={[styles.sub, { marginBottom: 8 }]}>
        Wire to expo-barcode-scanner in the field; manual entry for simulator:
      </Text>
      <TextInput
        placeholder="Scan or type SKU / package"
        placeholderTextColor={dark ? "#64748b" : "#9ca3af"}
        value={scanValue}
        onChangeText={setScanValue}
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
          queueEvent("barcode_verify", { value: scanValue, at: new Date().toISOString() });
          setScanValue("");
        }}
        style={{ backgroundColor: "#3456FF", padding: 12, borderRadius: 10 }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>Verify code</Text>
      </Pressable>
    </View>
  );

  const renderEarnings = () => (
    <View style={[card, styles.panel]}>
      <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Today (sample)</Text>
      <Text style={styles.sub}>Stops completed: 0</Text>
      <Text style={styles.sub}>Estimated earnings: £0.00</Text>
      <Text style={[styles.sub, { marginTop: 8 }]}>
        Connect to your tenant payroll / courier payout API when backend exposes driver earnings.
      </Text>
    </View>
  );

  const renderChat = () => (
    <View style={[card, styles.panel]}>
      <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Dispatcher chat</Text>
      <Text style={styles.sub}>
        Placeholder — integrate WebSocket or your messaging provider; queue outbound messages offline via the same
        SQLite pipeline.
      </Text>
      <Pressable
        onPress={() => quickAction("chat_ping")}
        style={{ marginTop: 12, backgroundColor: "#3456FF", padding: 10, borderRadius: 10 }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>Send “Arrived at gate”</Text>
      </Pressable>
    </View>
  );

  const renderSettings = () => (
    <View style={[card, styles.panel]}>
      <Text style={[{ fontWeight: "600", marginBottom: 8 }, styles.text]}>Settings</Text>
      <Text style={styles.sub}>Dark mode: follows system</Text>
      <Text style={styles.sub}>Language: EN (add i18n JSON per locale)</Text>
      <Text style={[styles.sub, { marginTop: 8 }]}>Push token: {token ? token.slice(0, 18) + "…" : "not granted"}</Text>
      <Pressable onPress={() => setSignedIn(false)} style={{ marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: "#b91c1c22" }}>
        <Text style={{ color: "#fecaca", textAlign: "center", fontWeight: "600" }}>Sign out</Text>
      </Pressable>
    </View>
  );

  const body = () => {
    switch (tab) {
      case "home":
        return renderHome();
      case "stops":
        return renderStops();
      case "scan":
        return renderScan();
      case "earnings":
        return renderEarnings();
      case "chat":
        return renderChat();
      case "settings":
        return renderSettings();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[{ flex: 1 }, styles.bg]}>
      {!signedIn ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={[{ fontSize: 24, fontWeight: "700", marginBottom: 4 }, styles.text]}>OmniWTMS Courier</Text>
          <Text style={[{ marginBottom: 12 }, styles.sub]}>
            Full mobile flow: tabbed home, stops, scan, earnings, dispatcher ping, offline queue, biometric login, and
            maps / dialer handoff.
          </Text>
          <View style={[card, styles.panel]}>
            <Text style={[{ fontSize: 16, fontWeight: "600", marginBottom: 8 }, styles.text]}>Login</Text>
            <Pressable
              onPress={() => setSignedIn(true)}
              style={{ backgroundColor: "#3456FF", padding: 12, borderRadius: 10, marginBottom: 8 }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>Email / Password Sign In</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                if (!(await canUseBiometric())) return;
                const ok = await biometricLogin();
                if (ok) setSignedIn(true);
              }}
              style={{ borderWidth: 1, borderColor: "#3456FF55", padding: 12, borderRadius: 10 }}
            >
              <Text style={[{ textAlign: "center", fontWeight: "600" }, styles.text]}>Biometric Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            <Text style={[{ fontSize: 20, fontWeight: "700" }, styles.text]}>Courier</Text>
            <Text style={styles.sub}>{tab === "stops" ? "Today's route" : "Field operations"}</Text>
          </View>
          {tab === "stops" ? (
            <View style={{ flex: 1, paddingHorizontal: 16 }}>{renderStops()}</View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>{body()}</ScrollView>
          )}
          <View style={[styles.tabBar, { paddingHorizontal: 8, backgroundColor: dark ? "#0b1020" : "#f4f7ff" }]}>
            {tabBtn("home", "Home")}
            {tabBtn("stops", "Stops")}
            {tabBtn("scan", "Scan")}
            {tabBtn("earnings", "Pay")}
            {tabBtn("chat", "Chat")}
            {tabBtn("settings", "More")}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
