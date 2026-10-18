# superseded/

Older reports from Microsoft Threat Modeling Tool and the guide used to correct
them. They are kept, not deleted, so a figure quoted in an earlier meeting still
opens. Do not use any of them in a presentation: the current report is
[`../report.htm`](../report.htm).

Files are named with the date they were made. The `.tm7` model has no copy here:
`threat-model.tm7` is overwritten in place and every earlier state is in git
history.

| File | Replaced by | Why it is here |
|---|---|---|
| `report_2026-10-14.htm` | `../report.htm` | First report. 66 threats, all from `Layer1` (`Layer0` produced none). Drawn before DFD v1.3 was matched, and without trust boundaries, so the report has no Repudiation threats |
| `report_2026-10-15.htm` | `../report.htm` | 172 threats, but `Layer2` was a copy of `Layer1`, so every threat was counted twice. Layer0 had 0 threats because the system was drawn as an External Interactor. No trust boundaries, so no Repudiation |
| `report_2026-10-17_v3-6.htm` | `../report.htm` | Same model as the current report apart from copy-and-paste of two pages: 44 mentions in the threats of `Layer2-p4` and `Layer2-p6` still named the stores by their old numbers (`D4 นักศึกษา`, `D5 คะแนน`) after the boxes were renamed to `D4 คะแนน` and `D5 นักศึกษา` |
| `tm7-fix-checklist_2026-10-17.md` | `../report.htm` | Work list for bringing the `.tm7` in line with DFD v1.3. Done; kept for how each difference was found |

`report-version3` to `3-5` and `report-version4` were intermediate exports during the
same fix and are not in the repository.
