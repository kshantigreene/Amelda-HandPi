import sqlite3
import os

DB_PATH = os.environ.get("AMELDA_DB", "amelda.db")


def get_connection(path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db(path: str = DB_PATH) -> None:
    with get_connection(path) as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS node_type (
                name TEXT PRIMARY KEY
            );

            CREATE TABLE IF NOT EXISTS edge_type (
                name TEXT PRIMARY KEY
            );

            INSERT OR IGNORE INTO node_type(name) VALUES ('concept'), ('free');
            INSERT OR IGNORE INTO edge_type(name) VALUES ('user'), ('auto'), ('sequence');

            CREATE TABLE IF NOT EXISTS nodes (
                id               TEXT PRIMARY KEY,
                text_content     TEXT,
                other_content    TEXT,
                node_type        TEXT REFERENCES node_type(name),
                created_at       TEXT NOT NULL,
                updated_at       TEXT NOT NULL,
                creator          TEXT NOT NULL,
                is_deleted       INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS edges (
                id                TEXT PRIMARY KEY,
                from_id           TEXT NOT NULL REFERENCES nodes(id),
                to_id             TEXT NOT NULL REFERENCES nodes(id),
                directed          INTEGER NOT NULL DEFAULT 1,
                relationship_type TEXT REFERENCES edge_type(name),
                weight            REAL,
                created_at        TEXT NOT NULL,
                updated_at        TEXT NOT NULL,
                creator           TEXT NOT NULL,
                is_deleted        INTEGER NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_edges_from ON edges(from_id);
            CREATE INDEX IF NOT EXISTS idx_edges_to   ON edges(to_id);
            CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);

            CREATE TABLE IF NOT EXISTS app_state (
                id               INTEGER PRIMARY KEY CHECK (id = 1),
                current_note_id  TEXT REFERENCES nodes(id),
                mode             TEXT NOT NULL DEFAULT 'new'
            );

            INSERT OR IGNORE INTO app_state (id, current_note_id, mode) VALUES (1, NULL, 'new');
        """)


def list_nodes() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM nodes WHERE is_deleted = 0").fetchall()
        return [dict(r) for r in rows]


def create_node(id: str, text_content: str, node_type: str, creator: str, now: str) -> dict:
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO nodes (id, text_content, node_type, creator, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (id, text_content, node_type, creator, now, now),
        )
    return {"id": id, "text_content": text_content, "node_type": node_type,
            "creator": creator, "created_at": now, "updated_at": now}


def update_node(id: str, text_content: str, now: str) -> dict | None:
    with get_connection() as conn:
        cur = conn.execute(
            "UPDATE nodes SET text_content = ?, updated_at = ? WHERE id = ? AND is_deleted = 0",
            (text_content, now, id),
        )
        if cur.rowcount == 0:
            return None
        return dict(conn.execute("SELECT * FROM nodes WHERE id = ?", (id,)).fetchone())


def create_edge(id: str, from_id: str, to_id: str, relationship_type: str, creator: str, now: str, weight: float | None = None) -> dict:
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO edges (id, from_id, to_id, relationship_type, weight, creator, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (id, from_id, to_id, relationship_type, weight, creator, now, now),
        )
    return {"id": id, "from_id": from_id, "to_id": to_id, "relationship_type": relationship_type,
            "weight": weight, "creator": creator, "created_at": now, "updated_at": now}

def delete_edge(id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("UPDATE edges SET is_deleted = 1 WHERE id = ? AND is_deleted = 0", (id,))
        return cur.rowcount > 0


def delete_node(id: str) -> bool:
    with get_connection() as conn:
        conn.execute(
            "UPDATE edges SET is_deleted = 1 WHERE (from_id = ? OR to_id = ?) AND is_deleted = 0",
            (id, id),
        )
        cur = conn.execute(
            "UPDATE nodes SET is_deleted = 1 WHERE id = ? AND is_deleted = 0", (id,)
        )
        return cur.rowcount > 0


def list_edges() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM edges WHERE is_deleted = 0").fetchall()
        return [dict(r) for r in rows]


def get_node(id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM nodes WHERE id = ? AND is_deleted = 0", (id,)).fetchone()
        return dict(row) if row else None


def get_app_state() -> dict:
    with get_connection() as conn:
        row = conn.execute("SELECT current_note_id, mode FROM app_state WHERE id = 1").fetchone()
        return dict(row)


def set_app_state(current_note_id: str | None, mode: str) -> dict:
    with get_connection() as conn:
        conn.execute(
            "UPDATE app_state SET current_note_id = ?, mode = ? WHERE id = 1",
            (current_note_id, mode),
        )
    return {"current_note_id": current_note_id, "mode": mode}


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at: {DB_PATH}")
