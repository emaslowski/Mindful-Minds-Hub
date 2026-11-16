<#
.SYNOPSIS
  Roll the main hub's current image out to every school hub (services named hub-*).

.DESCRIPTION
  The main hub (thebrightsidehub) is rebuilt and deployed automatically on every push to
  main. School hubs are separate services, so run this afterwards to bring them to the
  same version. Each school's data, settings and web address stay untouched.

.EXAMPLE
  .\scripts\update-school-hubs.ps1
#>
param(
  [string] $Project = 'the-brightside-project-llc',
  [string] $Region = 'us-east1',
  [string] $MainService = 'thebrightsidehub'
)
$ErrorActionPreference = 'Stop'
$image = gcloud.cmd run services describe $MainService --region $Region --project $Project --format "value(spec.template.spec.containers[0].image)"
Write-Host "Main hub image: $image"
$services = gcloud.cmd run services list --region $Region --project $Project --format "value(metadata.name)" | Where-Object { $_ -like 'hub-*' }
if (-not $services) { Write-Host 'No school hubs yet.'; exit 0 }
foreach ($s in $services) {
  Write-Host "`n== $s" -ForegroundColor Cyan
  gcloud.cmd run services update $s --image $image --region $Region --project $Project | Out-Null
  Write-Host "updated"
}
Write-Host "`nDone: $($services.Count) school hub(s) now run the same version as the main hub." -ForegroundColor Green
