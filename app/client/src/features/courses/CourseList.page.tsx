import { NextStep } from "../../components/page/NextStep.tsx"
import { PageHeader } from "../../components/page/PageHeader.tsx"

export default function CourseList() {
  return (
    <>
      <PageHeader title="จัดการรายวิชา" sub="ระดับระบบ" />
      <div className="cbody">
        <NextStep step="F1" what="รายวิชาทั้งหมดแบบการ์ดหรือตาราง · สร้าง · ทำสำเนา · ลบ" />
      </div>
    </>
  )
}
