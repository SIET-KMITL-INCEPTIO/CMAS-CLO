// SEC-1 · the dispatcher gate, not the button. Fires actions the way a TA would
// by calling capOf() directly on a synthetic element, bypassing any hidden button.
const fs = require('fs');
const src = fs.readFileSync('docs/pages/index-q.html', 'utf8');
const grab = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));

const permSrc = src.slice(src.indexOf('const TEACH'), src.indexOf('};', src.indexOf('const PERM = {')) + 2);
const canSrc  = grab('function can(cap, courseId)', '/* SEC-5');
const capSrc  = grab('const READ_ACTS', '/* ── UI · ');

const S  = { role: null, course: 'c1', meId: 'u1' };
const db = { courseInstructor: [{ courseId: 'c1', userId: 'u1', role: null }] };
const scaffold = `
  const FORM_KIND = null;
  const me = () => ({ id: 'u1' });
  const courseRoleOf = (cid) => {
    if (S.role === 'ADMIN') return 'ADMIN';
    const ci = db.courseInstructor.find(x => x.courseId === cid && x.userId === me().id);
    return ci ? ci.role : null;
  };`;
const { can, capOf, PERM } = new Function('S', 'db',
  scaffold + permSrc + canSrc + capSrc + ';return { can, capOf, PERM };')(S, db);

const el = (kind, what) => ({ dataset: { kind, what, course: 'c1' } });
// action, element, expected cap, and who may fire it
const CASES = [
  ['crud-delete', el('activity'), 'activity.delete', ['INSTRUCTOR']],
  ['crud-del',    el('activity'), 'activity.delete', ['INSTRUCTOR']],
  ['crud-delete', el('student'),  'student.delete',  ['INSTRUCTOR']],
  ['crud-edit',   el('activity'), 'activity.write',  ['INSTRUCTOR']],
  ['crud-new',    el('activity'), 'activity.write',  ['INSTRUCTOR']],
  ['crud-delete', el('clo'),      'clo.write',       ['INSTRUCTOR']],
  ['crud-delete', el('band'),     'band.write',      ['INSTRUCTOR']],
  ['dup-activity',el(),           'activity.write',  ['INSTRUCTOR']],
  ['export',      el(null,'results'), 'results.export', ['INSTRUCTOR']],
  ['import',      el(null,'roster'),  'student.write',  ['INSTRUCTOR']],
  ['template',    el(),           'score.export',    ['INSTRUCTOR']],
  ['run-grading', el(),           'grading.run',     ['INSTRUCTOR']],
  // grading policy moved out of the course form (mockup feedback F2) — same owner as the ladder
  ['grading-settings', el(),      'band.write',      ['INSTRUCTOR']],
  ['save-grading',     el(),      'band.write',      ['INSTRUCTOR']],
  ['add-course',  el(),           'course.create',   ['ADMIN','INSTRUCTOR']],
  // save-course is one action for two modals. It once mapped to course.settings
  // only, which hid the create button from every ADMIN and every non-LEAD.
  ['save-course', { dataset: { mode: 'create', course: 'c1', what: 'create' } }, 'course.create',   ['ADMIN','INSTRUCTOR']],
  ['save-course', { dataset: { mode: 'edit',   course: 'c1', what: 'edit' } },   'course.settings', ['INSTRUCTOR']],
  ['save-course', { dataset: { course: 'c1', what: 'no-mode' } },               'course.settings', ['INSTRUCTOR']],
  // P16 · deleting a course: ADMIN, or the LEAD of that course. Before 2569-09-14 the
  // confirm step fell through to course.settings and refused every ADMIN.
  ['del-course',  { dataset: { course: 'c1', what: 'course' } },                'course.delete',   ['ADMIN','INSTRUCTOR']],
  ['crud-delete', el('course'),                                                 'course.delete',   ['ADMIN','INSTRUCTOR']],
  ['crud-del-confirm', el('course'),                                            'course.delete',   ['ADMIN','INSTRUCTOR']],
  ['course-edit', el(),           'course.settings', ['INSTRUCTOR']],
  ['staff-add',   el(),           'staff.write', ['ADMIN','INSTRUCTOR']],
  ['some-future-action-nobody-registered', el(), 'course.settings', ['INSTRUCTOR']],  // SEC-2
];
const ROLES = ['ADMIN','INSTRUCTOR'];
let bad = 0;
for (const [act, e, wantCap, allowed] of CASES) {
  const gotCap = capOf(act, e);
  const capOk = gotCap === wantCap;
  if (!capOk) { bad++; }
  const who = [];
  for (const r of ROLES) {
    S.role = r; db.courseInstructor[0].role = (r === 'ADMIN' ? null : r);
    const ok = can(gotCap, 'c1');
    if (ok) who.push(r);
    if (ok !== allowed.includes(r)) bad++;
  }
  console.log((capOk ? '  ' : '! ') + act.padEnd(38) + (e.dataset.kind || e.dataset.what || '-').padEnd(10) +
              gotCap.padEnd(18) + who.join(','));
}
// every cap capOf can return must exist in PERM (SEC-2 relies on it)
const caps = new Set(CASES.map(c => capOf(c[0], c[1])));
for (const c of caps) if (!(c in PERM)) { console.log('capOf returns unknown cap:', c); bad++; }
console.log('\n' + CASES.length + ' actions × ' + ROLES.length + ' roles · ' + bad + ' mismatch');
process.exit(bad ? 1 : 0);
