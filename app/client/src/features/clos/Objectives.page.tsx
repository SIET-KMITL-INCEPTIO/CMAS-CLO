import { NextStep } from "../../components/page/NextStep.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"

export default function Objectives() {
  return (
    <CoursePage title="จุดประสงค์">
      <NextStep step="F2" what="จุดประสงค์ของแต่ละ CLO · น้ำหนักรวม 100% ต่อ CLO · แบ่งเท่ากัน" />
    </CoursePage>
  )
}
