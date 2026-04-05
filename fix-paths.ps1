# Script to convert absolute paths to relative paths in HTML files
$htmlFiles = Get-ChildItem -Path "frontend" -Recurse -Filter "*.html"

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Convert /public/ to ../../public/
    $content = $content -replace 'src="/public/', 'src="../../public/'
    $content = $content -replace 'href="/public/', 'href="../../public/'
    
    # Convert /shared-assets/ to ../../shared-assets/
    $content = $content -replace 'src="/shared-assets/', 'src="../../shared-assets/'
    $content = $content -replace 'href="/shared-assets/', 'href="../../shared-assets/'
    
    # Convert /frontend/assets/ to ../../assets/
    $content = $content -replace 'href="/frontend/assets/', 'href="../../assets/'
    $content = $content -replace 'src="/frontend/assets/', 'src="../../assets/'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed paths in: $($file.FullName)"
    }
}

Write-Host "Path conversion complete!"
