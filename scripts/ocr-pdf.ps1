param(
  [Parameter(Mandatory = $true)][string]$Path,
  [int]$Width = 2400
)

# OCR a scanned PDF using only what ships with Windows:
#   Windows.Data.Pdf   renders each page to a bitmap
#   Windows.Media.Ocr  reads the bitmap
# Both are WinRT, so this needs Windows PowerShell 5.1, not pwsh 7.
#
# Why this exists. The papers this knowledge base most needs are often the
# oldest ones, and a 1968 journal article arrives as a photograph of a page: it
# opens, it prints, and pdftotext gets 593 characters of download furniture out
# of it. Perry 1968 (PMID 5637757) carries six CTH claims and was the case that
# prompted this — 16,830 readable characters after OCR.
#
# Called automatically by fetch-fulltext.mjs --ingest when a dropped PDF yields
# too little text to be a real body. Run it by hand to inspect the result first:
#
#   powershell -File scripts/ocr-pdf.ps1 -Path "docs/fulltext/Perry 1968.pdf"
#
# Text goes to stdout, progress to stderr, so it can be redirected straight into
# docs/fulltext/<PMID>.txt. -Width sets the render width in pixels: 2400 is about
# 250 dpi on a journal page and reads 1960s type reliably. Lower is faster and
# worse.

Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($op, $type) {
  $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))
  $task.Wait(-1) | Out-Null
  $task.Result
}

$asTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.FullName -eq 'Windows.Foundation.IAsyncAction'
})[0]

function AwaitAction($op) {
  $task = $asTaskAction.Invoke($null, @($op))
  $task.Wait(-1) | Out-Null
}

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime] | Out-Null

$full = (Resolve-Path $Path).Path
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($full)) ([Windows.Storage.StorageFile])
$pdf = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $engine) { Write-Error 'no OCR language pack available'; exit 1 }

[Console]::Error.WriteLine("pages: $($pdf.PageCount), engine: $($engine.RecognizerLanguage.DisplayName), render width: $Width")

$out = New-Object System.Text.StringBuilder
for ($i = 0; $i -lt $pdf.PageCount; $i++) {
  $page = $pdf.GetPage($i)
  $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
  $opts = New-Object Windows.Data.Pdf.PdfPageRenderOptions
  $opts.DestinationWidth = $Width
  AwaitAction ($page.RenderToStreamAsync($stream, $opts))

  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

  foreach ($line in $result.Lines) { [void]$out.AppendLine($line.Text) }
  [void]$out.AppendLine()
  $bitmap.Dispose()
  $stream.Dispose()
  [Console]::Error.WriteLine("  page $($i + 1): $(@($result.Lines).Count) lines")
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$out.ToString()
