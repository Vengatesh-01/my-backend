$base = "http://localhost:5000/api"

# 1. Register
$body = @{
    username = "api_test_user_$(Get-Random)"
    email = "api_test_$(Get-Random)@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Registration Success: $($regResponse.username)"
    $token = $regResponse.token
} catch {
    Write-Host "Registration Failed: $_"
    exit
}

# 2. Create Post
$headers = @{
    Authorization = "Bearer $token"
}
$postBody = @{
    text = "Hello from PowerShell Test"
} | ConvertTo-Json

try {
    $postResponse = Invoke-RestMethod -Uri "$base/posts" -Method Post -Headers $headers -Body $postBody -ContentType "application/json"
    Write-Host "Post Created: $($postResponse.text)"
} catch {
    Write-Host "Post Creation Failed: $_"
    exit
}

# 3. Get Posts
try {
    $feedResponse = Invoke-RestMethod -Uri "$base/posts" -Method Get -Headers $headers
    Write-Host "Feed Fetched. Count: $($feedResponse.Count)"
    if ($feedResponse[0].text -eq "Hello from PowerShell Test") {
        Write-Host "Verification PASSED!"
    } else {
        Write-Host "Verification FAILED: Post not found in feed."
    }
} catch {
    Write-Host "Feed Fetch Failed: $_"
}
