import db

val = input("Are you sure you want to clear the database? Type 'YES': ")
if val == "YES":
    with db.get_connection() as conn:
        conn.execute("DELETE FROM edges")
        conn.execute("DELETE FROM nodes")
    print("Database cleared.")