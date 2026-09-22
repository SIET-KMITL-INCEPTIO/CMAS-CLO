// Runs the REAL can() from index-q.html against the written target matrix.
// Pulls the PERM block and the can() body out of the file rather than retyping
// them — a copy would pass while the file was wrong, which proves nothing.
const fs = require('fs');
const src = fs.readFileSync('docs/pages/index-q.html', 'utf8');

const permSrc = src.slice(src.indexOf("const TEACH"), src.indexOf('};', src.indexOf('const PERM = {')) + 2);
const canSrc  = src.slice(src.indexOf('function can(cap, courseId)'),
                          src.indexOf('/* SEC-5'));

// minimal world: one course, one instructor row per role. Built with new Function
// so the extracted `const PERM` / `function can` land in a scope this file can see
// — a plain eval() of a const declaration keeps it inside the eval and is invisible.
const S  = { role: null, course: 'c1', meId: 'u1' };
S.me = { id: 'u1', isActive: true };   // shared with the extracted can() — see the P17 block
const db = { courseInstructor: [{ courseId: 'c1', userId: 'u1', role: null }] };
const scaffold = `
  const me = () => S.me;
  const courseRoleOf = (cid) => {
    if (S.role === 'ADMIN') return 'ADMIN';
    const ci = db.courseInstructor.find(x => x.courseId === cid && x.userId === me().id);
    return ci ? ci.role : null;
  };`;
const { PERM, can } = new Function('S', 'db',
  scaffold + permSrc + canSrc + ';return { PERM, can };')(S, db);

// ── the target, typed from the agreed table — the thing under test ──
// D1 (2569-09-14) · one course role. Every instructor on a course holds the same rights;
// ADMIN still never works inside a course (ASM-03b).
const T = ['INSTRUCTOR'], A = ['ADMIN'];
const TARGET = {
  'score.edit':T, 'score.import':T, 'score.export':T, 'student.write':T,
  'activity.write':T, 'results.export':T,
  'student.delete':T, 'activity.delete':T,
  'clo.write':T, 'band.write':T, 'grading.run':T, 'grade.override':T, 'course.settings':T,
  'staff.write':['ADMIN','INSTRUCTOR'],
  'course.create':['ADMIN','INSTRUCTOR'], 'course.delete':['ADMIN','INSTRUCTOR'], 'user.manage':A,
};

const ROLES = ['ADMIN','INSTRUCTOR'];
let bad = 0, cells = 0;
const missing = Object.keys(TARGET).filter(k => !(k in PERM));
const extra   = Object.keys(PERM).filter(k => !(k in TARGET));
if (missing.length) { console.log('MISSING from PERM:', missing); bad += missing.length; }
if (extra.length)   { console.log('EXTRA in PERM:', extra);      bad += extra.length; }

const w = 18;
console.log('cap'.padEnd(w) + ROLES.map(r => r.padStart(10)).join(''));
for (const cap of Object.keys(TARGET)) {
  const row = [];
  for (const r of ROLES) {
    S.role = r;
    db.courseInstructor[0].role = (r === 'ADMIN' ? null : r);
    const got  = can(cap, 'c1');
    const want = TARGET[cap].includes(r);
    cells++;
    if (got !== want) { bad++; row.push(((got?'Y':'n') + '!want' + (want?'Y':'n')).padStart(10)); }
    else row.push((got ? 'Y' : '.').padStart(10));
  }
  console.log(cap.padEnd(w) + row.join(''));
}
// SEC-2 · an unregistered capability must be refused for everyone
for (const r of ROLES) {
  S.role = r; db.courseInstructor[0].role = (r === 'ADMIN' ? null : r);
  cells++;
  if (can('some.capability.nobody.registered', 'c1')) { bad++; console.log('SEC-2 FAIL for', r); }
}
// unaffiliated user must get nothing course-scoped
S.role = 'INSTRUCTOR'; db.courseInstructor[0].role = 'INSTRUCTOR'; db.courseInstructor[0].courseId = 'cOTHER';
for (const cap of Object.keys(TARGET)) {
  // course-scoped caps: an instructor of another course must get none of them on c1
  if (['course.create','user.manage'].includes(cap)) continue;
  cells++;
  if (can(cap, 'c1')) { bad++; console.log('unaffiliated instructor got', cap); }
}

// P17 · course.create has no course to check against. Since 2569-09-14 any
// ACTIVE instructor may create one, including a new instructor on no course:
// the creator becomes LEAD of an empty new course, never of someone else's.
// The suspended case proves the branch still refuses someone, so this block
// cannot pass by returning true unconditionally.
const CREATE = [
  ['ผู้สอนในวิชาที่กำลังดูอยู่',             [['c1','INSTRUCTOR']],              true ],
  ['ผู้สอนในวิชาอื่นเท่านั้น',               [['c9','INSTRUCTOR']],              true ],
  ['ไม่สังกัดรายวิชาใดเลย (ผู้สอนใหม่)',     [],                                 true ],
  ['บัญชีถูกระงับ',                         [['c1','INSTRUCTOR']],              'SUSPENDED'],
];
S.role = 'INSTRUCTOR';
for (let [name, rows, want] of CREATE) {
  db.courseInstructor.length = 0;
  for (const [cid, role] of rows) db.courseInstructor.push({ courseId: cid, userId: 'u1', role });
  const suspended = want === 'SUSPENDED';
  S.me.isActive = !suspended;
  const got = can('course.create');
  S.me.isActive = true;
  if (suspended) want = false;
  cells++;
  if (got !== want) { bad++; console.log('! SEC-4 course.create · ' + name + ': got ' + got + ' want ' + want); }
  else console.log('  course.create · ' + name.padEnd(40) + (got ? 'สร้างได้' : 'สร้างไม่ได้'));
}

console.log('\n' + cells + ' cells checked · ' + bad + ' mismatch');
process.exit(bad ? 1 : 0);
