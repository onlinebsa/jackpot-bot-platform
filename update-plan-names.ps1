# Run this from inside your project folder (jackpotbot.app) in PowerShell:
#   .\update-plan-names.ps1

function Replace-InFile($path, $pairs) {
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Host "SKIP (not found): $path" -ForegroundColor Yellow
        return
    }
    $content = Get-Content -LiteralPath $path -Raw
    foreach ($pair in $pairs) {
        $content = $content.Replace($pair[0], $pair[1])
    }
    Set-Content -LiteralPath $path -Value $content -NoNewline
    Write-Host "Updated: $path" -ForegroundColor Green
}

# 1. Broadcast page
Replace-InFile 'src\app\admin\(protected)\broadcast\page.tsx' @(
    ,('label: "Active Monthly" }', 'label: "Active Starter Monthly Plan" }')
    ,('label: "Active 2-Year Plan" }', 'label: "Active 2 Year Pro Plan" }')
)

# 2. Payouts page
Replace-InFile 'src\app\admin\(protected)\payouts\page.tsx' @(
    ,('{ monthly: "Monthly", onetime: "2-Year Plan" }', '{ monthly: "Starter Monthly Plan", onetime: "2 Year Pro Plan" }')
)

# 3. Sales dashboard
Replace-InFile 'src\app\admin\(protected)\sales\page.tsx' @(
    ,('>Monthly subscribers<', '>Starter Monthly Plan subscribers<')
    ,('>2-Year Plan subscribers<', '>2 Year Pro Plan subscribers<')
)

# 4. Customer dashboard
Replace-InFile 'src\app\dashboard\page.tsx' @(
    ,('profile.plan === "monthly" ? "Monthly" : "2-Year Plan"', 'profile.plan === "monthly" ? "Starter Monthly Plan" : "2 Year Pro Plan"')
)

# 5. Payment page (dropdown options)
Replace-InFile 'src\app\dashboard\payment\page.tsx' @(
    ,('<option value="monthly">Monthly,', '<option value="monthly">Starter Monthly Plan,')
    ,('<option value="onetime">2-Year Plan,', '<option value="onetime">2 Year Pro Plan,')
)

# 6. Homepage
Replace-InFile 'src\app\page.tsx' @(
    ,('>Monthly</h3>', '>Starter Monthly Plan</h3>')
    ,('Choose Monthly', 'Choose Starter Monthly Plan')
    ,('>2-Year Plan</h3>', '>2 Year Pro Plan</h3>')
    ,('Choose 2-Year Plan', 'Choose 2 Year Pro Plan')
)

# 7. Referral card
Replace-InFile 'src\components\ReferralCard.tsx' @(
    ,('{ monthly: "Monthly", onetime: "2-Year Plan" }', '{ monthly: "Starter Monthly Plan", onetime: "2 Year Pro Plan" }')
    ,('takes the Monthly plan,', 'takes the Starter Monthly Plan,')
    ,('for the 2-Year Plan.', 'for the 2 Year Pro Plan.')
)

Write-Host "`nAll done. Now run: git add . ; git commit -m 'Update plan names everywhere' ; git push" -ForegroundColor Cyan
