import uuid
from datetime import datetime, timezone
import db
from word_match import recompute_all_matches

now = datetime.now(timezone.utc).isoformat()
all_nodes = db.list_nodes()
all_edges = db.list_edges()

created = 0
for from_id, to_id, match in recompute_all_matches(all_nodes, all_edges):
    db.create_edge(str(uuid.uuid4()), from_id, to_id, "auto", "system", now, match)
    created += 1

print(f"Done. Created {created} new auto edge(s).")