Fix CSV Import Flow
The current CSV import flow has broken state logic, causing the mapping sheet to close prematurely and the grid to render with invalid data. I will implement a strict state machine approach using mappingCompleted to control the flow.

User Review Required
IMPORTANT

I will be modifying rawRows in the Redux store when the user completes mapping. This transforms the raw CSV data (with arbitrary headers) into structured data (with caseId, etc.) based on the user's mapping. This is a destructive operation on rawRows but necessary for the rest of the app to function correctly.

Proposed Changes
Store Updates
[MODIFY] 
importSlice.ts
Add mappingCompleted: boolean to 
ImportState
 (default false).
Add setMappingCompleted reducer.
Add applyMapping reducer:
Takes current columnMapping and transforms rawRows.
Renames keys in rawRows from CSV headers to caseId, applicantName, etc.
Preserves unmapped fields? (Likely not needed, but safe to keep).
Update 
setParsedData
 to reset mappingCompleted to false.
[MODIFY] 
importEditSlice.ts
Remove automatic validation in 
setParsedData
 (extraReducers).
Add revalidateAll reducer to trigger validation manually (to be called after mapping is applied).
Component Updates
[MODIFY] 
ColumnMappingSheet.tsx
Update isOpen logic: parsedAt && !mappingCompleted.
Update "Continue to Review" button:
Dispatch applyMapping.
Dispatch revalidateAll.
Dispatch setMappingCompleted(true).
Fix Drag & Drop IDs:
Use 
header
 string for draggable items (headers).
Use field.key for droppable items (fields).
Ensure no ID collisions if possible (though user requirement implies simple IDs).
[MODIFY] 
ImportGrid.tsx
Render null or "Not mapped" message if !mappingCompleted.
Remove the "fallback mapping" logic in 
handleSubmit
 since rawRows will already be mapped.
Ensure columns definition relies on the now-mapped rawRows.
[MODIFY] 
import-upload.tsx
Ensure it works with the new flow (mostly existing logic is fine, just verify).
Verification Plan
Automated Tests
I will run the existing Playwright tests if available, but the user didn't provide them in the context (only mentioned e2e/import-flow.spec.ts in history). I will check if I can run them.
I will rely heavily on the "Test Scenarios" provided by the user.
Manual Verification
Upload CSV with wrong headers:
Upload a CSV where headers don't match.
Verify Sheet opens.
Verify Grid is HIDDEN.
Map fields.
Click Continue.
Verify Grid renders with CORRECT data (no empty columns).
Verify Sheet closes.
Upload good CSV:
Upload CSV with perfect headers.
Verify Sheet opens (auto-mapped).
Click Continue.
Verify Grid renders.
Validation:
Upload CSV with missing required data.
Verify validation errors appear ONLY after mapping.
State Reset:
Click "Import Another" (or upload new file).
Verify mappingCompleted resets and Sheet opens again.


CSV Import Flow Fix Walkthrough
I have implemented a robust fix for the CSV import flow by introducing a strict state machine and correcting the data pipeline.

Changes Overview
1. Strict State Machine (mappingCompleted)
Before: The app guessed when to show the grid based on mapping existence, leading to premature rendering and broken state.
After: Added mappingCompleted boolean to Redux.
Step 1: Upload CSV → mappingCompleted = false.
Step 2: Sheet opens (because !mappingCompleted). Grid is HIDDEN.
Step 3: User maps columns.
Step 4: User clicks "Continue" → mappingCompleted = true.
Step 5: Sheet closes. Grid renders.
2. Data Pipeline Correction
Before: csvWorker tried to "normalize" data immediately, guessing headers and often failing, causing the mapping UI to be confused.
After: csvWorker now returns RAW data and headers.
Transformation: When user clicks "Continue", 
applyMapping
 action is dispatched. This explicitly transforms the raw rows into canonical CaseRow objects based on the user's mapping.
3. Validation Logic
Before: Validation ran immediately on upload, showing errors for unmapped fields.
After: Validation (
revalidateAll
) runs ONLY after mapping is applied.
Verification Steps
Scenario 1: Upload with Random Headers
Upload a CSV with headers like 
id
, full_name, contact_no.
Verify:
The Column Mapping Sheet opens automatically.
The Import Grid is NOT visible (you should see a "Please map..." message or nothing).
Action: Drag 
id
 to Case ID, full_name to Applicant Name, etc.
Action: Click "Continue to Review".
Verify:
The Sheet closes.
The Grid appears.
The data in the grid matches your mapping (e.g., Applicant Name column shows data from full_name).
Scenario 2: Auto-Mapping
Upload a CSV with standard headers (Case ID, Applicant Name, etc.).
Verify:
The Sheet opens.
The fields are Auto-Mapped (you see the chips already in the boxes).
Action: Click "Continue to Review".
Verify:
The Grid appears with correct data.
Scenario 3: Validation
Upload a CSV with missing required data (e.g., empty Case ID).
Verify:
No errors shown in the Sheet (unless you want to add that feature later).
Action: Map and Continue.
Verify:
The Grid shows Validation Errors (red cells/badges) for the missing data.
Files Modified
apps/web/src/store/importSlice.ts
apps/web/src/store/importEditSlice.ts
apps/web/src/components/ColumnMappingSheet.tsx
apps/web/src/components/ImportGrid.tsx
apps/web/src/lib/workers/csvWorker.ts