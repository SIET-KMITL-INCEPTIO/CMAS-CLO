VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "clsCmasAppEvents"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
' Hears edits in every open workbook (Application-level WithEvents) and hands
' them to modCmasSync, which ignores every sheet but the course sheet.
Option Explicit

Public WithEvents App As Application
Attribute App.VB_VarHelpID = -1

Private Sub App_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    OnSheetChange Sh, Target
End Sub
