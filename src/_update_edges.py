import sqlite3
conn = sqlite3.connect("amelda.db")
conn.execute("INSERT into edge_type values('sequence')").fetchall()
rows=conn.execute("SELECT * from edge_type").fetchall()
print([r[0] for r in rows])