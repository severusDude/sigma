$root = "C:\Users\Lutfi\Documents\Github\sigma"

# Use rg to find all TS/TSX files containing "department" (fast, skips node_modules natively)
$matches = rg --pcre2 --files-with-matches -i -g '!node_modules' -g '!prisma/migrations' -g '!generated' -g '!docs' -g '!.superpowers' -g '*.ts' -g '*.tsx' '(?<![\w-])[Dd]epartment(?![\w-])' $root

$changedFiles = @()
$totalChanges = 0

foreach ($filePath in $matches) {
  $content = Get-Content -Raw $filePath
  $original = $content

  $content = $content -creplace '(?<![\w-])departmentId(?![\w-])', 'teamId'
  $content = $content -creplace '(?<![\w-])Department(?![\w-])', 'Team'
  $content = $content -creplace '(?<![\w-])department(?![\w-])', 'team'
  $content = $content -creplace '(?<![\w-])departments(?![\w-])', 'teams'
  $content = $content -creplace '(?<![\w-])departmentName(?![\w-])', 'teamName'
  $content = $content -creplace '(?<![\w-])departmentOptions(?![\w-])', 'teamOptions'

  if ($content -ne $original) {
    Set-Content -NoNewline -Path $filePath -Value $content
    $changedFiles += $filePath
    $totalChanges++
  }
}

Write-Output "Files changed: $totalChanges"
$changedFiles | ForEach-Object { Write-Output "  $_" }
