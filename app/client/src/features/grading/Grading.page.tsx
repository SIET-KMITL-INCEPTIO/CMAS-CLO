import { NextStep } from "../../components/page/NextStep.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"

export default function Grading() {
  return (
    <CoursePage title="การตัดเกรด">
      <NextStep step="F6" what="ขั้นบันไดเกรด · ประมวลผลและตรึงเกรด · ปรับเกรดรายบุคคล" />
    </CoursePage>
  )
}
