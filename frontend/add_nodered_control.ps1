
# Get the raw JSON string of the flow
$rawJson = Invoke-WebRequest -Uri "http://13.205.43.53:1880/flow/5cd3b4b96ddf7040" -Method GET | Select-Object -ExpandProperty Content

# New single-byte function code
$newFunc = 'var cmd = msg.payload;\nif(typeof cmd === ''string'') { cmd = JSON.parse(cmd); }\n\nvar method = cmd.method || ''setDimming'';\nvar value  = Math.round(Number(cmd.value) || 0);\n\nvar byteVal;\nif      (method === ''setDimming'')    { byteVal = Math.max(0,  Math.min(100, value)); }\nelse if (method === ''setMaxCurrent'') { byteVal = Math.max(10, Math.min(100, value)); }\nelse if (method === ''powerOn'')       { byteVal = 100; }\nelse if (method === ''powerOff'')      { byteVal = 0;   }\nelse if (method === ''resetDriver'')   { byteVal = 255; }\nelse                                   { byteVal = 0;   }\n\nvar b64 = Buffer.from([byteVal]).toString(''base64'');\n\nvar ttsPayload = JSON.stringify({ downlinks: [{ f_port: 10, frm_payload: b64, priority: ''NORMAL'' }] });\nnode.log(''Downlink cmd='' + method + '' val='' + byteVal + '' hex=0x'' + byteVal.toString(16).toUpperCase() + '' b64='' + b64);\n\nvar respMsg = { payload: JSON.stringify({ok:true, method:method, value:byteVal}), res: msg.res, req: msg.req };\nvar ttsMsg  = { payload: ttsPayload };\nreturn [respMsg, ttsMsg];'

# Parse JSON, find the node, update its func field
$flow = $rawJson | ConvertFrom-Json

$updated = $false
for ($i = 0; $i -lt $flow.nodes.Count; $i++) {
    if ($flow.nodes[$i].id -eq 'http-ctrl-fn') {
        $flow.nodes[$i].func = $newFunc.Replace('\n', "`n")
        $updated = $true
        Write-Host "Updated node at index $i"
        break
    }
}

if (-not $updated) {
    Write-Host "ERROR: http-ctrl-fn node not found!"
    exit 1
}

# Serialize back and deploy
$putBody = $flow | ConvertTo-Json -Depth 20 -Compress
$result = Invoke-WebRequest -Uri "http://13.205.43.53:1880/flow/5cd3b4b96ddf7040" -Method PUT -ContentType "application/json" -Body $putBody
Write-Host "Deploy HTTP status: $($result.StatusCode)"
Write-Host "Deploy result: $($result.Content)"
