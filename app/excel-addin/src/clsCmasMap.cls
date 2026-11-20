VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "clsCmasMap"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
' A string-keyed map that works on Windows AND Mac. Excel for Mac has no
' Scripting.Dictionary (it is ActiveX), so the add-in uses this everywhere:
' for JSON objects and for its own lookups.
'
' Keys are case-sensitive (a Collection's own keys are not, so each key is
' stored hex-encoded). Values may be objects or plain values.
Option Explicit

Private mKeys As Collection     ' the keys, in insertion order
Private mValues As Collection   ' the values, keyed by Slot(key)

Private Sub Class_Initialize()
    Set mKeys = New Collection
    Set mValues = New Collection
End Sub

Private Function Slot(ByVal key As String) As String
    Dim i As Long, out As String
    out = "k"
    For i = 1 To Len(key)
        out = out & Right$("000" & Hex$(AscW(Mid$(key, i, 1)) And &HFFFF&), 4)
    Next i
    Slot = out
End Function

Public Property Get Count() As Long
    Count = mKeys.Count
End Property

Public Function Exists(ByVal key As String) As Boolean
    Dim probe As Boolean
    On Error Resume Next
    probe = IsObject(mValues(Slot(key)))   ' raises when the key is absent
    Exists = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

' Adds or replaces.
Public Sub Put(ByVal key As String, ByVal value As Variant)
    Dim s As String
    s = Slot(key)
    If Exists(key) Then
        mValues.Remove s
        RemoveKey key
    End If
    mValues.Add value, s
    mKeys.Add key
End Sub

Public Sub Remove(ByVal key As String)
    If Not Exists(key) Then Exit Sub
    mValues.Remove Slot(key)
    RemoveKey key
End Sub

Private Sub RemoveKey(ByVal key As String)
    Dim i As Long
    For i = mKeys.Count To 1 Step -1
        If StrComp(mKeys(i), key, vbBinaryCompare) = 0 Then mKeys.Remove i: Exit Sub
    Next i
End Sub

' The value; Empty when the key is absent. Objects come back as objects.
Public Function Item(ByVal key As String) As Variant
Attribute Item.VB_UserMemId = 0
    If Not Exists(key) Then Item = Empty: Exit Function
    If IsObject(mValues(Slot(key))) Then
        Set Item = mValues(Slot(key))
    Else
        Item = mValues(Slot(key))
    End If
End Function

' A copy of the keys, so a caller may Remove while looping over them.
Public Function Keys() As Collection
    Dim out As New Collection, k As Variant
    For Each k In mKeys
        out.Add k
    Next k
    Set Keys = out
End Function

Public Sub Clear()
    Set mKeys = New Collection
    Set mValues = New Collection
End Sub
