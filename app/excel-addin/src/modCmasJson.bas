Attribute VB_Name = "modCmasJson"
' A small JSON reader and writer for the CMAS API's answers, Windows and Mac.
'
' Written here instead of vendoring a library: VBA-JSON needs
' Scripting.Dictionary, which Excel for Mac does not have, and code from
' elsewhere would have to be reviewed and pinned anyway. The API's JSON is
' plain (objects, arrays, strings, numbers, true/false/null), so this is small.
'
'   object -> clsCmasMap      array -> Collection
'   string -> String          number -> Double
'   true/false -> Boolean     null -> Null
Option Explicit

Private mText As String
Private mPos As Long

' Parse into `out`. Raises on malformed input (callers treat that as a bad answer).
Public Sub JsonParse(ByVal text As String, ByRef out As Variant)
    mText = text
    mPos = 1
    ParseValue out
    SkipSpace
    If mPos <= Len(mText) Then Fail "trailing characters"
End Sub

' root("a")("b")... in one call, Empty when any step is missing.
Public Function JPath(ByVal root As Variant, ParamArray keys() As Variant) As Variant
    Dim cur As Variant, k As Variant
    If IsObject(root) Then Set cur = root Else cur = root
    For Each k In keys
        If Not IsObject(cur) Then JPath = Empty: Exit Function
        If TypeName(cur) = "clsCmasMap" Then
            If Not cur.Exists(CStr(k)) Then JPath = Empty: Exit Function
            If IsObject(cur.Item(CStr(k))) Then Set cur = cur.Item(CStr(k)) Else cur = cur.Item(CStr(k))
        Else
            JPath = Empty: Exit Function
        End If
    Next k
    If IsObject(cur) Then Set JPath = cur Else JPath = cur
End Function

' A JSON string literal, quotes included.
Public Function JsonStr(ByVal s As String) As String
    Dim i As Long, ch As String, code As Long, out As String
    out = """"
    For i = 1 To Len(s)
        ch = Mid$(s, i, 1)
        code = AscW(ch) And &HFFFF&
        Select Case code
        Case 34: out = out & "\"""
        Case 92: out = out & "\\"
        Case 10: out = out & "\n"
        Case 13: out = out & "\r"
        Case 9: out = out & "\t"
        Case Is < 32, Is > 126: out = out & "\u" & Right$("000" & LCase$(Hex$(code)), 4)
        Case Else: out = out & ch
        End Select
    Next i
    JsonStr = out & """"
End Function

' A number the way JSON writes it: "." as the decimal point whatever the locale.
Public Function JsonNum(ByVal d As Double) As String
    JsonNum = Trim$(Str$(d))
    If Left$(JsonNum, 1) = "." Then JsonNum = "0" & JsonNum
    If Left$(JsonNum, 2) = "-." Then JsonNum = "-0" & Mid$(JsonNum, 2)
End Function

Private Sub Fail(ByVal why As String)
    Err.Raise vbObjectError + 600, "CMAS JSON", "bad JSON at " & mPos & ": " & why
End Sub

Private Sub SkipSpace()
    Do While mPos <= Len(mText)
        Select Case Mid$(mText, mPos, 1)
        Case " ", vbTab, vbCr, vbLf: mPos = mPos + 1
        Case Else: Exit Do
        End Select
    Loop
End Sub

Private Sub ParseValue(ByRef out As Variant)
    SkipSpace
    If mPos > Len(mText) Then Fail "unexpected end"
    Select Case Mid$(mText, mPos, 1)
    Case "{": Set out = ParseObject()
    Case "[": Set out = ParseArray()
    Case """": out = ParseString()
    Case "t": Expect "true": out = True
    Case "f": Expect "false": out = False
    Case "n": Expect "null": out = Null
    Case Else: out = ParseNumber()
    End Select
End Sub

Private Sub Expect(ByVal word As String)
    If Mid$(mText, mPos, Len(word)) <> word Then Fail "expected " & word
    mPos = mPos + Len(word)
End Sub

Private Function ParseObject() As clsCmasMap
    Dim map As New clsCmasMap, key As String, v As Variant
    mPos = mPos + 1
    SkipSpace
    If Mid$(mText, mPos, 1) = "}" Then mPos = mPos + 1: Set ParseObject = map: Exit Function
    Do
        SkipSpace
        If Mid$(mText, mPos, 1) <> """" Then Fail "expected a key"
        key = ParseString()
        SkipSpace
        If Mid$(mText, mPos, 1) <> ":" Then Fail "expected :"
        mPos = mPos + 1
        v = Empty
        ParseValue v
        map.Store key, v
        SkipSpace
        Select Case Mid$(mText, mPos, 1)
        Case ",": mPos = mPos + 1
        Case "}": mPos = mPos + 1: Exit Do
        Case Else: Fail "expected , or }"
        End Select
    Loop
    Set ParseObject = map
End Function

Private Function ParseArray() As Collection
    Dim list As New Collection, v As Variant
    mPos = mPos + 1
    SkipSpace
    If Mid$(mText, mPos, 1) = "]" Then mPos = mPos + 1: Set ParseArray = list: Exit Function
    Do
        v = Empty
        ParseValue v
        list.Add v
        SkipSpace
        Select Case Mid$(mText, mPos, 1)
        Case ",": mPos = mPos + 1
        Case "]": mPos = mPos + 1: Exit Do
        Case Else: Fail "expected , or ]"
        End Select
    Loop
    Set ParseArray = list
End Function

Private Function ParseString() As String
    Dim out As String, ch As String, start As Long
    mPos = mPos + 1 ' opening quote
    Do
        If mPos > Len(mText) Then Fail "unterminated string"
        ' Copy the run up to the next quote or backslash in one piece.
        start = mPos
        Do While mPos <= Len(mText)
            ch = Mid$(mText, mPos, 1)
            If ch = """" Or ch = "\" Then Exit Do
            mPos = mPos + 1
        Loop
        out = out & Mid$(mText, start, mPos - start)
        If mPos > Len(mText) Then Fail "unterminated string"
        If ch = """" Then mPos = mPos + 1: Exit Do
        ' A backslash escape.
        ch = Mid$(mText, mPos + 1, 1)
        Select Case ch
        Case """", "\", "/": out = out & ch: mPos = mPos + 2
        Case "n": out = out & vbLf: mPos = mPos + 2
        Case "r": out = out & vbCr: mPos = mPos + 2
        Case "t": out = out & vbTab: mPos = mPos + 2
        Case "b": out = out & Chr$(8): mPos = mPos + 2
        Case "f": out = out & Chr$(12): mPos = mPos + 2
        Case "u"
            out = out & ChrW(CLng("&H" & Mid$(mText, mPos + 2, 4)))
            mPos = mPos + 6
        Case Else: Fail "bad escape"
        End Select
    Loop
    ParseString = out
End Function

Private Function ParseNumber() As Double
    Dim start As Long
    start = mPos
    Do While mPos <= Len(mText)
        If InStr(1, "+-0123456789.eE", Mid$(mText, mPos, 1), vbBinaryCompare) = 0 Then Exit Do
        mPos = mPos + 1
    Loop
    If mPos = start Then Fail "unexpected character"
    ' Val reads "." as the decimal point whatever the locale, unlike CDbl.
    ParseNumber = Val(Mid$(mText, start, mPos - start))
End Function
