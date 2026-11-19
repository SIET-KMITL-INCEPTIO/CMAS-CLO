Attribute VB_Name = "modCmasAuth"
' CMAS add-in for Excel - sign in with a device code (P0 spike).
'
'   1. CmasConnect asks the server for a code and shows it.
'   2. The instructor types the code at <CMAS>/excel/link and picks a course.
'   3. CmasPollToken asks every 5 seconds (Application.OnTime) until the
'      server hands over a token for that one course.
'
' The token lives in this module's memory ONLY: never in a cell, a name, a
' document property, a file or the registry. Closing Excel ends it; the
' instructor can also cut it from the web page at any time.
Option Explicit

Private mBaseUrl As String
Private mDeviceCode As String
Private mDeadline As Date
Private mToken As String
Private mCourseId As String
Private mCourseCode As String

Public Property Get CmasBaseUrl() As String
    CmasBaseUrl = mBaseUrl
End Property

Public Property Get CmasToken() As String
    CmasToken = mToken
End Property

Public Property Get CmasCourseId() As String
    CmasCourseId = mCourseId
End Property

Public Sub CmasConnect()
    Dim body As String, status As Long
    If mBaseUrl = "" Then
        mBaseUrl = InputBox("CMAS API address", "CMAS", "http://localhost:3001/api/v1")
        If mBaseUrl = "" Then Exit Sub
    End If
    status = SafeRequest("POST", mBaseUrl & "/excel/device", "", "", body)
    If status <> 201 Then
        MsgBox "Could not start sign-in (HTTP " & status & ").", vbExclamation, "CMAS"
        Exit Sub
    End If
    mDeviceCode = JsonText(body, "deviceCode")
    mDeadline = Now + TimeSerial(0, 10, 0)
    MsgBox "Open " & JsonText(body, "verifyUrl") & vbLf & "and type this code:" & vbLf & vbLf & _
           JsonText(body, "userCode"), vbInformation, "CMAS"
    SchedulePoll
End Sub

Private Sub SchedulePoll()
    ' Qualified with the add-in's name: an unqualified name may resolve to a
    ' macro of the same name in another open workbook.
    Application.OnTime Now + TimeSerial(0, 0, 5), "'" & ThisWorkbook.Name & "'!CmasPollToken"
End Sub

Public Sub CmasPollToken()
    Dim body As String, status As Long
    If mDeviceCode = "" Then Exit Sub
    If Now > mDeadline Then
        mDeviceCode = ""
        MsgBox "The code expired. Connect again.", vbExclamation, "CMAS"
        Exit Sub
    End If

    status = SafeRequest("POST", mBaseUrl & "/excel/token", _
                         "{""deviceCode"":""" & mDeviceCode & """}", "", body)
    If status = 200 Then
        Select Case JsonText(body, "status")
        Case "ok"
            mToken = JsonText(body, "token")
            ' The first "id" after the token is the course's (data.course.id).
            mCourseId = JsonText(Mid$(body, InStr(body, """course"":")), "id")
            mCourseCode = JsonText(body, "code")
            mDeviceCode = ""
            Application.StatusBar = "CMAS: connected to " & mCourseCode
            Exit Sub
        Case "expired"
            mDeviceCode = ""
            MsgBox "The code expired. Connect again.", vbExclamation, "CMAS"
            Exit Sub
        End Select
    End If
    ' pending, a network error or a 429: try again in 5 seconds.
    SchedulePoll
End Sub

Public Sub CmasDisconnect()
    mToken = ""
    mCourseId = ""
    mCourseCode = ""
    mDeviceCode = ""
    Application.StatusBar = False
End Sub

' A request that never raises: a network error becomes status 0.
Public Function SafeRequest(ByVal method As String, ByVal url As String, ByVal body As String, _
                            ByVal bearer As String, ByRef responseBody As String) As Long
    On Error Resume Next
    SafeRequest = CmasRequest(method, url, body, bearer, responseBody)
    If Err.Number <> 0 Then
        SafeRequest = 0
        responseBody = Err.Description
        Err.Clear
    End If
    On Error GoTo 0
End Function
