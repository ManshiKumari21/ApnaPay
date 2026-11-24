const db = require('../config/db');

async function seedMoreRecharges() {
  try {
    const [existing] = await db.execute("SELECT COUNT(*) as cnt FROM recharge_orders");
    console.log("Current recharge orders count:", existing[0].cnt);

    const ordersToSeed = [
      { user_id: 1, operator_id: 1, plan_id: 1, mobile_number: "9876543210", amount: 299.00, provider_reference: "RCH_JIO_1001", status: "success", days_ago: 0 },
      { user_id: 2, operator_id: 2, plan_id: 4, mobile_number: "9123456789", amount: 299.00, provider_reference: "RCH_AIR_1002", status: "success", days_ago: 1 },
      { user_id: 3, operator_id: 3, plan_id: 6, mobile_number: "9822012345", amount: 299.00, provider_reference: "RCH_VI_1003", status: "success", days_ago: 1 },
      { user_id: 4, operator_id: 4, plan_id: null, mobile_number: "9456789012", amount: 107.00, provider_reference: "RCH_BSNL_1004", status: "failed", days_ago: 2 },
      { user_id: 1, operator_id: 5, plan_id: null, mobile_number: "1002938192", amount: 450.00, provider_reference: "RCH_TATA_1005", status: "success", days_ago: 2 },
      { user_id: 2, operator_id: 1, plan_id: 2, mobile_number: "9876543210", amount: 349.00, provider_reference: "RCH_JIO_1006", status: "success", days_ago: 3 },
      { user_id: 3, operator_id: 2, plan_id: 5, mobile_number: "9123456789", amount: 399.00, provider_reference: "RCH_AIR_1007", status: "processing", days_ago: 3 },
      { user_id: 4, operator_id: 1, plan_id: 3, mobile_number: "9822012345", amount: 799.00, provider_reference: "RCH_JIO_1008", status: "success", days_ago: 4 },
      { user_id: 1, operator_id: 6, plan_id: null, mobile_number: "3001928491", amount: 350.00, provider_reference: "RCH_DTH_1009", status: "success", days_ago: 5 },
      { user_id: 2, operator_id: 4, plan_id: null, mobile_number: "9456789012", amount: 153.00, provider_reference: "RCH_BSNL_1010", status: "pending", days_ago: 6 },
      { user_id: 3, operator_id: 2, plan_id: 4, mobile_number: "9123456789", amount: 299.00, provider_reference: "RCH_AIR_1011", status: "reversed", days_ago: 7 },
      { user_id: 4, operator_id: 1, plan_id: 1, mobile_number: "9876543210", amount: 299.00, provider_reference: "RCH_JIO_1012", status: "success", days_ago: 8 },
      { user_id: 1, operator_id: 3, plan_id: null, mobile_number: "9822012345", amount: 19.00, provider_reference: "RCH_VI_1013", status: "success", days_ago: 9 },
      { user_id: 2, operator_id: 5, plan_id: null, mobile_number: "1002938192", amount: 600.00, provider_reference: "RCH_TATA_1014", status: "success", days_ago: 10 }
    ];

    for (const ord of ordersToSeed) {
      await db.execute(`
        INSERT INTO recharge_orders (user_id, operator_id, plan_id, mobile_number, amount, provider_reference, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
      `, [ord.user_id, ord.operator_id, ord.plan_id, ord.mobile_number, ord.amount, ord.provider_reference, ord.status, ord.days_ago]);
    }

    const [updated] = await db.execute("SELECT COUNT(*) as cnt FROM recharge_orders");
    console.log("Updated recharge orders count:", updated[0].cnt);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedMoreRecharges();
