import { NextStep } from "../../components/page/NextStep.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"

export default function Roster() {
  return (
    <CoursePage title="นักศึกษาและคะแนน">
      <NextStep step="F4" what="ตารางกรอกคะแนน · รายชื่อ · นำเข้าและส่งออก Excel · ประวัติการแก้" />
    </CoursePage>
  )
}
