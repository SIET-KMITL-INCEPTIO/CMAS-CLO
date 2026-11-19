VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "clsCmasAppEvents"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
' P0 spike: proves an add-in can hear edits in any open workbook
' (Application-level WithEvents), on Windows and in the Mac sandbox.
' P4 turns this into "collect changed cells, send them 2 seconds later".
Option Explicit

Public WithEvents App As Application
Attribute App.VB_VarHelpID = -1

Private Sub App_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    Application.StatusBar = "CMAS spike: changed " & Sh.Name & "!" & Target.Address(False, False)
End Sub
