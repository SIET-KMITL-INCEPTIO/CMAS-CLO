Attribute VB_Name = "modCmasHttp"
' CMAS add-in for Excel - one HTTP call for Windows and Mac (P0 spike).
'
' Windows: WinHttp.WinHttpRequest.5.1 (ActiveX).
' Mac:     Excel is sandboxed and has no ActiveX, so the call goes through
'          AppleScriptTask to CMAS.scpt, which runs curl. The token is passed
'          to the script as a parameter and written by AppleScript into a curl
'          config file under ~/Library/Caches/CMAS (mode 700/600), never on a
'          command line, so another user cannot read it with `ps`.
'
' Rules this file keeps:
'  - https only (http://localhost is allowed for development)
'  - never switch off certificate checks
'  - 5 second timeout, so a dead network cannot freeze Excel for long
'  - strings in this file are ASCII: VBA source is stored in the machine's
'    code page, so Thai text written here breaks on another locale or on Mac
Option Explicit

Public Const CMAS_TIMEOUT_MS As Long = 5000
' Matches the server's X-Client-Id rule ^[\w-]{1,64}$; lets open web tabs tell
' an Excel write from their own.
Private Const CLIENT_ID As String = "excel-addin"

' Returns the HTTP status (0 when the request never got an answer) and puts the
' response text in responseBody.
Public Function CmasRequest(ByVal method As String, ByVal url As String, ByVal body As String, _
                            ByVal bearer As String, ByRef responseBody As String) As Long
    If Not IsAllowedUrl(url) Then
        Err.Raise vbObjectError + 513, "CMAS", "CMAS must be reached over https"
    End If
#If Mac Then
    CmasRequest = MacRequest(method, url, body, bearer, responseBody)
#Else
    CmasRequest = WinRequest(method, url, body, bearer, responseBody)
#End If
End Function

Private Function IsAllowedUrl(ByVal url As String) As Boolean
    Dim u As String
    u = LCase$(url)
    IsAllowedUrl = (Left$(u, 8) = "https://") Or (Left$(u, 17) = "http://localhost:") _
                   Or (Left$(u, 17) = "http://127.0.0.1:")
End Function

#If Mac Then

Private Function MacRequest(ByVal method As String, ByVal url As String, ByVal body As String, _
                            ByVal bearer As String, ByRef responseBody As String) As Long
    Dim raw As String, p As Long
    ' CMAS.scpt splits on LF: method, url, bearer, body (one-line JSON).
    raw = AppleScriptTask("CMAS.scpt", "cmasRequest", method & vbLf & url & vbLf & bearer & vbLf & body)
    ' curl -w appends the status code on its own last line.
    p = InStrRev(raw, vbLf)
    If p = 0 Then
        MacRequest = 0
        responseBody = raw
    Else
        MacRequest = CLng(Val(Mid$(raw, p + 1)))
        responseBody = Left$(raw, p - 1)
    End If
End Function

#Else

Private Function WinRequest(ByVal method As String, ByVal url As String, ByVal body As String, _
                            ByVal bearer As String, ByRef responseBody As String) As Long
    Dim http As Object
    Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
    http.SetTimeouts CMAS_TIMEOUT_MS, CMAS_TIMEOUT_MS, CMAS_TIMEOUT_MS, CMAS_TIMEOUT_MS
    http.Open method, url, False
    http.SetRequestHeader "Content-Type", "application/json; charset=utf-8"
    http.SetRequestHeader "X-Client-Id", CLIENT_ID
    If Len(bearer) > 0 Then http.SetRequestHeader "Authorization", "Bearer " & bearer
    If Len(body) > 0 Then
        http.Send body
    Else
        http.Send
    End If
    responseBody = http.ResponseText
    WinRequest = http.Status
End Function

#End If

' P0 only: reads "key":"value" from flat JSON. P4 replaces this with VBA-JSON
' (and VBA-Dictionary on Mac, which has no Scripting.Dictionary).
Public Function JsonText(ByVal json As String, ByVal key As String) As String
    Dim marker As String, i As Long, j As Long
    marker = """" & key & """:"""
    i = InStr(1, json, marker, vbBinaryCompare)
    If i = 0 Then Exit Function
    i = i + Len(marker)
    j = InStr(i, json, """", vbBinaryCompare)
    If j > i Then JsonText = Mid$(json, i, j - i)
End Function
