<#
.SYNOPSIS
  Give a school its own Brightside hub: its own database and its own Cloud Run service.

.DESCRIPTION
  Every school hub runs the same image as the main hub (thebrightsidehub) against its
  own database on the shared Cloud SQL instance. The hub creates its own tables on
  first start (DB_INIT_ON_START=1), then seeds the default jobs, teams and the teacher
  accounts listed in ADMIN_EMAILS. Nothing is shared between schools except the code.

  Run from a PowerShell window where gcloud.cmd is signed in as the project owner.

.EXAMPLE
  .\scripts\new-school-hub.ps1 -Slug lincoln -SchoolName "Lincoln Middle School" `
      -TeacherEmails "jdoe@lincoln.k12.ny.us,asmith@lincoln.k12.ny.us" -Code LINCOLN-2026

.EXAMPLE
  # With its own web address (then add the CNAME the script prints at your DNS host)
  .\scripts\new-school-hub.ps1 -Slug lincoln -SchoolName "Lincoln Middle School" `
      -TeacherEmails "jdoe@lincoln.k12.ny.us" -Domain lincoln.thebrightsidewellnessproject.com
#>
param(
  [Parameter(Mandatory)] [ValidatePattern('^[a-z][a-z0-9-]{1,29}$')] [string] $Slug,
  [Parameter(Mandatory)] [string] $SchoolName,
  [Parameter(Mandatory)] [string] $TeacherEmails,
  [string] $Code = '',
  [string] $Domain = '',
  [string] $Project = 'the-brightside-project-llc',
  [string] $Region = 'us-east1',
  [string] $SqlInstance = 'brightside-db',
  [string] $MainService = 'thebrightsidehub',
  [string] $Owner = 'brightsidewellnesshub@gmail.com'
)

$ErrorActionPreference = 'Stop'
$service = "hub-$Slug"
$dbName = "brightside_" + ($Slug -replace '-', '_')
if (-not $Code) { $Code = ($Slug.ToUpper() + '-' + (Get-Date).Year) }

function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }

Step "Reading the main hub's configuration"
$main = gcloud.cmd run services describe $MainService --region $Region --project $Project --format json | ConvertFrom-Json
$container = $main.spec.template.spec.containers[0]
$image = $container.image
$sqlConn = $main.spec.template.metadata.annotations.'run.googleapis.com/cloudsql-instances'
Write-Host "image: $image"

# Plain env vars are copied; secrets are referenced by name; a few are overridden per school.
$teachers = ($TeacherEmails -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join ','
$override = @{
  APP_URL                   = ''   # set after the first deploy (needs the service URL) unless a domain is given
  ADMIN_EMAILS              = "$teachers,$Owner"
  SITE_OWNER_EMAILS         = "$teachers,$Owner"
  DATABASE_NAME             = $dbName
  DB_INIT_ON_START          = '1'
  PRIVATE_OBJECT_DIR        = "/brightside-project-uploads/.private/schools/$Slug"
  PUBLIC_OBJECT_SEARCH_PATHS = "/brightside-project-uploads/public/schools/$Slug"
}
if ($Domain) { $override.APP_URL = "https://$Domain" }

$envFile = Join-Path $env:TEMP "hub-$Slug-env.yaml"
$lines = @()
$secrets = @()
foreach ($e in $container.env) {
  if ($e.valueFrom) { $secrets += "$($e.name)=$($e.valueFrom.secretKeyRef.name):latest"; continue }
  $value = if ($override.ContainsKey($e.name)) { $override[$e.name] } else { $e.value }
  if ($value -ne '') { $lines += "$($e.name): '" + ($value -replace "'", "''") + "'" }
}
foreach ($k in $override.Keys) {
  if (-not ($container.env | Where-Object { $_.name -eq $k }) -and $override[$k] -ne '') { $lines += "${k}: '$($override[$k])'" }
}
$lines | Out-File -Encoding ascii $envFile

Step "Creating database $dbName on $SqlInstance"
$existing = gcloud.cmd sql databases list --instance $SqlInstance --project $Project --format "value(name)"
if ($existing -contains $dbName) { Write-Host "already exists, keeping it" } else {
  gcloud.cmd sql databases create $dbName --instance $SqlInstance --project $Project | Out-Null
}

Step "Deploying Cloud Run service $service"
gcloud.cmd run deploy $service --image $image --region $Region --project $Project --platform managed `
  --allow-unauthenticated --port 8080 --max-instances 2 --cpu-boost `
  --add-cloudsql-instances $sqlConn `
  --env-vars-file $envFile `
  --set-secrets ($secrets -join ',') | Out-Null
Remove-Item $envFile -ErrorAction SilentlyContinue

$url = gcloud.cmd run services describe $service --region $Region --project $Project --format "value(status.url)"
if (-not $Domain) {
  Step "Pinning APP_URL to $url"
  gcloud.cmd run services update $service --region $Region --project $Project --update-env-vars "APP_URL=$url" | Out-Null
  $appUrl = $url
} else {
  $appUrl = "https://$Domain"
  Step "Mapping $Domain to $service"
  gcloud.cmd beta run domain-mappings create --service $service --domain $Domain --region $Region --project $Project 2>&1 | Out-Null
  $cname = gcloud.cmd beta run domain-mappings describe --domain $Domain --region $Region --project $Project --format "value(status.resourceRecords[0].rrdata)"
}

Step "Allowing $appUrl to upload to the storage bucket (CORS)"
$bucket = 'gs://brightside-project-uploads'
$corsFile = Join-Path $env:TEMP "hub-$Slug-cors.json"
$cors = gcloud.cmd storage buckets describe $bucket --project $Project --format "json(cors_config)" | ConvertFrom-Json
$rules = @($cors.cors_config)
if ($rules.Count -gt 0) {
  $origins = @($rules[0].origin)
  if ($origins -notcontains $appUrl) { $rules[0].origin = $origins + $appUrl }
} else {
  $rules = @(@{ origin = @($appUrl); method = @('PUT', 'GET', 'HEAD'); responseHeader = @('Content-Type'); maxAgeSeconds = 3600 })
}
ConvertTo-Json -Depth 5 @($rules) | Out-File -Encoding ascii $corsFile
gcloud.cmd storage buckets update $bucket --project $Project --cors-file $corsFile | Out-Null
Remove-Item $corsFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "================ $SchoolName hub is up ================" -ForegroundColor Green
Write-Host "Hub (students):      $appUrl"
Write-Host "Command Center:      $appUrl/studio/"
Write-Host "Teachers who can sign in: $teachers (plus $Owner)"
Write-Host ""
Write-Host "Finish these by hand:" -ForegroundColor Yellow
Write-Host "1. Google sign-in: Cloud Console > APIs & Services > Credentials > the OAuth client, add this Authorized redirect URI:"
Write-Host "      $appUrl/api/auth/google/callback"
Write-Host "   and this Authorized JavaScript origin:"
Write-Host "      $appUrl"
if ($Domain) {
  Write-Host "2. DNS: at your domain host add a CNAME record   $($Domain.Split('.')[0])  ->  $cname"
  Write-Host "   The certificate is issued automatically once the record is live (usually under an hour)."
}
Write-Host "3. Kits site: in the main hub's Command Center > Site Assistant, say:"
Write-Host "      Add $SchoolName to the kit schools with code $Code and hub URL $appUrl"
Write-Host "4. Send the welcome email with code $Code and the link:"
Write-Host "      https://www.thebrightsidewellnessproject.com/school-login?code=$Code"
Write-Host ""
Write-Host "Later, after the main hub gets an update, run .\scripts\update-school-hubs.ps1 to roll it to every school."
