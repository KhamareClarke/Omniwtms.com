import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("courier_offline.db");

export function initOffline() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function queueEvent(eventType: string, payload: Record<string, unknown>) {
  db.runSync(
    "INSERT INTO sync_queue (event_type, payload, created_at) VALUES (?, ?, ?)",
    [eventType, JSON.stringify(payload), new Date().toISOString()]
  );
}

export function getQueuedEvents(): { id: number; event_type: string; payload: string }[] {
  return db.getAllSync("SELECT id, event_type, payload FROM sync_queue ORDER BY id ASC");
}

export function clearQueuedEvent(id: number) {
  db.runSync("DELETE FROM sync_queue WHERE id = ?", [id]);
}

export function clearAllQueuedEvents() {
  db.execSync("DELETE FROM sync_queue");
}
