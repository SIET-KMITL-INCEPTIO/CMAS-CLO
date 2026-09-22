// ยืนยันว่าทุกทางที่ FORMS.user.save() เปลี่ยนบัญชี เขียนลง AuthEvent จริง
//
// ทำไมต้องมี: UC 1.6 "ตรวจสอบประวัติการใช้งาน" โชว์ประวัติจาก db.authEvent ต่อ
// บัญชี — SEC-5 บอกว่า "การถูกปฏิเสธถูกบันทึก" และ AUTH_ACTION_TH ประกาศชื่อไทย
// ของ CREATE และ ROLE_SET ไว้ครบ แต่ไม่มีใครเคยตรวจว่า FORMS.user.save() — ฟังก์ชัน
// เดียวที่อยู่เบื้องหลัง UC 1.1 เพิ่มบัญชี, 1.2 แก้ไขบัญชี, และ 1.4 กำหนดบทบาท —
// เรียก authLog() จริงหรือไม่ · viewCoverage() ก็ไม่ตรวจข้อนี้ (ดู GAPS ในไฟล์)
//
// ดึงฟังก์ชันจริงจาก index-q.html มารันตรง ๆ ไม่ใช่พิมพ์ซ้ำ — พิมพ์ซ้ำจะผ่าน
// ทั้งที่ของจริงพัง ซึ่งไม่พิสูจน์อะไรเลย
//
//   node scripts/check-auth-events.js
const fs = require('fs');
const src = fs.readFileSync('docs/pages/index-q.html', 'utf8');
const grab = (a, b) => src.slice(src.indexOf(a), src.indexOf(b, src.indexOf(a)));

const authLogSrc = grab('function authLog(userId, action, detail){', '\n}') + '\n}';
// FORMS.user.save — every FORMS.*.save() opens with an identical
// "save: function(v, r){\n const t = r ||" prefix, so that alone is not a
// unique anchor; indexOf found CLO's save first and the slice ran through
// four unrelated forms into a genuine syntax error. `'u_' + Date.now()` is
// the one id prefix unique to the User form (grep confirms a single hit).
const saveSrc = grab("const t = r || { id:'u_' + Date.now() };", '\n    },\n    blocked:');
if (!saveSrc.includes("id:'u_'")) throw new Error('หา FORMS.user.save ไม่เจอ — ไฟล์เปลี่ยนโครงสร้างไปแล้ว');

const db = { user: [], authEvent: [] };
const S = { meId: 'nobody-is-editing-themself' };
const me = () => ({ id: 'admin1' });
let clamped = 0;
const clampMe = () => { clamped++; };
const clampCourse = () => { clamped++; };

const { authLog, saveUser } = new Function('db', 'me',
  authLogSrc + '\n' +
  'function saveUser(v, r, S, clampMe, clampCourse){\n' + saveSrc + '\n}\n' +
  'return { authLog, saveUser };'
)(db, me);

let bad = 0;
const scenario = (name, fn, wantAction) => {
  // authLog() ทำ db.authEvent.unshift(...) ไม่ใช่ push — แถวใหม่โผล่ที่ต้นแถว
  // เสมอ (ล่าสุดอยู่บนสุด) ดังนั้นรายการที่เพิ่งเขียนคือ N รายการแรก ไม่ใช่ท้ายแถว
  const before = db.authEvent.length;
  fn();
  const added = db.authEvent.length - before;
  const wrote = added > 0 ? db.authEvent.slice(0, added).reverse() : [];
  const gotAction = wrote.length ? wrote.map(e => e.action).join('+') : null;
  const ok = wantAction === null ? wrote.length === 0 : gotAction === wantAction;
  if (!ok) bad++;
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + name.padEnd(46) +
              'เขียน: ' + (gotAction || '(ไม่มี)') + (ok ? '' : '  ต้องการ: ' + wantAction));
};

console.log('FORMS.user.save() ต้องเขียน AuthEvent เมื่อ:');
scenario('สร้างบัญชีใหม่ (UC 1.1)',
  () => saveUser({ name: 'ก', email: 'a@fac.ac.th', role: 'INSTRUCTOR', isActive: '1' }, null, S, clampMe, clampCourse),
  'CREATE');

scenario('เปลี่ยนบทบาทระบบ (UC 1.4)',
  () => saveUser({ name: 'ข', email: 'b@fac.ac.th', role: 'ADMIN', isActive: '1' },
                 { id: 'u1', name: 'ข', email: 'b@fac.ac.th', role: 'INSTRUCTOR', isActive: true },
                 S, clampMe, clampCourse),
  'ROLE_SET');

scenario('ระงับบัญชีผ่านฟอร์มแก้ไข (ไม่ใช่ปุ่ม toggle-user)',
  () => saveUser({ name: 'ค', email: 'c@fac.ac.th', role: 'INSTRUCTOR', isActive: '0' },
                 { id: 'u2', name: 'ค', email: 'c@fac.ac.th', role: 'INSTRUCTOR', isActive: true },
                 S, clampMe, clampCourse),
  'SUSPEND');

scenario('แก้ชื่อ/อีเมลโดยผู้ดูแล (UC 1.2)',
  () => saveUser({ name: 'ง2', email: 'd@fac.ac.th', role: 'INSTRUCTOR', isActive: '1' },
                 { id: 'u3', name: 'ง', email: 'd@fac.ac.th', role: 'INSTRUCTOR', isActive: true },
                 S, clampMe, clampCourse),
  'EDIT');

scenario('บันทึกฟอร์มโดยไม่มีอะไรเปลี่ยนเลย', () =>
  saveUser({ name: 'จ', email: 'e@fac.ac.th', role: 'INSTRUCTOR', isActive: '1' },
           { id: 'u4', name: 'จ', email: 'e@fac.ac.th', role: 'INSTRUCTOR', isActive: true },
           S, clampMe, clampCourse),
  null);

scenario('เปลี่ยนบทบาท + ระงับ + แก้ชื่อ พร้อมกันในฟอร์มเดียว',
  () => saveUser({ name: 'ฉ2', email: 'f@fac.ac.th', role: 'ADMIN', isActive: '0' },
                 { id: 'u5', name: 'ฉ', email: 'f@fac.ac.th', role: 'INSTRUCTOR', isActive: true },
                 S, clampMe, clampCourse),
  'ROLE_SET+SUSPEND+EDIT');

console.log('\n' + (bad ? bad + ' สถานการณ์ที่ AuthEvent ไม่ตรงกับที่ UC 1.6 สัญญาไว้'
                        : 'ทุกทางที่ FORMS.user.save() แก้ไขบัญชี เขียนลง AuthEvent ถูกต้อง'));
process.exit(bad ? 1 : 0);
