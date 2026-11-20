Attribute VB_Name = "modCmasSync"
' CMAS add-in for Excel - two-way score sync (FR-76).
'
'   CMAS -> Excel   every 10 s: GET /courses/:id/revision; when it moved,
'                   reload the grid (all pages) and redraw the values.
'   Excel -> CMAS   2 s after the last edit: PUT /courses/:id/scores with
'                   `from` = the value CMAS last confirmed for each cell.
'
' The data workbook is a plain .xlsx with no macros. Next to the visible sheet
' it holds a very hidden sheet "_cmas": the ids and the last value CMAS
' confirmed for every cell (the "base"). Nothing secret is in it. Because the
' base survives a save, edits made while disconnected are found on the next
' connect and sent with the right `from`, so a conflict is still a conflict.
'
' Rules this module keeps:
'  - a cleared cell deletes a score only after the instructor says yes (FR-62)
'  - grey cells (closed activity, withdrawn student) cannot be edited
'  - a cell somebody else changed meanwhile turns red with CMAS's value in a
'    note, and is not overwritten until the instructor chooses (D-3)
'  - text from the server is written as text, never as a formula
'  - no Excel data validation: its relative formulas are computed from the
'    ACTIVE cell, a known trap; values are checked here on every change,
'    which also covers pasting, which validation does not see
Option Explicit

Private Const SHEET_BASE As String = "_cmas"
Private Const ROW_TITLE As Long = 1
Private Const ROW_STATUS As Long = 2
Private Const ROW_HEAD As Long = 3
Private Const FIRST_ROW As Long = 4
Private Const COL_CODE As Long = 1
Private Const COL_NAME As Long = 2
Private Const FIRST_COL As Long = 3
Private Const PER_PAGE As Long = 200
Private Const POLL_SECONDS As Long = 10
Private Const FLUSH_SECONDS As Long = 2
Private Const BATCH As Long = 500
Private Const RED As Long = 13551615   ' RGB(255, 199, 206)
Private Const GREY As Long = 15921906  ' RGB(242, 242, 242)

' Base sheet layout (same coordinates as the visible sheet where it matters):
'   A1 courseId     B1 <id>
'   A2 sheet        B2 <visible sheet name>
'   A3 shape        B3 <signature of activities and students>
'   row 1, col c >= FIRST_COL: maxScore     row 2: 1 if the activity is closed
'   row 3, col c: activityId
'   col A, row r >= FIRST_ROW: studentId    col B: 1 if withdrawn
'   (r, c) in the score area: the base value ("" / number / "x")

Private mEvents As clsCmasAppEvents
Private mBook As Workbook
Private mSheet As Worksheet
Private mBase As Worksheet
Private mCourseId As String
Private mRevision As Long
Private mLastRow As Long
Private mLastCol As Long
Private mRowOf As clsCmasMap
Private mColOf As clsCmasMap
Private mLocked As clsCmasMap
Private mDirty As clsCmasMap
Private mConflict As clsCmasMap
Private mApplying As Boolean
Private mFlushPending As Boolean
Private mTickPending As Boolean
Private mBusy As Boolean

' ---------------------------------------------------------------- start / stop

' Called by modCmasAuth once the add-in holds a token for `courseId`.
Public Sub CmasStartSync(ByVal courseId As String, ByVal courseLabel As String)
    InitState
    mCourseId = courseId
    mRevision = -1
    Set mEvents = New clsCmasAppEvents
    Set mEvents.App = Application

    If Not AttachExistingBook(courseId) Then CreateBook courseLabel
    CollectOfflineEdits
    RunSync True
    ScheduleTick
End Sub

Public Sub CmasStopSync()
    Set mEvents = Nothing
    If Not mSheet Is Nothing Then
        On Error Resume Next
        SetStatus T("disconnected")
        On Error GoTo 0
    End If
End Sub

Private Sub InitState()
    Set mRowOf = New clsCmasMap
    Set mColOf = New clsCmasMap
    Set mLocked = New clsCmasMap
    Set mDirty = New clsCmasMap
    Set mConflict = New clsCmasMap
    mLastRow = FIRST_ROW - 1
    mLastCol = FIRST_COL - 1
End Sub

Private Function Ready() As Boolean
    Dim probe As String
    If CmasToken = "" Or mBook Is Nothing Or mSheet Is Nothing Then Exit Function
    On Error Resume Next
    probe = mBook.Name & mSheet.Name   ' fails once the workbook was closed
    Ready = (Err.Number = 0)
    Err.Clear
End Function

' ---------------------------------------------------------------- timers

Private Function Q(ByVal macro As String) As String
    ' Qualified with the add-in's name, so a macro of the same name in another
    ' open workbook is never the one that runs.
    Q = "'" & ThisWorkbook.Name & "'!" & macro
End Function

Private Sub ScheduleTick()
    If mTickPending Then Exit Sub
    mTickPending = True
    Application.OnTime Now + TimeSerial(0, 0, POLL_SECONDS), Q("CmasTick")
End Sub

Private Sub ScheduleFlush()
    If mFlushPending Then Exit Sub
    mFlushPending = True
    Application.OnTime Now + TimeSerial(0, 0, FLUSH_SECONDS), Q("CmasFlushNow")
End Sub

Public Sub CmasTick()
    mTickPending = False
    If Not Ready() Then Exit Sub        ' disconnected or the workbook closed: stop polling
    RunSync False
    ScheduleTick
End Sub

Public Sub CmasFlushNow()
    mFlushPending = False
    If Not Ready() Then Exit Sub
    If mBusy Then ScheduleFlush: Exit Sub
    mBusy = True
    On Error GoTo failed
    Flush
    mBusy = False
    Exit Sub
failed:
    mBusy = False
    SetStatus T("stOffline")
End Sub

' Ribbon: send now, then reload whether or not the revision moved.
Public Sub CmasSyncNow()
    If Not Ready() Then MsgBox T("notConnected"), vbInformation, "CMAS": Exit Sub
    RunSync True
End Sub

Private Sub RunSync(ByVal forcePull As Boolean)
    If mBusy Then Exit Sub
    mBusy = True
    On Error GoTo failed
    Flush
    ' Never redraw over edits that are not in CMAS yet.
    If mDirty.Count = 0 Then PullIfChanged forcePull
    mBusy = False
    Exit Sub
failed:
    mBusy = False
    SetStatus T("stOffline")
End Sub

' ---------------------------------------------------------------- CMAS -> Excel

Private Function Url(ByVal tail As String) As String
    Url = CmasBaseUrl & "/courses/" & mCourseId & tail
End Function

' True when the answer can be used. Otherwise says why in the status row.
Private Function Usable(ByVal status As Long) As Boolean
    Select Case status
    Case 200, 201
        Usable = True
    Case 401, 404
        ' Revoked, expired, account switched off, or taken off the course.
        CmasForgetToken
        SetStatus T("stLost")
    Case Else
        SetStatus T("stOffline")
    End Select
End Function

Private Sub PullIfChanged(ByVal force As Boolean)
    Dim status As Long, body As String, root As Variant, rev As Long
    Dim acts As Collection, studs As Collection

    status = SafeRequest("GET", Url("/revision"), "", CmasToken, body)
    If Not Usable(status) Then Exit Sub
    JsonParse body, root
    rev = CLng(JPath(root, "data", "revision"))
    If rev = mRevision And Not force Then
        SetLiveStatus
        Exit Sub
    End If

    If Not FetchGrid(acts, studs) Then Exit Sub
    Render acts, studs
    ' Read before the grid: a write that lands during the fetch moves the
    ' number again, and the next tick reloads. Never the other way round.
    mRevision = rev
    SetLiveStatus
End Sub

Private Function FetchGrid(ByRef acts As Collection, ByRef studs As Collection) As Boolean
    Dim page As Long, status As Long, body As String, root As Variant
    Dim pageStudents As Collection, s As Variant, total As Long
    Set studs = New Collection
    page = 1
    Do
        status = SafeRequest("GET", Url("/scores?status=ALL&perPage=" & PER_PAGE & "&page=" & page), _
                             "", CmasToken, body)
        If Not Usable(status) Then Exit Function
        JsonParse body, root
        Set acts = JPath(root, "data", "activities")
        Set pageStudents = JPath(root, "data", "students")
        For Each s In pageStudents
            studs.Add s
        Next s
        total = CLng(JPath(root, "meta", "total"))
        If studs.Count >= total Or pageStudents.Count = 0 Then Exit Do
        page = page + 1
    Loop
    FetchGrid = True
End Function

Private Function Signature(ByVal acts As Collection, ByVal studs As Collection) As String
    Dim a As Variant, s As Variant, out As String
    For Each a In acts
        out = out & a("id") & "|" & a("name") & "|" & JsonNum(a("maxScore")) & "|" & _
              IIf(IsNull(a("closedAt")), "", "c") & ";"
    Next a
    out = out & "#"
    For Each s In studs
        out = out & s("id") & "|" & s("studentCode") & "|" & s("name") & "|" & s("status") & ";"
    Next s
    Signature = out
End Function

Private Sub Render(ByVal acts As Collection, ByVal studs As Collection)
    Dim sig As String, hadTable As Boolean
    Dim errNo As Long, errSrc As String, errDesc As String
    sig = Signature(acts, studs)
    hadTable = (mLastRow >= FIRST_ROW)
    Application.ScreenUpdating = False
    mApplying = True
    On Error GoTo finish
    Unprotect
    If CStr(mBase.Range("B3").Value) <> sig Then
        If hadTable And mConflict.Count > 0 Then
            ' Red cells cannot be kept across a redraw; say so rather than drop them silently.
            MsgBox T("structureChanged"), vbInformation, "CMAS"
        End If
        DrawLayout acts, studs, sig
    End If
    FillValues acts, studs
finish:
    ' Saved first: the On Error inside Protect clears Err.
    errNo = Err.Number: errSrc = Err.Source: errDesc = Err.Description
    Protect
    mApplying = False
    Application.ScreenUpdating = True
    If errNo <> 0 Then Err.Raise errNo, errSrc, errDesc
End Sub

Private Sub DrawLayout(ByVal acts As Collection, ByVal studs As Collection, ByVal sig As String)
    Dim j As Long, i As Long, a As Variant, s As Variant, r As Long, c As Long
    Dim closed() As Boolean, withdrawn() As Boolean, title As String

    title = CStr(mSheet.Cells(ROW_TITLE, 1).Value)
    mSheet.Cells.Clear
    mSheet.Cells.ClearComments
    mBase.Cells.Clear
    mRowOf.Clear: mColOf.Clear: mLocked.Clear: mDirty.Clear: mConflict.Clear

    mBase.Range("A1").Value = "courseId": mBase.Range("B1").Value = mCourseId
    mBase.Range("A2").Value = "sheet": mBase.Range("B2").Value = mSheet.Name
    mBase.Range("A3").Value = "shape": mBase.Range("B3").Value = sig

    WriteText mSheet.Cells(ROW_TITLE, 1), title
    WriteText mSheet.Cells(ROW_HEAD, COL_CODE), T("hdrCode")
    WriteText mSheet.Cells(ROW_HEAD, COL_NAME), T("hdrName")

    mLastCol = FIRST_COL + acts.Count - 1
    mLastRow = FIRST_ROW + studs.Count - 1
    If acts.Count > 0 Then ReDim closed(FIRST_COL To mLastCol)
    If studs.Count > 0 Then ReDim withdrawn(FIRST_ROW To mLastRow)

    j = 0
    For Each a In acts
        c = FIRST_COL + j
        mColOf.Put a("id"), c
        mBase.Cells(1, c).Value = a("maxScore")
        closed(c) = Not IsNull(a("closedAt"))
        mBase.Cells(2, c).Value = IIf(closed(c), 1, 0)
        mBase.Cells(ROW_HEAD, c).Value = a("id")
        WriteText mSheet.Cells(ROW_HEAD, c), a("name") & " " & T("hdrMax", JsonNum(a("maxScore")))
        j = j + 1
    Next a

    i = 0
    For Each s In studs
        r = FIRST_ROW + i
        mRowOf.Put s("id"), r
        mBase.Cells(r, 1).Value = s("id")
        withdrawn(r) = (s("status") = "WITHDRAWN")
        mBase.Cells(r, 2).Value = IIf(withdrawn(r), 1, 0)
        WriteText mSheet.Cells(r, COL_CODE), s("studentCode")
        WriteText mSheet.Cells(r, COL_NAME), s("name")
        i = i + 1
    Next s

    ' Grey, locked cells: a closed activity's column, a withdrawn student's row.
    If acts.Count > 0 And studs.Count > 0 Then
        With mSheet.Range(mSheet.Cells(FIRST_ROW, FIRST_COL), mSheet.Cells(mLastRow, mLastCol))
            .Locked = False
            .NumberFormat = "General"
        End With
        For r = FIRST_ROW To mLastRow
            For c = FIRST_COL To mLastCol
                If closed(c) Or withdrawn(r) Then
                    mLocked.Put Key(r, c), True
                    mSheet.Cells(r, c).Locked = True
                    mSheet.Cells(r, c).Interior.Color = GREY
                End If
            Next c
        Next r
    End If

    mSheet.Rows(ROW_HEAD).Font.Bold = True
    mSheet.Rows(ROW_TITLE).Font.Bold = True
    mSheet.Columns(COL_CODE).ColumnWidth = 14
    mSheet.Columns(COL_NAME).ColumnWidth = 28
    If mLastCol >= FIRST_COL Then
        mSheet.Range(mSheet.Columns(FIRST_COL), mSheet.Columns(mLastCol)).ColumnWidth = 14
        mSheet.Rows(ROW_HEAD).WrapText = True
    End If
End Sub

' Server values into the base everywhere, and into the visible sheet except
' where the instructor has an edit CMAS has not taken yet.
Private Sub FillValues(ByVal acts As Collection, ByVal studs As Collection)
    Dim nA As Long, nS As Long, area As Range, baseArea As Range
    Dim shown As Variant, base As Variant, i As Long, j As Long
    Dim s As Variant, a As Variant, scores As Variant, v As Variant, k As String
    nA = acts.Count: nS = studs.Count
    If nA = 0 Or nS = 0 Then Exit Sub

    Set area = mSheet.Range(mSheet.Cells(FIRST_ROW, FIRST_COL), mSheet.Cells(mLastRow, mLastCol))
    Set baseArea = mBase.Range(mBase.Cells(FIRST_ROW, FIRST_COL), mBase.Cells(mLastRow, mLastCol))
    shown = AsGrid(area.Value, nS, nA)
    ReDim base(1 To nS, 1 To nA)

    i = 0
    For Each s In studs
        i = i + 1
        Set scores = s("scores")
        j = 0
        For Each a In acts
            j = j + 1
            If scores.Exists(CStr(a("id"))) Then v = scores(CStr(a("id"))) Else v = Null
            base(i, j) = ToCell(v)
            k = Key(FIRST_ROW + i - 1, FIRST_COL + j - 1)
            If mConflict.Exists(k) Then
                ' CMAS now holds what the instructor typed: nothing left to decide.
                If Norm(shown(i, j)) = Norm(base(i, j)) Then
                    mConflict.Remove k
                    ClearMark mSheet.Cells(FIRST_ROW + i - 1, FIRST_COL + j - 1)
                End If
            ElseIf Not mDirty.Exists(k) Then
                shown(i, j) = base(i, j)
            End If
        Next a
    Next s

    area.Value = shown
    baseArea.Value = base
End Sub

' A Range.Value is a scalar for one cell and a 2-D array otherwise.
Private Function AsGrid(ByVal v As Variant, ByVal nRows As Long, ByVal nCols As Long) As Variant
    Dim out() As Variant
    If IsArray(v) Then AsGrid = v: Exit Function
    ReDim out(1 To nRows, 1 To nCols)
    out(1, 1) = v
    AsGrid = out
End Function

' ---------------------------------------------------------------- Excel -> CMAS

' From clsCmasAppEvents for every edit in every workbook.
Public Sub OnSheetChange(ByVal Sh As Object, ByVal Target As Range)
    Dim area As Range, cell As Range, k As String, n As String
    Dim bad As Boolean, locked As Boolean
    If mApplying Or mSheet Is Nothing Then Exit Sub
    If Not Sh Is mSheet Then Exit Sub
    If mLastRow < FIRST_ROW Or mLastCol < FIRST_COL Then Exit Sub
    Set area = Application.Intersect(Target, ScoreArea())
    If area Is Nothing Then Exit Sub

    For Each cell In area.Cells
        k = Key(cell.Row, cell.Column)
        If mLocked.Exists(k) Then
            RevertCell cell
            locked = True
        Else
            n = Norm(cell.Value)
            If Not IsAllowed(n, cell.Column) Then
                RevertCell cell
                bad = True
            Else
                If mConflict.Exists(k) Then
                    ' Typing into a red cell is the decision.
                    mConflict.Remove k
                    ClearMark cell
                End If
                If n = Norm(mBase.Cells(cell.Row, cell.Column).Value) Then
                    mDirty.Remove k
                Else
                    mDirty.Put k, True
                End If
            End If
        End If
    Next cell

    If bad Then MsgBox T("badValue"), vbExclamation, T("badValueTitle")
    If locked Then MsgBox T("locked"), vbExclamation, "CMAS"
    If mDirty.Count > 0 Then ScheduleFlush
End Sub

Private Sub Flush()
    Dim keys As Collection, sent As Collection, clears As Collection
    Dim k As Variant, body As String, items As String, n As Long
    Dim status As Long, resp As String

    If mDirty.Count = 0 Then Exit Sub
    If CmasToken = "" Then SetStatus T("stLost"): Exit Sub

    ' FR-62: an empty cell is "not assessed yet", so clearing one deletes a score. Ask.
    Set clears = New Collection
    For Each k In mDirty.Keys
        If Norm(CellAt(k).Value) = "" And Norm(BaseAt(k).Value) <> "" Then clears.Add k
    Next k
    If clears.Count > 0 Then
        If MsgBox(T("confirmClear", CStr(clears.Count)), _
                  vbYesNo + vbExclamation + vbDefaultButton2, "CMAS") = vbNo Then
            For Each k In clears
                RevertCell CellAt(k)
                mDirty.Remove k
            Next k
        End If
    End If
    If mDirty.Count = 0 Then Exit Sub

    Set keys = mDirty.Keys
    Set sent = New Collection
    For Each k In keys
        If n >= BATCH Then Exit For
        If n > 0 Then items = items & ","
        items = items & "{""studentId"":" & JsonStr(mBase.Cells(RowOf(k), 1).Value) & _
                ",""activityId"":" & JsonStr(mBase.Cells(ROW_HEAD, ColOf(k)).Value) & _
                ",""score"":" & ToJson(Norm(CellAt(k).Value)) & _
                ",""from"":" & ToJson(Norm(BaseAt(k).Value)) & "}"
        sent.Add k
        n = n + 1
    Next k
    body = "{""scores"":[" & items & "]}"

    SetStatus T("stSending", CStr(n))
    status = SafeRequest("PUT", Url("/scores"), body, CmasToken, resp)

    Select Case status
    Case 200
        For Each k In sent
            BaseAt(k).Value = ToCell(FromNorm(Norm(CellAt(k).Value)))
            mDirty.Remove k
        Next k
        SetLiveStatus
    Case 409
        TakeConflicts resp
    Case 422
        TakeRefusals resp
    Case 401, 404
        CmasForgetToken
        SetStatus T("stLost")
        Exit Sub
    Case 0, 429, 500 To 599
        SetStatus T("stOffline")   ' kept; the next tick tries again
        Exit Sub
    Case Else
        MsgBox T("unexpected", CStr(status)), vbExclamation, "CMAS"
        For Each k In sent
            RevertCell CellAt(k)
            mDirty.Remove k
        Next k
    End Select

    ' A batch limit, or the cells that were fine in a refused batch: send the rest soon.
    If mDirty.Count > 0 Then ScheduleFlush
End Sub

' 409: nothing was written. The cells somebody else changed turn red; the rest go again.
Private Sub TakeConflicts(ByVal resp As String)
    Dim root As Variant, list As Variant, c As Variant, k As String, n As Long
    JsonParse resp, root
    If Not IsObject(JPath(root, "errors", "cells")) Then SetStatus T("stOffline"): Exit Sub
    Set list = JPath(root, "errors", "cells")
    For Each c In list
        k = KeyOfIds(c("studentId"), c("activityId"))
        If k <> "" Then
            BaseAt(k).Value = ToCell(c("current"))
            mDirty.Remove k
            mConflict.Put k, True
            MarkConflict CellAt(k), c("current")
            n = n + 1
        End If
    Next c
    SetStatus T("stConflict", CStr(mConflict.Count))
    If n > 0 Then MsgBox T("conflictMsg", CStr(n)), vbExclamation, "CMAS"
End Sub

' 422: nothing was written. The refused cells go back to CMAS's value, with the reasons.
Private Sub TakeRefusals(ByVal resp As String)
    Dim root As Variant, refused As Variant, x As Variant, k As String
    Dim n As Long, reasons As String
    JsonParse resp, root
    If Not IsObject(JPath(root, "errors", "rows")) Then SetStatus T("stOffline"): Exit Sub
    Set refused = JPath(root, "errors", "rows")
    For Each x In refused
        k = KeyOfIds(x("studentId"), x("activityId"))
        If k <> "" Then
            RevertCell CellAt(k)
            mDirty.Remove k
            n = n + 1
            If n <= 5 Then
                reasons = reasons & "- " & mSheet.Cells(RowOf(k), COL_CODE).Value & ": " & x("reason") & vbLf
            End If
        End If
    Next x
    If n > 0 Then MsgBox T("refusedMsg", CStr(n), reasons), vbExclamation, "CMAS"
End Sub

' ---------------------------------------------------------------- red cells (ribbon)

' "Use mine": CMAS's value is already the base, so sending now overwrites it on purpose.
Public Sub CmasKeepMine()
    Dim cell As Range, k As String, n As Long
    If Not Ready() Then MsgBox T("notConnected"), vbInformation, "CMAS": Exit Sub
    For Each cell In SelectedScoreCells()
        k = Key(cell.Row, cell.Column)
        If mConflict.Exists(k) Then
            mConflict.Remove k
            ClearMark cell
            If Norm(cell.Value) <> Norm(mBase.Cells(cell.Row, cell.Column).Value) Then mDirty.Put k, True
            n = n + 1
        End If
    Next cell
    If n = 0 Then MsgBox T("noConflictHere"), vbInformation, "CMAS": Exit Sub
    CmasFlushNow
End Sub

' "Use CMAS's": drop what was typed.
Public Sub CmasTakeServer()
    Dim cell As Range, k As String, n As Long
    For Each cell In SelectedScoreCells()
        k = Key(cell.Row, cell.Column)
        If mConflict.Exists(k) Then
            mConflict.Remove k
            RevertCell cell
            ClearMark cell
            n = n + 1
        End If
    Next cell
    If n = 0 Then MsgBox T("noConflictHere"), vbInformation, "CMAS": Exit Sub
    If mConflict.Count = 0 Then SetLiveStatus Else SetStatus T("stConflict", CStr(mConflict.Count))
End Sub

Private Function SelectedScoreCells() As Collection
    Dim out As New Collection, area As Range, cell As Range
    Set SelectedScoreCells = out
    If mSheet Is Nothing Then Exit Function
    If mLastRow < FIRST_ROW Or mLastCol < FIRST_COL Then Exit Function
    If Not ActiveSheet Is mSheet Then Exit Function
    If TypeName(Selection) <> "Range" Then Exit Function
    Set area = Application.Intersect(Selection, ScoreArea())
    If area Is Nothing Then Exit Function
    For Each cell In area.Cells
        out.Add cell
    Next cell
End Function

' ---------------------------------------------------------------- the workbook

' Reuse an open workbook that already holds this course (edits made offline included).
Private Function AttachExistingBook(ByVal courseId As String) As Boolean
    Dim wb As Workbook, ws As Worksheet
    For Each wb In Application.Workbooks
        Set ws = Nothing
        On Error Resume Next
        Set ws = wb.Worksheets(SHEET_BASE)
        On Error GoTo 0
        If Not ws Is Nothing Then
            If CStr(ws.Range("B1").Value) = courseId Then
                Set mBook = wb
                Set mBase = ws
                Set mSheet = VisibleSheet(wb, CStr(ws.Range("B2").Value))
                RebuildMaps
                Protect
                AttachExistingBook = True
                Exit Function
            End If
        End If
    Next wb
End Function

' The course sheet by the name recorded, or the first visible sheet if it was renamed.
Private Function VisibleSheet(ByVal wb As Workbook, ByVal recorded As String) As Worksheet
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = wb.Worksheets(recorded)
    On Error GoTo 0
    If ws Is Nothing Then
        For Each ws In wb.Worksheets
            If ws.Visible = xlSheetVisible Then Exit For
        Next ws
    End If
    Set VisibleSheet = ws
End Function

Private Sub CreateBook(ByVal courseLabel As String)
    Set mBook = Application.Workbooks.Add(xlWBATWorksheet)
    Set mSheet = mBook.Worksheets(1)
    mSheet.Name = SafeSheetName(courseLabel)
    Set mBase = mBook.Worksheets.Add(After:=mSheet)
    mBase.Name = SHEET_BASE
    mBase.Range("A1").Value = "courseId": mBase.Range("B1").Value = mCourseId
    mBase.Range("A2").Value = "sheet": mBase.Range("B2").Value = mSheet.Name
    mBase.Visible = xlSheetVeryHidden
    mApplying = True
    WriteText mSheet.Cells(ROW_TITLE, 1), courseLabel
    mApplying = False
    mSheet.Activate
    ActiveWindow.FreezePanes = False
    mSheet.Cells(FIRST_ROW, FIRST_COL).Select
    ActiveWindow.FreezePanes = True
End Sub

Private Sub RebuildMaps()
    Dim r As Long, c As Long
    InitState
    c = FIRST_COL
    Do While CStr(mBase.Cells(ROW_HEAD, c).Value) <> ""
        mColOf.Put CStr(mBase.Cells(ROW_HEAD, c).Value), c
        c = c + 1
    Loop
    mLastCol = c - 1
    r = FIRST_ROW
    Do While CStr(mBase.Cells(r, 1).Value) <> ""
        mRowOf.Put CStr(mBase.Cells(r, 1).Value), r
        r = r + 1
    Loop
    mLastRow = r - 1
    For r = FIRST_ROW To mLastRow
        For c = FIRST_COL To mLastCol
            If mBase.Cells(2, c).Value = 1 Or mBase.Cells(r, 2).Value = 1 Then mLocked.Put Key(r, c), True
        Next c
    Next r
End Sub

' Cells that differ from what CMAS last confirmed were edited while disconnected.
Private Sub CollectOfflineEdits()
    Dim r As Long, c As Long, n As String, k As String
    If mLastRow < FIRST_ROW Or mLastCol < FIRST_COL Then Exit Sub
    For r = FIRST_ROW To mLastRow
        For c = FIRST_COL To mLastCol
            k = Key(r, c)
            n = Norm(mSheet.Cells(r, c).Value)
            If n <> Norm(mBase.Cells(r, c).Value) Then
                If mLocked.Exists(k) Or Not IsAllowed(n, c) Then
                    RevertCell mSheet.Cells(r, c)
                Else
                    mDirty.Put k, True
                End If
            End If
        Next c
    Next r
End Sub

Private Function SafeSheetName(ByVal s As String) As String
    Dim bad As Variant
    For Each bad In Array("[", "]", ":", "*", "?", "/", "\")
        s = Replace(s, bad, " ")
    Next bad
    s = Trim$(s)
    If s = "" Or s = SHEET_BASE Then s = "CMAS"
    SafeSheetName = Left$(s, 31)
End Function

Private Sub Protect()
    ' Not security (anyone can unprotect); it stops sorting and inserting rows,
    ' which would break the row-to-student mapping, and editing grey cells.
    ' UserInterfaceOnly lets this code write; it is not saved, so it is set on every attach.
    On Error Resume Next
    mSheet.Protect UserInterfaceOnly:=True, AllowFormattingColumns:=True, AllowFormattingRows:=True
End Sub

Private Sub Unprotect()
    On Error Resume Next
    mSheet.Unprotect
End Sub

' ---------------------------------------------------------------- cells and values

Private Function Key(ByVal r As Long, ByVal c As Long) As String
    Key = r & "," & c
End Function

Private Function RowOf(ByVal k As Variant) As Long
    RowOf = CLng(Split(CStr(k), ",")(0))
End Function

Private Function ColOf(ByVal k As Variant) As Long
    ColOf = CLng(Split(CStr(k), ",")(1))
End Function

Private Function KeyOfIds(ByVal studentId As Variant, ByVal activityId As Variant) As String
    If mRowOf.Exists(CStr(studentId)) And mColOf.Exists(CStr(activityId)) Then
        KeyOfIds = Key(mRowOf(CStr(studentId)), mColOf(CStr(activityId)))
    End If
End Function

Private Function CellAt(ByVal k As Variant) As Range
    Set CellAt = mSheet.Cells(RowOf(k), ColOf(k))
End Function

Private Function BaseAt(ByVal k As Variant) As Range
    Set BaseAt = mBase.Cells(RowOf(k), ColOf(k))
End Function

Private Function ScoreArea() As Range
    Set ScoreArea = mSheet.Range(mSheet.Cells(FIRST_ROW, FIRST_COL), mSheet.Cells(mLastRow, mLastCol))
End Function

' A cell's value in one canonical text: "" (empty), "x" (excused), a number as
' JSON writes it, or "?" for anything else.
Private Function Norm(ByVal v As Variant) As String
    Dim s As String
    If IsEmpty(v) Or IsNull(v) Then Norm = "": Exit Function
    If IsError(v) Then Norm = "?": Exit Function
    Select Case VarType(v)
    Case vbDouble, vbSingle, vbInteger, vbLong, vbCurrency, vbDecimal
        Norm = JsonNum(CDbl(v))
    Case vbString
        s = Trim$(v)
        If s = "" Then
            Norm = ""
        ElseIf LCase$(s) = "x" Then
            Norm = "x"
        ElseIf IsNumericText(s) Then
            ' A number that arrived as text (pasted, or an apostrophe). Val reads
            ' "." whatever the locale; IsNumericText already refused "12abc".
            Norm = JsonNum(Val(s))
        Else
            Norm = "?"
        End If
    Case Else
        Norm = "?"
    End Select
End Function

Private Function IsNumericText(ByVal s As String) As Boolean
    Dim i As Long, dots As Long, ch As String
    For i = 1 To Len(s)
        ch = Mid$(s, i, 1)
        If ch = "." Then
            dots = dots + 1
        ElseIf ch < "0" Or ch > "9" Then
            Exit Function
        End If
    Next i
    IsNumericText = (dots <= 1 And Len(s) > 0)
End Function

Private Function IsAllowed(ByVal n As String, ByVal col As Long) As Boolean
    Dim d As Double
    If n = "" Or n = "x" Then IsAllowed = True: Exit Function
    If n = "?" Then Exit Function
    d = Val(n)
    IsAllowed = (d >= 0 And d <= CDbl(mBase.Cells(1, col).Value))
End Function

' API value (number / "EXCUSED" / Null) -> what a cell holds (number / "x" / Empty).
Private Function ToCell(ByVal v As Variant) As Variant
    If IsNull(v) Or IsEmpty(v) Then
        ToCell = Empty
    ElseIf VarType(v) = vbString Then
        If v = "EXCUSED" Or v = "x" Then ToCell = "x" Else ToCell = Empty
    Else
        ToCell = CDbl(v)
    End If
End Function

' Canonical text -> API value.
Private Function FromNorm(ByVal n As String) As Variant
    If n = "" Then
        FromNorm = Null
    ElseIf n = "x" Then
        FromNorm = "EXCUSED"
    Else
        FromNorm = Val(n)
    End If
End Function

Private Function ToJson(ByVal n As String) As String
    If n = "" Then
        ToJson = "null"
    ElseIf n = "x" Then
        ToJson = """EXCUSED"""
    Else
        ToJson = n
    End If
End Function

Private Sub RevertCell(ByVal cell As Range)
    Dim was As Boolean
    was = mApplying
    mApplying = True
    cell.Value = mBase.Cells(cell.Row, cell.Column).Value
    mApplying = was
End Sub

Private Sub MarkConflict(ByVal cell As Range, ByVal current As Variant)
    Dim shown As String
    If IsNull(current) Then
        shown = T("empty")
    ElseIf VarType(current) = vbString Then
        shown = T("excused")
    Else
        shown = JsonNum(current)
    End If
    On Error Resume Next   ' formatting only; never let it stop a sync
    cell.Interior.Color = RED
    cell.ClearComments
    cell.AddComment T("conflictNote", shown)
End Sub

Private Sub ClearMark(ByVal cell As Range)
    On Error Resume Next   ' formatting only; never let it stop a sync
    cell.ClearComments
    If mLocked.Exists(Key(cell.Row, cell.Column)) Then
        cell.Interior.Color = GREY
    Else
        cell.Interior.ColorIndex = xlColorIndexNone
    End If
End Sub

' Text CMAS sent (codes, names, headers) lands as text, never as a formula.
Private Sub WriteText(ByVal cell As Range, ByVal text As String)
    cell.NumberFormat = "@"
    If Len(text) > 0 Then
        If InStr(1, "=+-@", Left$(text, 1), vbBinaryCompare) > 0 Then text = "'" & text
    End If
    cell.Value = text
End Sub

Private Sub SetStatus(ByVal text As String)
    Dim was As Boolean
    If mSheet Is Nothing Then Exit Sub
    On Error Resume Next
    was = mApplying
    mApplying = True
    WriteText mSheet.Cells(ROW_STATUS, 1), text
    mSheet.Cells(ROW_STATUS, 1).Font.Italic = True
    mApplying = was
    ' The status row is what works on both platforms; the status bar is a bonus.
    Application.StatusBar = "CMAS: " & text
End Sub

Private Sub SetLiveStatus()
    If mConflict.Count > 0 Then
        SetStatus T("stConflict", CStr(mConflict.Count))
    Else
        SetStatus T("stLive", Format$(Now, "hh:nn:ss"))
    End If
End Sub
