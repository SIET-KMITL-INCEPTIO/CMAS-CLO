Attribute VB_Name = "modCmasAuth"
' CMAS add-in for Excel - sign in with a device code (FR-73).
'
'   1. CmasConnect asks the server for a code and shows it.
'   2. The instructor types the code at <CMAS>/excel/link and picks a course.
'   3. CmasPollToken asks every 5 seconds (Application.OnTime) until the
'      server hands over a token for that one course, then sync starts.
'
' In a score workbook (modCmasWorkbook) the first open skips steps 1-2:
' the file's ticket is a code CMAS approved when it was downloaded. Later
' opens get a fresh code, and the browser opens on it with the course chosen.
'
' The token lives in this module's memory ONLY: never in a cell, a name, a
' document property, a file or the registry. Closing Excel ends it; the
' instructor can also cut it from the web page at any time. The CMAS address
' is remembered (GetSetting/SaveSetting): it is not a secret.
Option Explicit

Private Const SETTINGS_APP As String = "CMAS"
Private Const SETTINGS_SECTION As String = "Excel add-in"

Private mBaseUrl As String
Private mDeviceCode As String
Private mDeadline As Date
Private mToken As String
Private mCourseId As String
' The device code came from a score workbook's ticket, not from /excel/device.
Private mFromTicket As Boolean

Public Property Get CmasBaseUrl() As String
    CmasBaseUrl = mBaseUrl
End Property

Public Property Get CmasToken() As String
    CmasToken = mToken
End Property

Public Property Get CmasCourseId() As String
    CmasCourseId = mCourseId
End Property

' The server answered 401/404: the token is revoked, expired, or no longer fits.
Public Sub CmasForgetToken()
    mToken = ""
End Sub

Public Sub CmasConnect()
    Dim address As String
    If CmasIsWorkbook() Then
        ConnectWorkbook
        Exit Sub
    End If
    address = GetSetting(SETTINGS_APP, SETTINGS_SECTION, "BaseUrl", "")
    address = CmasAsk(T("askUrl"), "CMAS", IIf(address = "", "https://", address))
    If Trim$(address) = "" Then Exit Sub
    mBaseUrl = ApiUrl(address)
    CmasStopSync
    mToken = ""
    If StartDeviceCode(False) Then
        SaveSetting SETTINGS_APP, SETTINGS_SECTION, "BaseUrl", Replace(mBaseUrl, "/api/v1", "")
    End If
End Sub

' A score workbook knows its CMAS and its course. On the first open its ticket
' signs it in with no code at all; after that the browser opens on the approve
' page with the code and the course already filled in.
Private Sub ConnectWorkbook()
    Dim ticket As String
    mBaseUrl = ApiUrl(CmasProp("CmasApi"))
    CmasStopSync
    mToken = ""
    ticket = CmasProp("CmasTicket")
    If ticket <> "" Then
        CmasForgetTicket
        mDeviceCode = ticket
        mDeadline = Now + TimeSerial(0, 10, 0)
        mFromTicket = True
        CmasPollToken
        Exit Sub
    End If
    StartDeviceCode True
End Sub

' People paste the web page's address; the API lives under /api/v1.
Private Function ApiUrl(ByVal address As String) As String
    address = Trim$(address)
    If Right$(address, 1) = "/" Then address = Left$(address, Len(address) - 1)
    If Right$(LCase$(address), 7) <> "/api/v1" Then address = address & "/api/v1"
    ApiUrl = address
End Function

' Asks CMAS for a code, shows it (or opens the browser on it) and starts polling.
Private Function StartDeviceCode(ByVal openBrowser As Boolean) As Boolean
    Dim body As String, status As Long, root As Variant
    Dim verifyUrl As String, userCode As String
    mFromTicket = False
    status = SafeRequest("POST", mBaseUrl & "/excel/device", "", "", body)
    If status <> 201 Then
        CmasMsg T("startFail", CStr(status)), vbExclamation
        Exit Function
    End If
    JsonParse body, root
    mDeviceCode = JPath(root, "data", "deviceCode")
    verifyUrl = CStr(JPath(root, "data", "verifyUrl"))
    userCode = CStr(JPath(root, "data", "userCode"))
    mDeadline = Now + TimeSerial(0, 10, 0)
    If openBrowser Then
        CmasMsg T("wbApprove", verifyUrl, userCode), vbInformation
        On Error Resume Next
        ThisWorkbook.FollowHyperlink verifyUrl & "?code=" & userCode & "&course=" & CmasProp("CmasCourseId")
        Err.Clear
        On Error GoTo 0
    Else
        CmasMsg T("showCode", verifyUrl, userCode), vbInformation
    End If
    SchedulePoll
    StartDeviceCode = True
End Function

Private Sub SchedulePoll()
    ' Qualified with the add-in's name: an unqualified name may resolve to a
    ' macro of the same name in another open workbook.
    Application.OnTime Now + TimeSerial(0, 0, 5), "'" & ThisWorkbook.Name & "'!CmasPollToken"
End Sub

Public Sub CmasPollToken()
    Dim body As String, status As Long, root As Variant, label As String
    If mDeviceCode = "" Then Exit Sub
    If Now > mDeadline Then
        mDeviceCode = ""
        CmasMsg T("expired"), vbExclamation
        Exit Sub
    End If

    status = SafeRequest("POST", mBaseUrl & "/excel/token", _
                         "{""deviceCode"":" & JsonStr(mDeviceCode) & "}", "", body)
    If status = 200 Or status = 201 Then
        On Error GoTo retry
        JsonParse body, root
        On Error GoTo 0
        Select Case CStr(JPath(root, "data", "status"))
        Case "ok"
            mToken = JPath(root, "data", "token")
            mCourseId = JPath(root, "data", "course", "id")
            label = JPath(root, "data", "course", "code") & " " & JPath(root, "data", "course", "name") & _
                    " Sec " & JPath(root, "data", "course", "section")
            mDeviceCode = ""
            mFromTicket = False
            ' A score workbook belongs to one course; the approve page lets a
            ' person pick another, which must not be drawn into this file.
            If CmasIsWorkbook() And mCourseId <> CmasProp("CmasCourseId") Then
                mToken = ""
                mCourseId = ""
                CmasMsg T("wbWrongCourse", CmasProp("CmasCourseLabel")), vbExclamation
                Exit Sub
            End If
            CheckVersion
            CmasStartSync mCourseId, label
            Exit Sub
        Case "expired"
            mDeviceCode = ""
            ' An old or already used ticket: sign in with a fresh code instead.
            If mFromTicket Then
                StartDeviceCode True
                Exit Sub
            End If
            CmasMsg T("expired"), vbExclamation
            Exit Sub
        End Select
    End If
retry:
    ' pending, a network error or a 429: try again in 5 seconds.
    SchedulePoll
End Sub

Public Sub CmasDisconnect()
    CmasStopSync
    mToken = ""
    mCourseId = ""
    mDeviceCode = ""
    mFromTicket = False
    Application.StatusBar = False
End Sub

' FR-75: tell the instructor a newer release exists. Never download or run it.
Private Sub CheckVersion()
    Dim body As String, root As Variant, latest As String
    If SafeRequest("GET", mBaseUrl & "/excel/addin", "", "", body) <> 200 Then Exit Sub
    On Error Resume Next
    JsonParse body, root
    If CmasIsWorkbook() Then
        latest = CStr(JPath(root, "data", "workbook", "version"))
    Else
        latest = CStr(JPath(root, "data", "version"))
    End If
    On Error GoTo 0
    If latest = "" Or latest = CMAS_ADDIN_VERSION Then Exit Sub
    If CmasIsWorkbook() Then
        CmasMsg T("newWorkbook", latest, CMAS_ADDIN_VERSION), vbInformation
    Else
        CmasMsg T("newVersion", latest, CMAS_ADDIN_VERSION), vbInformation
    End If
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
