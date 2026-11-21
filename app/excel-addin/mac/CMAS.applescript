-- CMAS add-in for Excel on Mac: the HTTP call Excel's sandbox cannot make itself.
--
-- Compiled and installed by install/install.sh as
--   ~/Library/Application Scripts/com.microsoft.Excel/CMAS.scpt
-- Excel calls it with AppleScriptTask("CMAS.scpt", "cmasRequest", payload).
--
-- payload = method LF url LF bearer LF body   (body is one-line JSON or empty)
-- returns   response body LF http status
--
-- The bearer token never appears on a command line (where `ps` would show it
-- to another user): it is written into a curl config file in a folder only
-- this user can open, read by `curl -K`, and deleted at once.

on cmasRequest(payload)
	set AppleScript's text item delimiters to linefeed
	set parts to text items of payload
	set AppleScript's text item delimiters to ""
	if (count of parts) < 3 then error "CMAS: bad request"
	set theMethod to item 1 of parts
	set theUrl to item 2 of parts
	set theBearer to item 3 of parts
	set theBody to ""
	if (count of parts) > 3 then set theBody to item 4 of parts

	if theMethod is not in {"GET", "POST", "PUT", "PATCH", "DELETE"} then error "CMAS: bad method"
	if not (theUrl starts with "https://" or theUrl starts with "http://localhost:" or theUrl starts with "http://127.0.0.1:") then error "CMAS: https only"

	set dir to (POSIX path of (path to library folder from user domain)) & "Caches/CMAS/"
	do shell script "mkdir -p " & quoted form of dir & " && chmod 700 " & quoted form of dir
	set cfg to dir & "request.cfg"

	set cfgText to "request = " & my q(theMethod) & linefeed & ¬
		"url = " & my q(theUrl) & linefeed & ¬
		"header = " & my q("X-Client-Id: excel-addin") & linefeed
	if theBearer is not "" then set cfgText to cfgText & "header = " & my q("Authorization: Bearer " & theBearer) & linefeed
	-- Content-Type only with a body: the server answers 400 to a JSON Content-Type
	-- with nothing in it, which failed POST /excel/device (the first call of every sign-in).
	if theBody is not "" then
		set cfgText to cfgText & "header = " & my q("Content-Type: application/json; charset=utf-8") & linefeed
		set cfgText to cfgText & "data-binary = " & my q(theBody) & linefeed
	end if

	set fh to open for access (POSIX file cfg) with write permission
	try
		set eof fh to 0
		write cfgText to fh as «class utf8»
		close access fh
	on error e
		close access fh
		error e
	end try

	try
		set out to do shell script "chmod 600 " & quoted form of cfg & ¬
			" && /usr/bin/curl -sS --proto =https,http --max-time 5 -w '\\n%{http_code}' -K " & quoted form of cfg & ¬
			"; status=$?; rm -f " & quoted form of cfg & "; exit $status" without altering line endings
	on error e
		do shell script "rm -f " & quoted form of cfg
		return e & linefeed & "0"
	end try
	return out
end cmasRequest

-- A double-quoted string for a curl config file.
on q(s)
	set s to my replaceText(s, "\\", "\\\\")
	set s to my replaceText(s, "\"", "\\\"")
	return "\"" & s & "\""
end q

on replaceText(s, findText, replaceWith)
	set AppleScript's text item delimiters to findText
	set pieces to text items of s
	set AppleScript's text item delimiters to replaceWith
	set s to pieces as text
	set AppleScript's text item delimiters to ""
	return s
end replaceText
