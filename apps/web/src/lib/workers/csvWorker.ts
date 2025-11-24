// apps/web/src/lib/workers/csvWorker.ts
import Papa from "papaparse";

// ------------------------------------------------------------
// Convert CSV snake_case headers → camelCase CaseRow format
// ------------------------------------------------------------
function normalizeRow(row: any) {
  return {
    caseId: row.caseId || row.case_id || row["case id"] || row["Case ID"] || "",

    applicantName:
      row.applicantName ||
      row.applicant_name ||
      row["Applicant Name"] ||
      row["applicant name"] ||
      "",

    dob:
      row.dob || row.DOB || row["date of birth"] || row["Date of Birth"] || "",

    email: row.email || row.Email || "",

    phone: row.phone || row.Phone || "",

    category: row.category || row.Category || "",

    priority: row.priority || row.Priority || "",
  };
}

self.onmessage = (e: MessageEvent<string>) => {
  const csvText = e.data;

  if (typeof csvText !== "string" || csvText.length === 0) {
    self.postMessage({
      data: [],
      headers: [],
      totalRows: 0,
      error: "Empty CSV",
    });
    return;
  }

  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,

    complete: (result) => {
      if (result.errors.length > 0) {
        self.postMessage({
          data: [],
          headers: [],
          totalRows: 0,
          error: result?.errors?.[0]?.message ?? "Parse error",
        });
        return;
      }

      // original CSV fields
      const originalData = result.data as any[];

      // 🚀 Normalize into camelCase rows for entire pipeline
      const normalized = originalData.map((row) => normalizeRow(row));

      // We use camelCase headers only
      const headers = [
        "caseId",
        "applicantName",
        "dob",
        "email",
        "phone",
        "category",
        "priority",
      ];

      self.postMessage({
        data: normalized,
        headers,
        totalRows: normalized.length,
      });
    },

    error: (error: Error) => {
      self.postMessage({
        data: [],
        headers: [],
        totalRows: 0,
        error: error.message,
      });
    },
  });
};
