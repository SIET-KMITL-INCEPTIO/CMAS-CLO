# แผน CI/CD: ทดสอบเร็ว ปลอดภัย และส่งขึ้นระบบจริงได้อย่างมั่นใจ

See also: [[system-test-plan]] · [[dev]] · [[code-rule]] · [[srs]] · [[sprint-plan-2026]]

> **สร้าง:** 2026-10-24 · **สถานะ:** P1 กำลังทำบน branch `ci/harden` · P2–P6 ยังเป็นแผน
> **ตรวจกับ:** `.github/workflows/ci.yml` · `docker-build.yml` · `vitest.config.ts` (server) · `Dockerfile.prod` · การตั้งค่า repo `SIET-KMITL-INCEPTIO/CMAS-CLO` ผ่าน `gh api` ณ วันที่สร้าง

---

## 0. สรุปสั้น

CI ตอนนี้**เร็วพอแล้ว** (≈ 70 วินาทีต่อ PR) ปัญหาหลักคือ**ความปลอดภัยของตัว pipeline และของ repo** ไม่ใช่ความเร็ว
repo เป็น public แต่ `main` ไม่มีการป้องกัน และ secret scanning ปิดอยู่ ทั้งสองข้อแก้ได้ในหนึ่งวัน และควรทำก่อนอย่างอื่น

ลำดับ: **P1 ป้องกัน repo และ pipeline → P2 แยกงานให้ขนาน → P3 สแกนความปลอดภัย → P4 E2E → P5 CD → P6 nightly**

---

## 1. สถานะปัจจุบัน (วัดแล้ว)

| เรื่อง | สถานะ | หลักฐาน |
|---|---|---|
| เวลา CI ต่อ PR | ✅ 61–78 วินาที (CI) · 74–120 วินาที (Docker build) | `gh run list` 20 รอบล่าสุด |
| ตรวจ format · lint · typecheck · test · build | ✅ ครบ ใน job `verify` | `ci.yml` |
| replay migration จากศูนย์ + seed สองรอบ + test แยกรายวิชา (NFR-07) | ✅ job `isolation` บน Postgres 16 ชั่วคราว | `ci.yml` |
| build Dockerfile ทั้ง 4 ตัว | ✅ แยก check ต่อ image · มี cache | `docker-build.yml` |
| API design ตรงกับโค้ด | ✅ `check-api-design.py` + `api-contract.test.ts` | `ci.yml` |
| **branch protection บน `main`** | ❌ ไม่มี ใครมีสิทธิ์ push ก็ push ตรงได้ | `gh api …/branches/main/protection` → 404 |
| **secret scanning + push protection** | ❌ ปิด (ฟรีสำหรับ repo public) | `security_and_analysis` |
| **Dependabot security updates** | ❌ ปิด · ไม่มี `.github/dependabot.yml` | — |
| สิทธิ์ `GITHUB_TOKEN` ใน `ci.yml` | ⚠️ ไม่ประกาศ `permissions` → ได้ค่าเริ่มต้นของ repo | `ci.yml` |
| action อ้างด้วย tag (`@v4`) ไม่ใช่ commit SHA | ⚠️ tag ถูกย้ายได้ (เหตุการณ์ `tj-actions/changed-files` ปี 2025) | ทั้งสอง workflow |
| job ไม่มี `timeout-minutes` | ⚠️ job ค้างกินได้ถึง 6 ชั่วโมง | ทั้งสอง workflow |
| server test รันซ้ำสองรอบ | ⚠️ `verify` รันทั้งหมด (ข้าม DB test) แล้ว `isolation` รันทั้งหมดอีกรอบ | `ci.yml` |
| coverage | ⚠️ มี threshold 60% ใน config แต่ CI รัน `test` ไม่ใช่ `test:coverage` → **ไม่เคยถูกบังคับ** | `vitest.config.ts` |
| `Dockerfile.prod` | ⚠️ ใช้ `npm install` ไม่ใช่ `npm ci` · `package-lock.json*` ยอมให้ไม่มี lockfile · base image ไม่ pin digest | `app/server/Dockerfile.prod` |
| `xlsx` มาจาก tarball บน `cdn.sheetjs.com` | ⚠️ `npm audit` และ Dependabot มองไม่เห็นช่องโหว่ของแพ็กเกจนี้ | `package.json` ทั้งสองฝั่ง |
| E2E / ทดสอบหน้าจอ | ❌ ยังไม่มี (Playwright ระบุใน [[system-test-plan]] ว่ายังไม่ติดตั้ง) | — |
| CD (deploy) | ❌ ไม่มี workflow · `Dockerfile.prod` ระบุ Railway / Fly.io | — |

---

## 2. เป้าหมายที่วัดได้

| ด้าน | เป้าหมาย | วัดอย่างไร |
|---|---|---|
| ความเร็ว | PR ได้ผลครบ **≤ 5 นาที p50, ≤ 8 นาที p95** แม้ test จะโตขึ้น 5 เท่า | `gh run list` duration รายสัปดาห์ |
| ความเร็ว | PR ที่แก้แค่ `docs/` จบ **≤ 1 นาที** | เหมือนกัน |
| ความน่าเชื่อถือ | flaky test **< 1%** ของรอบ · ไม่มี retry อัตโนมัติซ่อนปัญหา | นับรอบที่ re-run แล้วผ่าน |
| ความปลอดภัย | **ไม่มีทาง merge เข้า `main` โดยไม่ผ่าน check** | ruleset + required checks |
| ความปลอดภัย | action ทุกตัว pin ด้วย SHA · ทุก job มี `permissions` ขั้นต่ำ และ `timeout-minutes` | `zizmor` / `actionlint` ใน CI ให้ผล 0 |
| ความปลอดภัย | ช่องโหว่ระดับ critical/high ใน dependency และ image **แก้ภายใน 7 วัน** | Dependabot alerts + Trivy |
| ความปลอดภัย | secret ระบบจริงเข้าถึงได้เฉพาะ job deploy ที่มีคนอนุมัติ ไม่มี job test ไหนเห็น | environment secrets |
| ส่งมอบ | image ที่ทดสอบ = image ที่ขึ้น production (digest เดียวกัน) | provenance attestation |

---

## 3. หลักการ

1. **Fail fast, ขนานกัน.** งานที่ไม่พึ่งกันรันพร้อมกัน งานถูกที่สุดจบก่อน
2. **Test เป็น hermetic.** CI ไม่แตะ Supabase จริงเลย ทุก DB test ใช้ Postgres ชั่วคราวที่ตายพร้อม job (เป็นอยู่แล้ว ต้องรักษาไว้)
3. **สิทธิ์น้อยที่สุด.** `permissions: {}` ที่ระดับ workflow แล้วให้เพิ่มทีละ job · secret อยู่ใน environment ไม่ใช่ระดับ repo
4. **ไม่เชื่อ code จาก fork.** repo public → PR จาก fork ห้ามได้ secret และห้ามใช้ `pull_request_target` คู่กับการ checkout โค้ด PR
5. **Build ครั้งเดียว โปรโมตต่อ.** image ถูก build ครั้งเดียวบน `main` แล้วส่ง digest เดิมไป staging และ production
6. **Migration เป็นงานที่มีคนอนุมัติ.** `prisma migrate deploy` กับฐานจริงรันใน job deploy เท่านั้น ห้าม `db push` (กฎข้อ 4 ใน CLAUDE.md)

---

## 4. รูปร่าง pipeline เป้าหมาย

```
PR ─► changes (paths-filter) ─┬─► static      format · lint · typecheck · prisma validate · api-design · actionlint/zizmor
                              ├─► unit        client + server (ไม่มี DB) + coverage ──► upload artifact
                              ├─► db          Postgres 16 · migrate deploy · drift check · seed×2 · *.db.test + isolation
                              ├─► build       client + server
                              ├─► security    dependency-review · gitleaks · CodeQL
                              ├─► docker      build 4 image · Trivy scan · SBOM
                              └─► e2e (P4)    docker compose stack · Playwright smoke
                                      │
                                      ▼
                              gate  (job เดียวที่ตั้งเป็น required check: ผ่านเมื่อทุก job ผ่านหรือถูกข้ามโดยตั้งใจ)

main ─► CI ทั้งหมดอีกรอบ ─► build + push GHCR (by digest) ─► attest provenance + SBOM
     ─► deploy staging (migrate deploy → deploy → smoke) ─► [อนุมัติด้วยคน] ─► production (digest เดิม)

nightly ─► coverage เต็ม · CodeQL extended · Trivy บน image ล่าสุด · check-diagrams · Stryker (lib/ คำนวณ)
```

**ทำไมต้องมี job `gate`:** ถ้าตั้ง required check ทีละ job แล้วใช้ path filter ข้าม job นั้นใน PR docs-only, GitHub จะรอ check ที่ไม่มีวันมาและ PR ค้าง
job `gate` ใช้ `if: always()` ตรวจ `needs.*.result` ว่าไม่มี `failure`/`cancelled` แก้ปัญหานี้ และทำให้เพิ่ม job ใหม่ได้โดยไม่ต้องแก้ ruleset

---

## 5. รายละเอียดแต่ละเรื่อง

### 5.1 ป้องกัน repo (ตั้งค่าบน GitHub ไม่ใช่โค้ด)

- **Ruleset บน `main`:** ต้องผ่าน PR · required check = `gate` (+ `Docker build` จนกว่าจะรวมเข้า gate) · ห้าม force push · ห้ามลบ branch · อย่างน้อย 1 approval จากเพื่อนในทีม · dismiss approval เมื่อมี commit ใหม่
- **เปิด** secret scanning + push protection + Dependabot alerts + security updates + private vulnerability reporting
- **CODEOWNERS:** `.github/`, `database/migrations/`, `app/server/src/modules/authorization/`, `app/server/src/middlewares/` ต้องมีเจ้าของรีวิว (ไฟล์ที่ถ้าผิดแล้วกระทบความปลอดภัยหรือข้อมูล)
- Actions settings: "Require approval for all outside collaborators" สำหรับ fork PR · default `GITHUB_TOKEN` = read-only

### 5.2 ทำให้ pipeline ปลอดภัย

- `permissions: {}` ที่หัว workflow · job ที่ต้องการให้เพิ่มเอง (เช่น `security-events: write` สำหรับ CodeQL, `packages: write` + `id-token: write` + `attestations: write` สำหรับ release)
- pin action ด้วย SHA เต็ม พร้อม comment เวอร์ชัน (`actions/checkout@<sha> # v4.2.2`) · Dependabot ecosystem `github-actions` อัปเดตให้รายสัปดาห์
- `actions/checkout` ใส่ `persist-credentials: false`
- ทุก job มี `timeout-minutes` (static 5 · unit 10 · db 15 · docker 20)
- ใช้ `step-security/harden-runner` โหมด `audit` ก่อน แล้วค่อยเป็น `block` พร้อม allowlist ปลายทาง (registry.npmjs.org, cdn.sheetjs.com, binaries.prisma.sh, ghcr.io …) เพื่อจับ dependency ที่แอบส่งข้อมูลออก
- ตรวจ workflow เองด้วย `actionlint` และ `zizmor` (หา template injection, สิทธิ์เกิน, `pull_request_target` อันตราย)
- **Dockerfile.prod:** `npm ci` · `COPY package-lock.json` (ไม่มี `*`) · `npm ci --omit=dev` ในชั้น runtime · pin `node:24-alpine@sha256:…` ให้ Dependabot ecosystem `docker` อัปเดต · คง non-root user ไว้
- **`xlsx` จาก CDN:** lockfile มี integrity hash อยู่แล้วจึงปลอดภัยจากการแก้ไฟล์กลางทาง แต่ไม่มีใครแจ้งช่องโหว่ → เพิ่ม job nightly เทียบเวอร์ชันกับหน้า release ของ SheetJS และให้ Trivy สแกน `node_modules/xlsx`

### 5.3 ทำให้ test เร็วและเชื่อถือได้

- **ตัดการรันซ้ำ:** แยก server test เป็นสอง project ใน Vitest: `unit` (ไม่รวม `*.db.test.ts` และ `*.isolation.test.ts`) กับ `db` (รวมเฉพาะสองแบบนั้น) · job `unit` รันอย่างแรก job `db` รันอย่างหลัง ไม่ซ้ำกัน
  ข้อดีรอง: job `unit` ไม่ต้องเห็น `CMAS_DB_TESTS` เลย จะไม่มี test ที่ "ข้ามเงียบ" แล้วนับว่าผ่าน
- **บังคับ coverage:** job `unit` รัน `test:coverage` · ไล่ threshold ขึ้นตาม [[dev]] §11 (คำนวณ 90% · service 80% · validator 90% · client hook 70%) โดยตั้ง threshold ต่อโฟลเดอร์ (`src/lib/**` = 90) แทนตัวเลขรวม
  กฎ ratchet: threshold ขึ้นได้ ลงไม่ได้ ถ้าจะลดต้องเขียนเหตุผลใน PR
- **Migration drift check** ใน job `db`: `prisma migrate diff --from-migrations database/migrations --to-schema-datamodel database/schema.prisma --shadow-database-url $SHADOW --exit-code`
  จับกรณีแก้ `schema.prisma` แต่ลืมสร้าง migration ซึ่งตอนนี้ไม่มีอะไรจับได้
- **DB test ขนานได้ในอนาคต:** ตอนนี้ต้องรันทีละไฟล์เพราะลบ user ของกันและกัน (comment ใน `vitest.config.ts`) · เมื่อ job `db` เกิน 3 นาที ให้แต่ละ worker ใช้ database ของตัวเอง (`CREATE DATABASE cmas_w<N> TEMPLATE cmas_seeded`) แล้วเปิด `fileParallelism` กลับ
- **Sharding** เมื่อ job `unit` เกิน 3 นาที: `vitest --shard=1/3` ใน matrix · ยังไม่ต้องทำตอนนี้ (สมมติฐานว่าคุ้มยังไม่ได้วัด)
- **Flaky:** CI ไม่ใส่ `retry` · test ที่ล้มแบบสุ่มย้ายเข้า `describe.skip` พร้อม issue และกำหนดวันแก้ใน 7 วัน · ไม่มี test ไหนอยู่ใน quarantine เกิน 2 สัปดาห์
- **Cache:** npm cache มีแล้ว · เพิ่ม cache ของ Prisma engine และ `node_modules/.vite` ฝั่ง client · Playwright browsers (P4)
- **Path filter:** แก้แค่ `docs/**` → ข้าม unit/db/docker/e2e แต่ยังรัน `check-api-design.py` เพราะอ่าน `docs/excel/api/`
- **รายงานผล:** reporter `junit` + `github-actions` ให้ test ที่ล้มแสดงเป็น annotation บนบรรทัดใน PR · coverage summary เขียนลง `$GITHUB_STEP_SUMMARY`

### 5.4 สแกนความปลอดภัย

| เครื่องมือ | จับอะไร | เมื่อไร | ล้มเมื่อ |
|---|---|---|---|
| `actions/dependency-review-action` | dependency ใหม่ใน PR ที่มีช่องโหว่หรือ license ต้องห้าม | ทุก PR | high ขึ้นไป |
| `gitleaks` | secret ที่หลุดเข้า commit (เสริม push protection ที่จับเฉพาะ pattern ของผู้ให้บริการ) | ทุก PR + nightly ทั้ง history | พบ |
| CodeQL (`javascript-typescript`) | injection, path traversal, prototype pollution ฯลฯ | ทุก PR (default) · nightly (`security-extended`) | high ขึ้นไป |
| Trivy | ช่องโหว่ OS + npm ใน image · misconfig ใน Dockerfile | ทุก PR ใน job docker · nightly บน image ล่าสุด | critical (เริ่ม) → high (หลัง 1 เดือน) |
| `npm audit signatures` | แพ็กเกจที่ provenance/signature ไม่ตรง | ทุก PR | พบ |
| SBOM (`anchore/sbom-action`, SPDX) | บัญชีของที่อยู่ใน image | release | — |
| OWASP ZAP baseline | header, cookie, การเปิดเผยข้อมูลบน HTTP | nightly กับ staging (P5) | high |

แอปเองมี test ด้านความปลอดภัยอยู่แล้ว (isolation 404 not 403, contract สิทธิ์ทุก route) ซึ่งสำคัญกว่าเครื่องมือข้างบน เพราะตรวจกฎของระบบนี้โดยตรง

### 5.5 E2E (P4)

- `docker compose` ยก client + server + Postgres ใน job · seed · Playwright เฉพาะ **smoke 5–8 เส้นทางหลัก** (เข้าระบบด้วยบัญชีทดสอบ → เปิดรายวิชา → นำเข้า Excel ไฟล์ใน `docs/excel/import-test/` → ดู attainment → ดูนักศึกษาเสี่ยง) ตาม [[system-test-plan]]
- การเข้าระบบใน E2E ใช้ route ทดสอบที่เปิดเฉพาะ `NODE_ENV=test` หรือ JWT ที่ seed ออกให้ ไม่เรียก Google จริง
- เก็บ trace + screenshot เป็น artifact เมื่อล้ม · ไม่ทำ visual regression ทุก pixel จนกว่า UI จะนิ่ง (ตามที่แผนทดสอบระบุ)

### 5.6 CD (P5)

- push image ไป GHCR ด้วย `GITHUB_TOKEN` (ไม่ต้องมี PAT) · tag = commit SHA · อ้างต่อด้วย digest
- `actions/attest-build-provenance` (keyless ผ่าน OIDC) · ตรวจ attestation ก่อน deploy ด้วย `gh attestation verify`
- GitHub Environments: `staging` (deploy อัตโนมัติจาก `main`) และ `production` (required reviewer 1 คน · deploy ได้เฉพาะจาก `main`) · token ของ Railway/Fly และ `DATABASE_URL` ของ Supabase อยู่ใน environment เท่านั้น
- ลำดับ deploy: backup/ยืนยันว่า PITR เปิด → `prisma migrate deploy` → deploy image → smoke (`/health` + login ทดสอบ + 1 GET ที่ต้องมีสิทธิ์) → ถ้าล้ม rollback เป็น digest ก่อนหน้า
- migration ต้อง **expand–contract**: เพิ่มคอลัมน์ก่อน ย้ายข้อมูล แล้วลบในรอบหลัง เพื่อให้ rollback image ได้โดยไม่ต้องย้อน schema
- Supabase staging = project แยก (หรือ branch ของ Supabase) · ห้ามใช้ฐาน production ทดสอบ

### 5.7 Nightly (P6)

`schedule` 02:00 Asia/Bangkok: coverage เต็ม · CodeQL extended · Trivy บน image `main` ล่าสุด (ช่องโหว่ใหม่เกิดได้โดยโค้ดไม่เปลี่ยน) · gitleaks ทั้ง history · `python scripts/check-diagrams.py` (รายงานอย่างเดียว เพราะตอนนี้ exit 1 จาก warning ที่รู้อยู่แล้ว) · Stryker mutation test เฉพาะ `app/server/src/lib/` (attainment, weights) เพราะเป็นสูตรที่ผิดแล้วตัวเลขเพี้ยนแต่ยังดูถูก · ล้มเมื่อไรเปิด issue อัตโนมัติ

---

## 6. แผนเป็นเฟส (หนึ่งเฟส = หนึ่ง branch)

ทุก branch แตกจาก `main` · `ci/docker-build` คงไว้เป็นที่ลอง workflow ก่อนเปิด PR จริง (merge `main` เข้าไปก่อนลอง)

| เฟส | Branch | งาน | เสร็จเมื่อ (พิสูจน์ด้วย) | ขนาด |
|---|---|---|---|---|
| **P1** ป้องกัน | `ci/harden` | §5.1 ทั้งหมด · §5.2: `permissions` · SHA pin · timeout · `persist-credentials` · `dependabot.yml` (npm, github-actions, docker) · CODEOWNERS · แก้ `Dockerfile.prod` | push ตรงเข้า `main` ถูกปฏิเสธ · PR ที่ CI แดง merge ไม่ได้ · commit ทดสอบที่มี secret ปลอมถูก push protection บล็อก · `zizmor` = 0 | 1 วัน |
| **P2** ขนาน | `ci/parallel` | แยก job ตาม §4 · `gate` · path filter · แยก Vitest project unit/db · coverage บังคับ · drift check · junit annotation | PR docs-only จบ ≤ 1 นาที · server test ไม่รันซ้ำ · PR ที่แก้ schema โดยไม่มี migration ล้ม · ลด coverage ใต้ threshold แล้วล้ม | 1–2 วัน |
| **P3** สแกน | `ci/security-scans` | §5.4 (ยกเว้น ZAP) · harden-runner audit | PR ที่เพิ่มแพ็กเกจมีช่องโหว่รู้แล้วล้ม · ผล CodeQL/Trivy ขึ้นแท็บ Security | 1 วัน |
| **P4** E2E | `ci/e2e` | §5.5 · เริ่มเมื่อหน้าจอ React ของเส้นทางหลักนิ่ง | smoke ผ่านบน compose · ทำให้ปุ่มหนึ่งพังแล้ว smoke ล้ม | 2–3 วัน |
| **P5** CD | `cd/release` | §5.6 | deploy staging อัตโนมัติ · production รอคนอนุมัติ · rollback ทดลองแล้วใช้ได้ | 2–3 วัน |
| **P6** Nightly | `ci/nightly` | §5.7 · ZAP กับ staging · harden-runner เป็น `block` | รันครบ 7 คืนติด · ล้มแล้วมี issue เปิดเอง | 1 วัน |

P1 → P2 ต้องเรียงกัน (P2 แก้ไฟล์ workflow เดียวกับ P1) · P3 ทำต่อจาก P2 · P4 กับ P5 ทำขนานกันได้ถ้าคนละคน

**ทุกเฟสต้องพิสูจน์ว่าเครื่องมือล้มได้จริง** (คอลัมน์ "เสร็จเมื่อ") check ที่ไม่เคยแดงยังไม่ได้พิสูจน์อะไร

---

## 7. ตัวชี้วัดที่ติดตามหลังทำเสร็จ

ระยะเวลา CI p50/p95 · % รอบที่ re-run แล้วผ่าน (flaky) · เวลาที่ `main` แดงก่อนแก้ · จำนวนช่องโหว่เปิดค้างแยกตามระดับและอายุ · ความถี่ deploy และ % deploy ที่ต้อง rollback (สองตัวหลังคือ DORA metrics)

---

## 8. สิ่งที่ต้องให้ทีมตัดสิน

| เรื่อง | ค่าที่จะใช้ถ้าไม่มีใครตอบ |
|---|---|
| ผู้ดูแล repo เปิด ruleset + secret scanning (ต้องเป็น admin ของ org `SIET-KMITL-INCEPTIO`) | ต้องมีคนทำ ทำแทนไม่ได้ |
| จำนวน approval ก่อน merge | 1 คน · เจ้าของ PR approve ตัวเองไม่ได้ |
| ที่ deploy: Railway หรือ Fly.io | ยังไม่ทำ P5 จนกว่าจะเลือก |
| มี Supabase project แยกสำหรับ staging หรือไม่ (มีค่าใช้จ่าย/โควตา) | ใช้ Supabase branch ถ้า plan รองรับ · ไม่งั้นข้าม staging แล้วให้ production ต้องอนุมัติเสมอ |
| ใครอนุมัติ deploy production | หัวหน้าทีม 1 คน |
