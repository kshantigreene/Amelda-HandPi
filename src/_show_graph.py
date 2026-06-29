import db

print("Nodes")
for node in db.list_nodes():
    print(f"{node['id']}: {node['text_content']}")

print("Edges")
for edge in db.list_edges():
    print(f"{edge['from_id']}: {edge['to_id']}")