import { NextStep } from "../../components/page/NextStep.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"

export default function Activities() {
  return (
    <CoursePage title="กิจกรรมและวิธีประเมิน">
      <NextStep step="F3" what="กิจกรรมจัดตามประเภท · น้ำหนักรายกลุ่ม · ตรวจการเชื่อมกับ CLO" />
    </CoursePage>
  )
}
