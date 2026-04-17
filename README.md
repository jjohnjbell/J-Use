# J-USE REOI 2026 Application System — Final Handover Package

**Status**: Frontend + PDF Renderer Complete | Backend Integration Pending  
**Deadline**: April 27, 2026

### Core Files

| File | Description |
|------|-------------|
| `J-USE_REOI_2026_Application_Form.html` | Main multi-step application form (authoritative source of truth) |
| `juse-full-pdf-renderer.html` | Dynamic PDF renderer template |
| `pdf-core.js` | Helper functions (`v()`, `setField()`, `setHTML()`) + main entry point |
| `pdf-sections.js` | Field population for all 10 PDF sections |
| `pdf-tables.js` | Dynamic table/list rendering (Focus Lenses, Benefit Traceability, Enablers, TNA, Documents) |
| `grants-email.html` | Internal grants team notification template |
| `applicant-email.html` | Applicant confirmation template |
| `sample-applicationData.json` | Full test payload for renderer testing |

### Architecture

The PDF renderer is modular:

- **pdf-core.js** — Core helpers and `renderFullApplicationPDF(data)` entry point
- **pdf-sections.js** — `populatePDFSections(data)` handles all scalar fields, description blocks, conditional visibility
- **pdf-tables.js** — `renderPDFTables(data)` handles all array-driven tables (outcomeMetrics, focusLenses, benefitTraceability, implementationStructure, enablersDetail, iucnCriteria, tnaMatrix, documents)

### Key Conditional Logic

| Feature | Condition | Behavior |
|---------|-----------|----------|
| Registration Date/Number | `regType` = Government or SOE | Row hidden entirely |
| Housing Vulnerability Context | `housingVulnerabilityTier` = Yes or Partially | Description box shown |
| Housing Vulnerability Context | `housingVulnerabilityTier` = No — Not a focus | Description box hidden |
| Housing Vulnerability Badge | 3-tier classification | 🟢 Green / 🟡 Amber / ⚪ Orange badge |
| Gender Analysis Findings | `genderAnalysisConducted` = true | Conditional block with findings |
| GBV Mitigation Measures | `gbvRiskConsidered` = true | Conditional block with measures |
| Value Proposition Model | Single model selection | Only selected model block visible |
| SOE/Government Contact | orgCategory contains SOE or Government | Secondary contact section shown |
| Additional Comments | `additionalComments` provided | Section shown, otherwise hidden |

### Value Proposition Models

| `data.pathway` | Display Label |
|-----------------|---------------|
| `market` | Revenue-Generating Model |
| `hybrid` | Hybrid Model (Revenue + Public Goods) |
| `public` | Public Goods Model |

### Backend Integration (What IT Must Complete)

1. **Relay / Netlify Function** — Generate canonical `ref_number`, call `renderFullApplicationPDF(data)` after PocketBase save
2. **PDF Persistence** — Store generated PDF, write URLs to record and Google Sheets
3. **Google Sheets** — Map all fields to the output workbook with PDF URLs
4. **Email Flow** — Use both templates with `{{REF_NUMBER}}` and `{{PDF_LINK}}` placeholders
5. **Frontend Consistency** — Treat `J-USE_REOI_2026_Application_Form.html` as the single source of truth for field names

### Testing

Use `sample-applicationData.json` to test the renderer. Run these scenarios:

1. Normal NGO submission — all fields populated
2. Government/SOE — Registration Date/Number hidden
3. Housing Vulnerability = "No — Not a focus" — context box hidden
4. Value Proposition with each model — only selected model visible
5. Gender + GBV false — conditional blocks hidden

### Support

Questions → reach out to T. Valerie Onu, SFM Specialist Team, Edge Catalyst Finance

Prepared: April 2026
