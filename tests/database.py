"""Database invariants against the actual initial migration."""
import sqlite3
from pathlib import Path
connection = sqlite3.connect(':memory:')
connection.executescript(Path('drizzle/0000_deep_pet_avengers.sql').read_text())
def insert(identifier, tenant, start, end, key):
    connection.execute('INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?,?)', (identifier, tenant, 'r', 't', 'h', 'a', 'l', start, end, 'confirmed', key))
insert('1', 'tenant-a', 100, 200, 'a')
try:
    insert('2', 'tenant-a', 150, 250, 'b')
    raise AssertionError('Conflicting resource reservation accepted')
except sqlite3.IntegrityError as error:
    assert 'resource_conflict' in str(error)
insert('3', 'tenant-b', 150, 250, 'c')
insert('4', 'tenant-a', 200, 300, 'd')
print('Database conflict, tenant boundary, and adjacent booking checks passed.')
