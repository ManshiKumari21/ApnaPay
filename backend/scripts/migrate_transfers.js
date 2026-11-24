const db = require("../config/db");

async function migrate() {
  try {
    const alterQueries = [
      "ALTER TABLE transfers ADD COLUMN transfer_mode VARCHAR(20) DEFAULT 'UPI'",
      "ALTER TABLE transfers ADD COLUMN beneficiary_name VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE transfers ADD COLUMN ifsc_code VARCHAR(20) DEFAULT NULL",
      "ALTER TABLE transfers ADD COLUMN fee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE transfers ADD COLUMN provider_reference VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE transfers ADD COLUMN failure_reason VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE transfers ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL"
    ];

    for (const q of alterQueries) {
      try {
        await db.query(q);
        console.log("Executed:", q);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log("Column already exists:", q.split(" ")[3]);
        } else {
          console.warn("Alter warning:", err.message);
        }
      }
    }

    const [cols] = await db.query("DESCRIBE transfers");
    console.log("Transfers columns:", cols.map(c => c.Field));
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
