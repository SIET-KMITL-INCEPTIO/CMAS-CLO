# Git Rules — กติกาการใช้ Git สำหรับทีม (3 คน)

เอกสารนี้สรุปกติกาการทำงานร่วมกันด้วย Git สำหรับทีมขนาด 3 คน โดยอ้างอิงแนวคิดจาก Session 01 (พื้นฐาน Git) และ Session 02 (การทำงานร่วมกับ Git และ Branching Strategy / GitFlow) ปรับให้เหมาะกับทีมเล็ก เน้นความเรียบง่ายแต่ยังคงมีระเบียบ

---

## 1. โครงสร้าง Branch หลัก

ทีมนี้ใช้ **Git Flow** (ปรับให้เหมาะกับทีม 3 คน): **ทุก branch ต้อง merge เข้า `dev` ก่อนเสมอ** ส่วน `main` รับได้เฉพาะ release และ hotfix

|Branch|แตกจาก|merge เข้า|บทบาท|
|---|---|---|---|
|`main`|-|-|โค้ดที่ปล่อยแล้ว เสถียรที่สุด ทุก commit บน `main` มี tag เวอร์ชัน **ห้าม commit ตรงๆ**|
|`dev`|`main`|-|เส้นทางรวมงานพัฒนา เป็น default branch ของ repo **ห้าม commit ตรงๆ**|
|`feature/<ชื่อ>` `fix/<ชื่อ>` `chore/<ชื่อ>` `docs/<ชื่อ>` `ci/<ชื่อ>` `test/<ชื่อ>`|`dev`|`dev`|งาน 1 เรื่องต่อ 1 branch|
|`release/<x.y.z>`|`dev`|`main` แล้ว back-merge เข้า `dev`|เตรียมออกเวอร์ชัน แก้ได้เฉพาะบั๊กที่เจอตอนเตรียม ห้ามเพิ่มฟีเจอร์|
|`hotfix/<ชื่อบั๊ก>`|`main`|`main` แล้ว back-merge เข้า `dev`|แก้บั๊กด่วนบนของที่ปล่อยแล้ว|
|`dependabot/*`|`dev`|`dev`|Dependabot เปิดให้เอง (ตั้ง `target-branch: dev`)|

### กฎที่ระบบบังคับให้ (ไม่ต้องพึ่งความจำ)

- `main` และ `dev` มี ruleset เหมือนกัน: ต้องผ่าน PR · ต้องมี approval 1 คน (เจ้าของ PR approve เองไม่ได้ · ไฟล์ใน `.github/CODEOWNERS` ต้องให้เจ้าของไฟล์อนุมัติ) · ต้องผ่าน check **`CI gate`** · ห้าม force push · ห้ามลบ branch
- job `Git Flow branch rule` ใน `ci.yml` (เป็นส่วนของ `CI gate`) ปฏิเสธ PR เข้า `main` ที่ branch ต้นทางไม่ใช่ `dev`, `release/*` หรือ `hotfix/*` ruleset กรองตามชื่อ branch ต้นทางเองไม่ได้ จึงใช้ job นี้แทน
- PR ที่เปิดเข้า `main` ผิด สามารถเปลี่ยนปลายทางเป็น `dev` ได้โดยไม่ต้องปิด (ปุ่ม Edit ข้างชื่อ PR)

### วิธี merge

- **ใช้ merge commit เสมอ** (ไม่ใช่ squash หรือ rebase) เพื่อให้ประวัติจริงของ branch ไม่หาย และ `dev` กับ `main` ไม่แตกประวัติจากกัน
- **ห้าม squash PR ที่เข้า `main`** (release, hotfix) และ PR ที่ back-merge เข้า `dev` ไม่งั้น `main` กับ `dev` จะมีประวัติคนละสาย แล้ว PR ถัดไปจะ conflict ซ้ำของเดิม

### กติกาการตั้งชื่อ Branch

- `feature/login-page` · `fix/score-upload-crash` · `release/1.2.0` · `hotfix/jwt-expiry-null-check`
- ใช้ตัวพิมพ์เล็ก คั่นด้วย `-` ห้ามเว้นวรรค ห้ามใช้ภาษาไทยในชื่อ branch
- `release/*` ใช้เลขเวอร์ชัน `x.y.z` ตรงกับ tag ที่จะติด

---

## 2. Workflow มาตรฐานเมื่อทำฟีเจอร์ใหม่

```bash
# 1. อัปเดต dev ให้ล่าสุดก่อนเสมอ
git checkout dev
git pull origin dev

# 2. แตก branch ใหม่จาก dev
git checkout -b feature/ชื่อฟีเจอร์

# 3. ทำงาน แก้ไขไฟล์ แล้ว add + commit เป็นระยะ (commit เล็กๆ ดีกว่า commit ใหญ่ก้อนเดียว)
git add .
git commit -m "feat: เพิ่มฟอร์มเข้าสู่ระบบ"

# 4. ก่อน push ให้ดึง dev ล่าสุดมา merge เข้า branch ตัวเอง (ไม่ rebase branch ที่เปิด PR แล้ว เพราะต้อง force push)
git checkout dev
git pull origin dev
git checkout feature/ชื่อฟีเจอร์
git merge dev

# 5. push ขึ้น remote
git push origin feature/ชื่อฟีเจอร์

# 6. เปิด Pull Request (PR) จาก feature/ชื่อฟีเจอร์ -> dev (ต้องเป็น dev ไม่ใช่ main)
#    ให้เพื่อนอีก 1 คนใน 2 คนที่เหลือ Review ก่อน Merge เสมอ
```

**กติกาสำคัญ:** ห้าม push ตรงเข้า `main` หรือ `dev` เด็ดขาด (รวมถึง hotfix และ release — ดูข้อ 2.1, 2.2) ทุกอย่างต้องผ่าน Pull Request และต้องมีคน **Review อย่างน้อย 1 คน** (จากทีม 3 คน จะเหลือคน Review 2 คน เลือกใครก็ได้ 1 คน) ก่อน Merge เท่านั้น

---

## 2.1 Workflow เมื่อต้องแก้บั๊กด่วน (Hotfix)

Hotfix ต่างจาก feature ตรงที่แตกออกจาก `main` (ไม่ใช่ `dev`) และ PR เข้า `main` ก่อน แล้วค่อย back-merge เข้า `dev` เพราะต้องแก้ของที่ใช้งานจริงอยู่ แต่ **ยังต้องผ่าน PR เหมือนเดิม** เพียงแค่ขอให้ทีม Review แบบเร่งด่วนเป็นกรณีพิเศษ:

```bash
# 1. แตก branch จาก main (ไม่ใช่ dev)
git checkout main
git pull origin main
git checkout -b hotfix/ชื่อบั๊ก

# 2. แก้บั๊ก แล้ว commit
git add .
git commit -m "fix: แก้บั๊กระบบชำระเงินล่ม"

# 3. push แล้วเปิด PR: hotfix/ชื่อบั๊ก -> main
#    แจ้งในกลุ่มทีมทันทีว่ามี hotfix ด่วนรอ review
git push origin hotfix/ชื่อบั๊ก

# 4. เมื่อ merge เข้า main แล้ว ให้ติด tag เวอร์ชันด้วย (เช่น v1.0.1)
git checkout main
git pull origin main
git tag v1.0.1
git push origin v1.0.1

# 5. สำคัญมาก: เอา fix เดียวกันนี้เข้า dev ด้วย ผ่าน PR (dev ห้าม push ตรง)
#    ไม่งั้น dev จะไม่มี fix ตัวนี้ และบั๊กจะกลับมาในรอบถัดไป
git checkout dev
git pull origin dev
git checkout -b chore/backmerge-v1.0.1
git merge main
git push origin chore/backmerge-v1.0.1
#    เปิด PR: chore/backmerge-v1.0.1 -> dev (merge commit ห้าม squash)
```

---

## 2.2 Workflow เมื่อออกเวอร์ชัน (Release)

```bash
# 1. แตก release จาก dev เมื่อฟีเจอร์ของรอบนี้ครบแล้ว
git checkout dev
git pull origin dev
git checkout -b release/1.2.0
git push origin release/1.2.0

# 2. บนนี้แก้ได้เฉพาะบั๊กที่เจอตอนเตรียม (fix: ...) ห้ามเพิ่มฟีเจอร์
#    งานใหม่ที่ไม่ใช่บั๊กให้ไปเข้า dev ตามปกติ รอรอบหน้า

# 3. เปิด PR: release/1.2.0 -> main  (merge commit ห้าม squash) เมื่อ CI ผ่านและมี approval
# 4. หลัง merge ติด tag บน main
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0

# 5. back-merge เข้า dev ผ่าน PR: release/1.2.0 -> dev (merge commit ห้าม squash)
#    เพื่อให้ dev มีบั๊กที่แก้ระหว่างเตรียมและมี main อยู่ในประวัติ
```

---

## 3. รูปแบบ Commit Message

ใช้รูปแบบ `<ประเภท>: <คำอธิบายสั้นๆ>` เพื่อให้ `git log` อ่านง่ายและรู้ที่มาของงาน

|ประเภท|ใช้เมื่อ|
|---|---|
|`feat:`|เพิ่มฟีเจอร์ใหม่|
|`fix:`|แก้บั๊ก|
|`docs:`|แก้ไขเอกสาร|
|`refactor:`|ปรับโครงสร้างโค้ด ไม่เปลี่ยนพฤติกรรม|
|`style:`|แก้ formatting/เว้นวรรค ไม่กระทบ logic|
|`test:`|เพิ่ม/แก้ไข test|
|`chore:`|งานจุกจิก เช่น อัปเดต dependency|

ตัวอย่าง:

```
feat: เพิ่มระบบล็อกอินด้วยอีเมล
fix: แก้บั๊กปุ่มบันทึกไม่ทำงานบนมือถือ
```

**ข้อควรจำ:** Commit Message คือส่วนที่สำคัญมาก เพราะเป็นสิ่งที่บอกว่า "ใคร ทำอะไร ทำไม" เมื่อย้อนดูประวัติด้วย `git log`

---

## 4. การจัดการ Merge Conflict

Conflict เกิดขึ้นเมื่อ Git ตัดสินใจรวมโค้ดจากสอง branch ให้อัตโนมัติไม่ได้ (เช่น 2 คนแก้บรรทัด เดียวกันในไฟล์เดียวกัน) ขั้นตอนแก้ไข:

1. เปิดไฟล์ที่ Git แจ้งว่ามี conflict — จะเห็นเครื่องหมาย:
    
    ```
    <<<<<<< HEADโค้ดของเรา (branch ปัจจุบัน)=======โค้ดจาก branch ที่กำลัง merge เข้ามา>>>>>>> feature/ชื่อฟีเจอร์
    ```
    
2. ตัดสินใจว่าจะเก็บโค้ดฝั่งไหน หรือผสมทั้งสองฝั่ง หรือเขียนใหม่
3. ลบเครื่องหมาย `<<<<<<<`, `=======`, `>>>>>>>` ออกให้หมด
4. `git add <file>` เพื่อบอกว่าแก้ conflict เสร็จแล้ว
5. `git commit -m "fix: resolve merge conflict"` เพื่อบันทึกการแก้ไข

**กติกาทีม:** ถ้า conflict เกี่ยวข้องกับโค้ดของเพื่อนโดยตรง ให้คุยกับเจ้าของโค้ดก่อนตัดสินใจ เลือกทิ้งฝั่งใดฝั่งหนึ่ง ห้ามตัดสินใจคนเดียวเงียบๆ

---

## 5. การตรวจสอบประวัติ (History)

คำสั่งที่ควรใช้เป็นประจำก่อนเริ่มงานและก่อน merge:

```bash
git log --oneline --graph --all --decorate   # ดูภาพรวม branch ทั้งหมดแบบกระชับ
git diff <branch1> <branch2>                 # เทียบความต่างระหว่าง branch
git diff --staged                             # เช็คว่ากำลังจะ commit อะไรบ้าง
```

ถ้า log ยาวเกินจอและอยากดูรวดเดียวไม่ผ่าน pager (`less`):

```bash
git --no-pager log --all --graph --oneline --decorate
```

---

## 6. Pull Request Checklist (ก่อน Merge เข้า dev/main)

- [ ] Pull `dev` ล่าสุดมา merge เข้า branch ตัวเองแล้ว ไม่มี conflict ค้าง
- [ ] โค้ดรันได้จริง ไม่มี error ที่เห็นชัด
- [ ] Commit message สื่อความหมาย อ่านแล้วเข้าใจว่าทำอะไร
- [ ] มีเพื่อนร่วมทีมอย่างน้อย 1 คน Review และกด Approve
- [ ] ลบ branch ทิ้งหลัง merge เสร็จ (`git branch -d feature/ชื่อฟีเจอร์`) เพื่อไม่ให้ repo รก

---

## 7. กติกาทั่วไปของทีม (Do / Don't)

**ควรทำ**

- Pull ก่อนเริ่มงานทุกครั้ง เพื่อลดโอกาส conflict
- Commit บ่อยๆ เป็นก้อนเล็ก มากกว่า commit ก้อนใหญ่ทีเดียว
- ตั้งชื่อ branch และ commit message ให้สื่อความหมาย
- แจ้งในกลุ่มแชททีมทุกครั้งที่เปิด PR หรือเจอ conflict ใหญ่

**ไม่ควรทำ**

- ห้าม push ตรงเข้า `main` หรือ `dev`
- ห้ามใช้ `git push --force` บน branch ที่ใช้ร่วมกัน (`main`, `dev`) เด็ดขาด
- ห้าม commit ไฟล์ขยะ เช่น `node_modules/`, ไฟล์ config ส่วนตัว, ไฟล์ทดสอบชั่วคราว (ควรตั้งค่า `.gitignore` ตั้งแต่แรก ก่อน commit แรกของโปรเจกต์ — ตัวอย่างขั้นต่ำ)
    
    ```gitignore
    node_modules/.env__pycache__/*.log.DS_Store
    ```
    
- ห้ามแก้ conflict โดยลบโค้ดของเพื่อนทิ้งโดยไม่ปรึกษา

---

## 8. อ้างอิง / ฝึกฝนเพิ่มเติม

- ฝึกใช้งาน Git Branch แบบ interactive: https://learngitbranching.js.org/
- ตั้งค่า editor ให้ใช้งานง่ายขึ้น (ถ้าไม่ถนัด Vim ตอน commit):
    
    ```bash
    git config --global core.editor "notepad.exe"
    ```
    

---

_เอกสารนี้สรุปจาก Session 01: พื้นฐาน Git และการควบคุมเวอร์ชัน และ Session 02: การทำงานร่วมกับ Git และ Branching Strategy ปรับใช้ให้เหมาะกับทีมพัฒนา 3 คน_