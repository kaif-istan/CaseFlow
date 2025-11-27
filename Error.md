### 🐛 Prisma 7.0.0’s generated TypeScript client doesn’t type-check correctly in this setup, so `tsc --noEmit` blows up during your `check-types` step.

Can be fixed by downgrading to Prisma 6.14.0.

-------------------------------------------

### 🐛 CSV Import Mapping Bug — Issue & Fix

#### Issue

During CSV import, the fields `caseId` and `applicantName` showed up as empty in the Review Grid. Validation failed with messages like:

> Missing required fields: caseId or applicantName

Even though the CSV contained valid values.

#### Root Cause

The CSV worker (`csvWorker.ts`) parsed headers exactly as they appeared in the CSV—typically in snake_case:

```json
{
  "case_id": "C-1001",
  "applicant_name": "Asha Verma",
  "dob": "2002-09-14"
}
```

But the import system (mapping UI, ImportGrid, validation, and backend) expects camelCase:

```json
{
  "caseId": "C-1001",
  "applicantName": "Asha Verma"
}
```

Because the keys didn’t match:

- ImportGrid rendered blank fields
- Validation flagged missing required fields
- Final payload sent to backend was missing values
- Backend threw unique constraint errors because empty `caseId` values were inserted or skipped

#### Fix Implemented

We added a normalization step in `csvWorker.ts` to convert every parsed CSV row into camelCase fields immediately.

**✔ What the fix does**

- Converts snake_case → camelCase (`case_id` → `caseId`)
- Ensures `rawRows` always match the `CaseRow` TypeScript interface
- Ensures all UI components receive standardized field names
- Prevents undefined values in grid & validation
- Prevents incorrect payloads from reaching the backend

**✔ Example After Fix**

```json
{
  "caseId": "C-1001",
  "applicantName": "Asha Verma",
  "dob": "2002-09-14"
}
```

**✔ No changes needed in the UI**
Because the pipeline now receives consistently structured rows, everything works:

- `ColumnMappingSheet` auto-matches correctly
- `ImportGrid` displays correct values
- Validation becomes accurate
- Final payload contains the correct fields

#### Why This Fix Is Optimal

- Normalization happens instantly at CSV parse time (the earliest point)
- Keeps all other parts of the import pipeline clean and predictable
- Avoids adding fallback hacks or duplicate mappings in multiple files
- Ensures complete cross-system consistency


Build Time vs. Run Time: The RUN command happens during the build process. At this stage, your Docker Compose services (like Postgres) are not running yet, so the build container cannot connect to them.
Validation Only: prisma generate builds the client code from your schema. It doesn't need a real DB connection, but Prisma 7 checks that DATABASE_URL exists in the environment because it's in your config file.
Dummy Value: The dummy URL exists solely to satisfy this check so the build doesn't crash.
Real Value: When the container starts (Run Time), the 
docker-compose.yml
 injects the real DATABASE_URL, and that's what the app uses to connect.