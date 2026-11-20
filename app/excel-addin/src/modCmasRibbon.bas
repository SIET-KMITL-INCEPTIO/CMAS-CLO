Attribute VB_Name = "modCmasRibbon"
' Callbacks for the CMAS tab (ribbon/customUI14.xml). Each one only forwards,
' so every command can also be run from the Macros dialog by its own name.
Option Explicit

Public Sub CmasRibbonConnect(control As IRibbonControl)
    CmasConnect
End Sub

Public Sub CmasRibbonDisconnect(control As IRibbonControl)
    CmasDisconnect
End Sub

Public Sub CmasRibbonSync(control As IRibbonControl)
    CmasSyncNow
End Sub

Public Sub CmasRibbonKeepMine(control As IRibbonControl)
    CmasKeepMine
End Sub

Public Sub CmasRibbonTakeServer(control As IRibbonControl)
    CmasTakeServer
End Sub
