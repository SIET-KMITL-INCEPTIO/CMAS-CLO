Attribute VB_Name = "modCmasSpike"
' P0 spike checks. Each macro proves one thing the real add-in (P4/P5) relies
' on. Run them from Alt+F8 (Windows) or Tools > Macro > Macros (Mac) and
' record the result in app/excel-addin/README.md.
Option Explicit

Private mEvents As clsCmasAppEvents
Private mTicks As Long

' S4: an add-in hears edits in every workbook.
Public Sub SpikeStartListening()
    Set mEvents = New clsCmasAppEvents
    Set mEvents.App = Application
    Application.StatusBar = "CMAS spike: listening - edit any cell"
End Sub

Public Sub SpikeStopListening()
    Set mEvents = Nothing
    Application.StatusBar = False
End Sub

' S5: Application.OnTime keeps firing on schedule (the add-in polls every 3-10 seconds).
Public Sub SpikeTimer()
    mTicks = 0
    SpikeTick
End Sub

Public Sub SpikeTick()
    mTicks = mTicks + 1
    Application.StatusBar = "CMAS spike: tick " & mTicks & " at " & Format$(Now, "hh:nn:ss")
    If mTicks < 3 Then Application.OnTime Now + TimeSerial(0, 0, 10), "'" & ThisWorkbook.Name & "'!SpikeTick"
End Sub

' S6: the token reads ITS course (expect 200) and nothing else (expect 404).
Public Sub SpikeCheckScope()
    Dim body As String, own As Long, other As Long, profile As Long
    If CmasToken = "" Then
        MsgBox "Run CmasConnect first.", vbExclamation, "CMAS spike"
        Exit Sub
    End If
    own = SafeRequest("GET", CmasBaseUrl & "/courses/" & CmasCourseId & "/scores", "", CmasToken, body)
    ' A well-formed id of a course this token was not approved for.
    other = SafeRequest("GET", CmasBaseUrl & "/courses/cjld2cjxh0000qzrmn831i7rn/scores", "", CmasToken, body)
    profile = SafeRequest("GET", CmasBaseUrl & "/auth/me", "", CmasToken, body)
    MsgBox "own course scores: " & own & " (expect 200)" & vbLf & _
           "another course:    " & other & " (expect 404)" & vbLf & _
           "/auth/me:          " & profile & " (expect 404)", vbInformation, "CMAS spike"
End Sub

' S7: text from the server that looks like a formula lands as text.
Public Sub SpikeFormulaText()
    Dim cell As Range
    Set cell = ActiveSheet.Range("A1")
    WriteText cell, "=HYPERLINK(""https://example.invalid"",""click"")"
    MsgBox "A1 HasFormula = " & cell.HasFormula & " (expect False)", vbInformation, "CMAS spike"
End Sub

' The one way the add-in writes text it did not create (names, codes): as text.
Public Sub WriteText(ByVal cell As Range, ByVal text As String)
    cell.NumberFormat = "@"
    cell.Value = text
End Sub
