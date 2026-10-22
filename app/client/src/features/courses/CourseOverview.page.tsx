import { NextStep } from "../../components/page/NextStep.tsx"
import { CoursePage } from "./CoursePage.tsx"

export default function CourseOverview() {
  return (
    <CoursePage title="ภาพรวม">
      <NextStep
        step="F5"
        what="การ์ดผ่านวิชา · ผู้ผ่านราย CLO · ผ่าน/ไม่ผ่านรายกิจกรรม · การกระจายคะแนน"
      />
    </CoursePage>
  )
}
