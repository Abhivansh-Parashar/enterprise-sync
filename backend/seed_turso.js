const fs = require('fs');
const { createClient } = require('@libsql/client');
const { parse } = require('csv-parse/sync');

const db = createClient({
  url: 'libsql://enterprise-db-abhivansh-parashar.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQzNjY1MDMsImlkIjoiMDE5ZDIwNzQtNGIwMS03MDRmLTkzZGYtMjRhNzMwZWY5ODZjIiwicmlkIjoiMWNhNTVhZjktMWFjNi00ZmI1LTlkZjYtOGFmYzQ5ZTcwYjI1In0.WWUYzYIZacFXzaq3pmo87T__buNixPN5W8oqsyIi_A3FJOhFBcFDR09JrpdBI_eDSBQESSQSfVAM_Rp8PQ1cBQ'
});

async function run() {
  console.log("Reading CSV...");
  const content = fs.readFileSync('./import.manifest.csv', 'utf8');
  const records = parse(content, { skip_empty_lines: true, relax_column_count: true });
  
  // Skip row 0 (headers)
  for (let i = 1; i < records.length; i++) {
    const r = records[i];
    if (!r[0] || r[0].startsWith('Open Questions') || !r[0].trim()) continue;
    
    // Columns mapping from the specific user CSV:
    // 0: clientName
    // 1: Region/Lanes
    // 2: Phone
    // 3: Priority
    // 4: City
    // 5: Notes/Updates
    // 6: FollowUp ("27th March")
    // 7: Extra Specs/Blockers
    // 8: Additional Notes
    
    const clientName = r[0].trim();
    let priority = r[3] ? r[3].trim() : 'Medium';
    if (!['High', 'Medium', 'Low'].includes(priority)) priority = 'Medium';
    
    const phoneNumber = r[2] ? r[2].trim() : '';
    
    const region = r[1] ? `[Region] ${r[1].trim()}` : '';
    const city = r[4] ? `[Location] ${r[4].trim()}` : '';
    const note = r[5] ? `[Updates] ${r[5].trim()}` : '';
    const extra = r[7] ? `[Details] ${r[7].trim()}` : '';
    const addon = r[8] ? `[Action] ${r[8].trim()}` : '';
    
    let fullNotes = [region, city, note, extra, addon].filter(Boolean).join(' | ');
    if (fullNotes.length > 500) {
      fullNotes = fullNotes.substring(0, 497) + "..."; // constrain
    }

    const accountOwner = 'Imported';
    const assignedTo = '';
    const stage = 'Discovery';
    const lastUpdate = new Date().toISOString().split('T')[0];
    const blocker = '';
    
    // Date parsing "27th March" -> "2026-03-27"
    let followUpDate = '';
    if (r[6] && r[6] !== '-') {
       const strDate = r[6].toLowerCase().trim();
       if (strDate.includes('march') || strDate.includes('mar')) {
           const match = strDate.match(/\d+/);
           if (match) {
               const day = match[0].padStart(2, '0');
               followUpDate = `2026-03-${day}`;
           }
       } else if (strDate.includes('april') || strDate.includes('apr')) {
           const match = strDate.match(/\d+/);
           if (match) {
               const day = match[0].padStart(2, '0');
               followUpDate = `2026-04-${day}`;
           }
       } else if (strDate.includes('may')) {
           const match = strDate.match(/\d+/);
           if (match) {
               const day = match[0].padStart(2, '0');
               followUpDate = `2026-05-${day}`;
           }
       }
    }
    
    try {
        await db.execute({
            sql: `INSERT INTO deals (clientName, accountOwner, stage, lastUpdate, assignedTo, blocker, followUpDate, notes, status, phoneNumber, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
            args: [clientName, accountOwner, stage, lastUpdate, assignedTo, blocker, followUpDate, fullNotes, phoneNumber, priority]
        });
        console.log(`Successfully imported: ${clientName}`);
    } catch (err) {
        console.error(`Error importing ${clientName}:`, err.message);
    }
  }
  console.log("✓ DONE! Successfully injected spreadsheet data directly to Turso Live DB.");
  process.exit(0);
}

run();
