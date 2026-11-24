Attribute VB_Name = "modCmasWorkbook"
' CMAS score workbook (.xlsm): the same VBA as the add-in, saved inside the
' file, so a downloaded workbook needs no add-in (README, "Build the score
' workbook").
'
' The server stamps every download with custom document properties:
'   CmasApi          where this file reaches the CMAS server
'   CmasCourseId     the one course this file is for
'   CmasCourseLabel  its code, name and section, for the sheet's title
'   CmasTicket       a device code already approved for the person who
'                    downloaded it: single use, dead after 10 minutes
' None of them is a lasting secret: the ticket is consumed by the first open,
' and the token it buys lives in modCmasAuth's memory only.
'
' Auto_Open runs when the instructor opens the file and connects it. In the
' add-in (.xlam) there are no such properties, so nothing here runs.
Option Explicit

' True in a score workbook downloaded from CMAS; False in the add-in.
Public Function CmasIsWorkbook() As Boolean
    If ThisWorkbook.IsAddin Then Exit Function
    CmasIsWorkbook = (CmasProp("CmasCourseId") <> "")
End Function

' A custom document property of this file, or "" when it has none.
Public Function CmasProp(ByVal name As String) As String
    On Error Resume Next
    CmasProp = CStr(ThisWorkbook.CustomDocumentProperties(name).Value)
    Err.Clear
End Function

' The ticket is single use on the server either way; dropping it here means a
' second open goes straight to a fresh code instead of a ticket CMAS refuses.
Public Sub CmasForgetTicket()
    On Error Resume Next
    ThisWorkbook.CustomDocumentProperties("CmasTicket").Delete
    Err.Clear
End Sub

Public Sub Auto_Open()
    If Not CmasIsWorkbook() Then Exit Sub
    ' Once Excel has finished opening the file, so its window and sheets exist.
    Application.OnTime Now, "'" & ThisWorkbook.Name & "'!CmasConnect"
End Sub
