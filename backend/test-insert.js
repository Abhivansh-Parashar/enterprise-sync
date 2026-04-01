const { db, initDB } = require('./database');
initDB().then(() => {
  db.execute({
    sql: "INSERT INTO email_threads (clientName, content, link, savedAt) VALUES (?, ?, ?, ?)",
    args: ['TestClient', 'TestContent', 'TestLink', new Date().toISOString()]
  }).then(res => console.log('Insert success:', res)).catch(err => console.error('Insert error:', err));
}).catch(console.error);
