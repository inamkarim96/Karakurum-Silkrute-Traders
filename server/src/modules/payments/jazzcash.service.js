const crypto = require("crypto");
const { JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT, NODE_ENV, FRONTEND_URL, BACKEND_URL } = require("../../config/env");

async function initiateJazzcashPayment(order) {
  const amountStr = Math.round(Number(order.total) * 100).toString(); // in paisa
  const txnRefNo = "T" + Date.now(); // Generate a unique transaction reference
  const txnDateTime = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const expiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

  const transactionData = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: JAZZCASH_MERCHANT_ID,
    pp_Password: JAZZCASH_PASSWORD,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: amountStr,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: txnDateTime,
    pp_BillReference: "order_" + order.id,
    pp_Description: "Payment for order #" + order.id,
    pp_TxnExpiryDateTime: expiryDateTime,
    pp_ReturnURL: `${BACKEND_URL}/payments/callback/jazzcash`,
    pp_SecureHash: ""
  };

  // Sort keys and generate hash
  const sortedKeys = Object.keys(transactionData)
    .filter(k => k !== "pp_SecureHash" && transactionData[k] !== "" && transactionData[k] !== null && transactionData[k] !== undefined)
    .sort();
  
  const hashString = (JAZZCASH_INTEGRITY_SALT || "") + "&" + sortedKeys.map(k => transactionData[k]).join("&");
  
  if (NODE_ENV !== "production") {
    console.log("JazzCash Hash String:", hashString);
  }

  transactionData.pp_SecureHash = crypto.createHmac("sha256", JAZZCASH_INTEGRITY_SALT || "")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  const postUrl = NODE_ENV === "production" 
    ? "https://payments.jazzcash.com.pk/CustomerPortal/transaction/Checkout"
    : "https://sandbox.jazzcash.com.pk/CustomerPortal/transaction/Checkout";

  return {
    postUrl,
    fields: transactionData
  };
}

function verifyHash(data) {
  const secureHash = data.pp_SecureHash;
  if (!secureHash) return false;

  const sortedKeys = Object.keys(data)
    .filter(k => k !== "pp_SecureHash" && data[k] !== "" && data[k] !== null && data[k] !== undefined)
    .sort();
  
  const hashString = (JAZZCASH_INTEGRITY_SALT || "") + "&" + sortedKeys.map(k => data[k]).join("&");

  const computedHash = crypto.createHmac("sha256", JAZZCASH_INTEGRITY_SALT || "")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  if (computedHash !== secureHash) {
    console.warn("JazzCash Signature Mismatch!");
    console.warn("Expected:", secureHash);
    console.warn("Computed:", computedHash);
    if (NODE_ENV !== "production") {
      console.warn("Hash String used:", hashString);
    }
  }

  return computedHash === secureHash;
}

module.exports = {
  initiateJazzcashPayment,
  verifyHash
};
