Option Explicit
Dim shell, fso, folder, cmd
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

folder = fso.GetParentFolderName(WScript.ScriptFullName)

' Start the Node/Express server silently.
cmd = "cmd.exe /c cd /d """ & folder & """ && npm start"
shell.Run cmd, 0, False

' Give Node a moment to start, then open the school website.
WScript.Sleep 2500
shell.Run "http://localhost:5000/", 1, False
