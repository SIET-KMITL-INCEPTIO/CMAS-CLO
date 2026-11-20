Attribute VB_Name = "modCmasUi"
' Message and input boxes that show Thai on every machine.
'
' VBA's own MsgBox and InputBox convert their text to the machine's ANSI code
' page. On a Windows whose "language for non-Unicode programs" is not Thai,
' every Thai letter becomes "?", including the instructions shown next to the
' sign-in code. So:
'   Windows: MessageBoxW, which takes the text as Unicode
'   Mac:     MsgBox, which is already Unicode there
'   input:   Excel's own Application.InputBox, Unicode on both
' Every other module calls CmasMsg / CmasAsk, never MsgBox / InputBox
' (`build-excel-addin.py check` enforces it).
Option Explicit

#If Not Mac Then
#If VBA7 Then
Private Declare PtrSafe Function MessageBoxW Lib "user32" (ByVal hWnd As LongPtr, _
    ByVal lpText As LongPtr, ByVal lpCaption As LongPtr, ByVal uType As Long) As Long
#Else
Private Declare Function MessageBoxW Lib "user32" (ByVal hWnd As Long, _
    ByVal lpText As Long, ByVal lpCaption As Long, ByVal uType As Long) As Long
#End If
#End If

' Same buttons and answers as MsgBox (vbYesNo + vbExclamation ..., vbYes / vbNo):
' the Windows flag values and return codes are the same numbers.
Public Function CmasMsg(ByVal text As String, Optional ByVal buttons As Long = vbOKOnly, _
                        Optional ByVal title As String = "CMAS") As VbMsgBoxResult
#If Mac Then
    CmasMsg = MsgBox(text, buttons, title)
#Else
    CmasMsg = MessageBoxW(Application.Hwnd, StrPtr(text), StrPtr(title), buttons)
#End If
End Function

' A line of text from the instructor; "" when they cancel.
Public Function CmasAsk(ByVal prompt As String, ByVal title As String, ByVal initial As String) As String
    Dim answer As Variant
    answer = Application.InputBox(prompt, title, initial, Type:=2)
    If VarType(answer) = vbBoolean Then CmasAsk = "" Else CmasAsk = CStr(answer)
End Function
