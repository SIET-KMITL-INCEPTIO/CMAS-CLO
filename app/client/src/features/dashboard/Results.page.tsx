import { useSearchParams } from "react-router-dom"
import { NextStep } from "../../components/page/NextStep.tsx"
import { SubTabs } from "../../components/page/PageHeader.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"

// SUBTABS.dashboard of index-q.html
const TABS = [
  { id: "percent", label: "ร้อยละราย CLO" },
  { id: "raw", label: "คะแนนดิบราย CLO" },
] as const
type Tab = (typeof TABS)[number]["id"]

export default function Results() {
  const [params, setParams] = useSearchParams()
  const view: Tab = params.get("view") === "raw" ? "raw" : "percent"
  return (
    <CoursePage title="ผลรายนักศึกษา">
      <div className="-mx-[18px] -mt-4 mb-4">
        <SubTabs tabs={TABS} value={view} onChange={(v) => setParams({ view: v })} />
      </div>
      <NextStep step="F5" what="ตารางผลทั้งชั้นราย CLO · ส่งออกตารางสอบทาน" />
    </CoursePage>
  )
}
