
$newNodes = @'
[
  {
    "id": "http-ctrl-in",
    "type": "http in",
    "z": "5cd3b4b96ddf7040",
    "name": "Control HTTP In",
    "url": "/smartlight/control",
    "method": "post",
    "upload": false,
    "swaggerDoc": "",
    "x": 280,
    "y": 820,
    "wires": [["http-ctrl-fn"]]
  },
  {
    "id": "http-ctrl-fn",
    "type": "function",
    "z": "5cd3b4b96ddf7040",
    "name": "Encode Control Cmd",
    "func": "var cmd = msg.payload;\nif(typeof cmd === 'string') { cmd = JSON.parse(cmd); }\nvar method = cmd.method || 'setDimming';\nvar value  = Number(cmd.value) || 0;\nvar hexBytes;\nif(method === 'setDimming') {\n    var level = Math.max(0, Math.min(200, Math.round(value)));\n    hexBytes = Buffer.from([0x01, level]);\n} else if(method === 'setMaxCurrent') {\n    var pct = Math.max(10, Math.min(100, Math.round(value)));\n    hexBytes = Buffer.from([0x02, pct]);\n} else if(method === 'powerOn')  { hexBytes = Buffer.from([0x01, 200]); }\n  else if(method === 'powerOff')  { hexBytes = Buffer.from([0x01, 0]);   }\n  else if(method === 'resetDriver') { hexBytes = Buffer.from([0xFF]);     }\n  else { hexBytes = Buffer.from([0x01, 0]); }\nvar ttsPayload = JSON.stringify({ downlinks: [{ f_port: 10, frm_payload: hexBytes.toString('base64'), priority: 'NORMAL' }] });\nnode.log('Downlink: ' + ttsPayload);\nvar respMsg = { payload: JSON.stringify({ok:true, method:method, value:value}), res: msg.res, req: msg.req };\nvar ttsMsg  = { payload: ttsPayload };\nreturn [respMsg, ttsMsg];",
    "outputs": 2,
    "timeout": "",
    "noerr": 0,
    "initialize": "",
    "finalize": "",
    "libs": [],
    "x": 520,
    "y": 820,
    "wires": [["http-ctrl-resp"], ["tts-downlink-2"]]
  },
  {
    "id": "http-ctrl-resp",
    "type": "http response",
    "z": "5cd3b4b96ddf7040",
    "name": "Control Response",
    "statusCode": "200",
    "headers": {"Content-Type": "application/json"},
    "x": 780,
    "y": 820,
    "wires": []
  }
]
'@

$existing = Invoke-RestMethod -Uri "http://13.205.43.53:1880/flow/5cd3b4b96ddf7040" -Method GET
$newNodesParsed = $newNodes | ConvertFrom-Json
$existing.nodes += $newNodesParsed

$body = $existing | ConvertTo-Json -Depth 20
$result = Invoke-RestMethod -Uri "http://13.205.43.53:1880/flow/5cd3b4b96ddf7040" -Method PUT -ContentType "application/json" -Body $body
Write-Host "Deploy result: $($result | ConvertTo-Json)"
