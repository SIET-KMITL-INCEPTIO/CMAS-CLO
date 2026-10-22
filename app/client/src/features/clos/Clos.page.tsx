import { NextStep } from "../../components/page/NextStep.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"

export default function Clos() {
  return (
    <CoursePage title="ผลลัพธ์การเรียนรู้ระดับรายวิชา (CLO)">
      <NextStep
        step="F2"
        what="เพิ่ม แก้ เรียง CLO · ระดับ Bloom และ SOLO · น้ำหนักตามแผนเทียบค่าที่คำนวณ"
      />
    </CoursePage>
  )
}
