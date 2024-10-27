//first-launch util

db = db.getSiblingDB('chatDatabase');

if (db.services.countDocuments() === 0) {
    db.services.insertMany([
        { name: 'Logs', description: 'Logs of log-in, log-out and errors' },
        { name: 'Chat', description: 'chat-list' },
        { name: 'Clients', description: 'clients collection' }
    ]);
    print('Services initialized');
} else {
    print('Services already initialized');
}