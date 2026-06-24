import sqlite3
conn = sqlite3.connect("amelda.db")
rows = conn.execute("SELECT name FROM edge_type").fetchall()
print([r[0] for r in rows])