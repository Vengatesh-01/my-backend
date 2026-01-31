Write-Host "Testing YouTube API Integration..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "Triggering manual YouTube sync..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/reels/sync-youtube" -Method Post -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "New Reels Synced: $($response.reels.Count)" -ForegroundColor White
    Write-Host ""
    
    if ($response.reels.Count -gt 0) {
        Write-Host "Sample Reels:" -ForegroundColor Cyan
        $response.reels | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - $($_.caption)" -ForegroundColor White
            Write-Host "    Creator: $($_.creatorName)" -ForegroundColor Gray
            Write-Host "    Duration: $($_.duration)s" -ForegroundColor Gray
            Write-Host "    URL: $($_.videoUrl)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "No new reels found (videos may already be in database)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "======================================" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Details: $($errorObj.message)" -ForegroundColor Yellow
        Write-Host "Error: $($errorObj.error)" -ForegroundColor Yellow
    }
}
