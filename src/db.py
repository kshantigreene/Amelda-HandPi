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
            INSERT OR IGNORE INTO edge_type(name) VALUES ('user'), ('auto');

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


def create_edge(id: str, from_id: str, to_id: str, relationship_type: str, creator: str, now: str) -> dict:
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO edges (id, from_id, to_id, relationship_type, creator, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (id, from_id, to_id, relationship_type, creator, now, now),
        )
    return {"id": id, "from_id": from_id, "to_id": to_id, "relationship_type": relationship_type,
            "creator": creator, "created_at": now, "updated_at": now}


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at: {DB_PATH}")
