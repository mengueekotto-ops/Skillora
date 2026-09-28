/**
 * End-to-end API checks for security rules and the booking → escrow → review flow.
 *
 * Run against a TEST database (it creates accounts):
 *   1. Start the API:  MONGO_URI=mongodb://127.0.0.1:27017/skillora_test DIGIPAY_MOCK=true npm start
 *   2. Run:            npm run test:e2e            (BASE_URL defaults to http://localhost:5000/api)
 */
const BASE = process.env.BASE_URL || "http://localhost:5000/api";
let pass = 0, failCount = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log("  ✅", name); }
  else { failCount++; console.log("  ❌", name, extra); }
}

const u = Date.now();
const pw = "StrongPass123!";

console.log("\n1. Registration & admin block");
let r = await call("POST", "/auth/register", { body: { firstName: "Evil", lastName: "Admin", email: `evil${u}@t.cm`, password: pw, role: "ADMIN" } });
check("register as ADMIN is refused (403)", r.status === 403, r.status);
r = await call("POST", "/auth/register", { body: { firstName: "Short", lastName: "Pw", email: `s${u}@t.cm`, password: "123" } });
check("weak password refused (400)", r.status === 400, r.status);
r = await call("POST", "/auth/register", { body: { firstName: "Cli", lastName: "Ent", email: `c${u}@t.cm`, phone: "+237670000001", password: pw, role: "CUSTOMER" } });
check("customer registers", r.status === 201, JSON.stringify(r.data));
const cTok = r.data.data.token;
check("password not in response", !JSON.stringify(r.data).includes("password\""));
r = await call("POST", "/auth/register", { body: { firstName: "Cli2", lastName: "Other", email: `c2${u}@t.cm`, password: pw } });
const c2Tok = r.data.data.token;
r = await call("POST", "/auth/register", { body: { firstName: "Art", lastName: "Isan", email: `a${u}@t.cm`, phone: "+237690000002", password: pw, role: "PROFESSIONAL", profession: "Plombier", experience: 5 } });
check("artisan registers with profile", r.status === 201 && r.data.data.user.professionalProfile, r.status);
const aTok = r.data.data.token;
const aUserId = r.data.data.user.id;
const proId = r.data.data.user.professionalProfile._id;
check("new artisan wallet starts at 0", r.data.data.user.professionalProfile.walletBalance === 0);
r = await call("POST", "/auth/register", { body: { firstName: "Art2", lastName: "Other", email: `a2${u}@t.cm`, password: pw, role: "ARTISAN", profession: "Électricien" } });
const a2Tok = r.data.data.token;

console.log("\n2. Password reset");
r = await call("POST", "/auth/forgot-password", { body: { email: `c${u}@t.cm` } });
check("forgot-password succeeds", r.status === 200);
check("reset code NOT returned", !r.data.data && !/\d{6}/.test(r.data.message), JSON.stringify(r.data));
const r404 = await call("POST", "/auth/forgot-password", { body: { email: `nobody${u}@t.cm` } });
check("unknown email gets same answer (no enumeration)", r404.status === 200 && r404.data.message === r.data.message);
r = await call("POST", "/auth/reset-password", { body: { email: `c${u}@t.cm`, resetCode: "000000", newPassword: "Another123!" } });
check("wrong code rejected", r.status === 400);

console.log("\n3. Users");
r = await call("GET", "/users");
check("list users without login → 401", r.status === 401, r.status);
r = await call("GET", "/users", { token: cTok });
check("list users as customer → 403", r.status === 403, r.status);
r = await call("GET", `/users/${aUserId}`, { token: cTok });
check("other user's profile hides email/phone", r.status === 200 && !r.data.data.email && !r.data.data.phone, JSON.stringify(r.data).slice(0, 200));
check("no reset token field leaked", !JSON.stringify(r.data).includes("resetPassword"));

console.log("\n4. AI & uploads");
r = await call("POST", "/ai/chat", { body: { message: "hi" } });
check("AI chat without login → 401", r.status === 401, r.status);
r = await call("POST", "/upload/image", { body: { image: "data:image/png;base64,iVBORw0KGgo=" } });
check("upload without login → 401", r.status === 401, r.status);
r = await call("POST", "/upload/image", { token: cTok, body: { image: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" } });
check("SVG upload refused", r.status === 400, r.status);
r = await call("POST", "/upload/image", { token: cTok, body: { image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" } });
check("PNG upload works when logged in", r.status === 201, r.status);

console.log("\n5. Verification quiz");
r = await call("POST", "/verifications/skip", { body: { artisanId: proId } });
check("skip without login → 401", r.status === 401, r.status);
r = await call("POST", "/verifications/skip", { token: a2Tok, body: { artisanId: proId } });
check("other artisan cannot act on my profile → 403", r.status === 403, r.status);
r = await call("POST", "/verifications/quiz/start", { token: cTok });
check("customer cannot start quiz (no artisan profile)", r.status === 404, r.status);
r = await call("POST", "/verifications/quiz/start", { token: aTok, body: { lang: "fr" } });
check("artisan starts quiz (10 questions)", r.status === 200 && r.data.data.questions.length === 10, JSON.stringify(r.data).slice(0, 200));
const session = r.data.data.sessionToken;
check("correct answers NOT sent to browser", r.data.data.questions.every((q) => Object.keys(q).join() === "index,q,options"));
r = await call("POST", "/verifications/quiz/submit", { token: a2Tok, body: { sessionToken: session, answers: Array(10).fill(0) } });
check("another artisan cannot submit my quiz", r.status === 404, r.status);
r = await call("POST", "/verifications/quiz/submit", { token: aTok, body: { sessionToken: session, answers: Array(10).fill(0) } });
check("quiz graded by server", r.status === 200 && typeof r.data.data.scorePercent === "number", JSON.stringify(r.data).slice(0, 300));
console.log(`     (score with all-A answers: ${r.data.data?.scorePercent}%)`);
r = await call("POST", "/verifications/quiz/submit", { token: aTok, body: { sessionToken: session, answers: Array(10).fill(1) } });
check("same quiz cannot be resubmitted → 409", r.status === 409, r.status);
r = await call("GET", `/verifications/${proId}/status`);
check("public status readable", r.status === 200);

console.log("\n6. Service requests");
r = await call("POST", "/requests", { token: aTok, body: { professionalId: proId, description: "self" } });
check("artisan cannot book themselves", r.status === 400, r.status);
r = await call("POST", "/requests", { token: cTok, body: { professionalId: proId, description: "Fuite sous l'évier" } });
check("customer books artisan", r.status === 201, JSON.stringify(r.data).slice(0, 200));
const reqId = r.data.data._id;
r = await call("GET", `/requests/${reqId}`, { token: c2Tok });
check("stranger cannot view request → 404", r.status === 404, r.status);
r = await call("PUT", `/requests/${reqId}`, { token: c2Tok, body: { status: "CANCELLED" } });
check("stranger cannot change request", r.status === 404, r.status);
r = await call("PUT", `/requests/${reqId}`, { token: cTok, body: { status: "ACCEPTED" } });
check("customer cannot accept own request → 403", r.status === 403, r.status);
r = await call("PUT", `/requests/${reqId}`, { token: aTok, body: { status: "COMPLETED" } });
check("artisan cannot jump to COMPLETED → 403", r.status === 403, r.status);
r = await call("POST", "/payments/initiate", { token: cTok, body: { serviceRequestId: reqId, amount: 50000 } });
check("cannot pay before artisan accepts", r.status === 400, r.status);
r = await call("PUT", `/requests/${reqId}`, { token: aTok, body: { status: "ACCEPTED" } });
check("artisan accepts", r.status === 200, r.status);

console.log("\n7. Payments & escrow");
r = await call("POST", "/payments/initiate", { token: c2Tok, body: { serviceRequestId: reqId, amount: 50000, customerPhone: "670000003" } });
check("stranger cannot pay someone else's job", r.status === 404, r.status);
r = await call("POST", "/payments/initiate", { token: cTok, body: { serviceRequestId: reqId, amount: 50000 } });
check("customer initiates payment → PENDING", r.status === 201 && r.data.data.payment.status === "PENDING", JSON.stringify(r.data).slice(0, 300));
const payId = r.data.data.payment._id;
r = await call("POST", "/payments/initiate", { token: cTok, body: { serviceRequestId: reqId, amount: 50000 } });
check("duplicate payment blocked → 409", r.status === 409, r.status);
r = await call("POST", "/payments/confirm", { token: c2Tok, body: { paymentId: payId } });
check("stranger cannot confirm → 404", r.status === 404, r.status);
r = await call("POST", "/payments/confirm", { token: cTok, body: { paymentId: payId } });
check("confirmed payment is HELD in escrow (not paid out)", r.data?.data?.payment?.status === "HELD", JSON.stringify(r.data).slice(0, 300));
r = await call("GET", "/payments/history", { token: aTok });
check("artisan wallet still 0 while held", r.data.walletBalance === 0, r.data.walletBalance);
r = await call("GET", "/payments/balance", { token: cTok });
check("platform balance is admin-only", r.status === 403, r.status);
await call("PUT", `/requests/${reqId}`, { token: aTok, body: { status: "IN_PROGRESS" } });
r = await call("PUT", `/requests/${reqId}`, { token: cTok, body: { status: "COMPLETED" } });
check("customer confirms job done", r.status === 200, r.status);
r = await call("GET", "/payments/history", { token: aTok });
check("escrow released: payment SUCCESS", r.data.data[0]?.status === "SUCCESS", r.data.data[0]?.status);
check("artisan wallet credited 98% (49 000 FCFA)", r.data.walletBalance === 49000, r.data.walletBalance);

console.log("\n8. Reviews");
r = await call("POST", "/reviews", { token: c2Tok, body: { professionalId: proId, rating: 1, comment: "fake" } });
check("review without a completed job refused", r.status === 403, r.status);
r = await call("POST", "/reviews", { token: cTok, body: { professionalId: proId, rating: 5, comment: "Excellent" } });
check("real customer reviews after completed job", r.status === 201, JSON.stringify(r.data).slice(0, 200));
r = await call("POST", "/reviews", { token: cTok, body: { professionalId: proId, rating: 5, comment: "again" } });
check("second review for same job refused", r.status === 403, r.status);
r = await call("DELETE", `/requests/${reqId}`, { token: cTok });
check("completed job cannot be deleted by customer", r.status === 403, r.status);

console.log("\n9. Public data & notifications");
r = await call("GET", "/professionals");
const listed = (r.data.data || []).find((p) => p._id === proId);
check("artisan appears in public list", Boolean(listed));
check("public list hides wallet balance", listed && listed.walletBalance === undefined);
check("public list hides email", listed && !listed.userId?.email);
check("public list has real review count", listed && listed.reviewCount === 1, listed?.reviewCount);
r = await call("GET", "/notifications", { token: aTok });
check("artisan received notifications", r.status === 200 && r.data.data.some((n) => !n.isRead));
r = await call("PUT", "/notifications/read-all", { token: aTok });
check("mark all notifications read", r.status === 200);
r = await call("GET", "/notifications", { token: aTok });
check("no unread notifications left", r.data.data.every((n) => n.isRead));

console.log("\n10. Admin access & console");
r = await call("GET", "/professionals?search=" + encodeURIComponent("(a+)+$(.*)*[{"));
check("regex-like search is treated as plain text (no crash)", r.status === 200, r.status);
r = await call("GET", "/admin/overview", { token: cTok });
check("client cannot open admin overview → 403", r.status === 403, r.status);
r = await call("GET", "/admin/overview");
check("no token → 401 on admin overview", r.status === 401, r.status);
if (process.env.ADMIN_TEST_EMAIL && process.env.ADMIN_TEST_PASSWORD) {
  r = await call("POST", "/auth/login", { body: { email: process.env.ADMIN_TEST_EMAIL, password: process.env.ADMIN_TEST_PASSWORD } });
  check("admin refused on the public login", r.status === 403, r.status);
  r = await call("POST", "/admin/auth/login", { body: { email: process.env.ADMIN_TEST_EMAIL, password: process.env.ADMIN_TEST_PASSWORD } });
  check("admin portal login works", r.status === 200 && r.data.data.token, r.status);
  const adminTok = r.data?.data?.token;
  const exp = adminTok ? JSON.parse(Buffer.from(adminTok.split(".")[1], "base64url")).exp : 0;
  const hours = (exp * 1000 - Date.now()) / 3600000;
  check("admin session expires in ~2 hours", hours > 1.9 && hours <= 2.01, hours.toFixed(2));
  r = await call("GET", "/admin/overview", { token: adminTok });
  check("overview has trends, money and activity", r.status === 200 && r.data.data.series.requests.length === 6 && r.data.data.money.volume >= 50000 && r.data.data.activity.length > 0, JSON.stringify(r.data).slice(0, 200));
  check("overview counts platform fee (2% of 50 000)", r.data.data.money.platformFees >= 1000, r.data.data.money.platformFees);
  r = await call("GET", "/admin/payments?status=SUCCESS", { token: adminTok });
  check("admin payments list", r.status === 200 && r.data.data.length >= 1 && r.data.meta.total >= 1, r.status);
  r = await call("GET", "/admin/verification-requests", { token: adminTok });
  check("verification queue defaults to 'to review'", r.status === 200 && Array.isArray(r.data.data), r.status);
  r = await call("GET", "/admin/users?search=" + encodeURIComponent("(a+)+$"), { token: adminTok });
  check("admin user search escapes regex", r.status === 200, r.status);
} else {
  console.log("  (admin checks skipped: set ADMIN_TEST_EMAIL / ADMIN_TEST_PASSWORD)");
}

console.log(`\nResult: ${pass} passed, ${failCount} failed`);
process.exit(failCount ? 1 : 0);
