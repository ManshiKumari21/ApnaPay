const adminOps = require('../controllers/adminOperationsController');

async function testRechargeAPI() {
  console.log("=== Testing Recharge Management APIs ===");

  let resData = null;
  const mockReq = {
    query: {
      range: "30d"
    }
  };
  const mockRes = {
    status: (code) => {
      console.log("Response HTTP Status:", code);
      return {
        json: (data) => {
          resData = data;
          return data;
        }
      };
    }
  };

  try {
    await adminOps.getRechargeOverview(mockReq, mockRes);

    if (!resData || !resData.success) {
      console.error("FAIL: API did not return success:", resData);
      process.exit(1);
    }

    console.log("✓ Success! Stats:", resData.stats);
    console.log(`✓ Operators count: ${resData.operators?.length} (Sample: ${resData.operators?.[0]?.operator_name} - ${resData.operators?.[0]?.gateway_status})`);
    console.log(`✓ Orders count: ${resData.recharge_orders?.length} (Sample: #${resData.recharge_orders?.[0]?.id} - ${resData.recharge_orders?.[0]?.mobile_number} - ${resData.recharge_orders?.[0]?.status})`);
    console.log(`✓ Plans count: ${resData.plans?.length} (Sample: ${resData.plans?.[0]?.plan_name} - ₹${resData.plans?.[0]?.amount})`);
    console.log(`✓ Analytics daily data points: ${resData.analytics?.dailyVolume?.length}`);
    console.log(`✓ Analytics operator distribution: ${resData.analytics?.operatorDistribution?.length}`);
    console.log("ALL BACKEND RECHARGE API CHECKS PASSED!");
    process.exit(0);
  } catch (err) {
    console.error("FAIL with exception:", err);
    process.exit(1);
  }
}

testRechargeAPI();
