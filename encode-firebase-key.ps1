$jsonContent = Get-Content -Path ".\src\config\adminSDK.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonContent)
$encoded = [Convert]::ToBase64String($bytes)
Set-Content -Path "encoded.txt" -Value $encoded