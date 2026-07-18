# Certificate Batch Generation Design

## Overview

Generate PDF certificates for selected interns via a batch action on the Document Page. Uses `@react-pdf/renderer` (`renderToFile`), saves PDFs outside the public directory, and records each document in the database.

## Architecture

```
DocumentPage (client)
  └─ batchAction onClick(selectedRows)
       └─ generateCertificates(internIds)  (server action)
            ├─ for each internId:
            │   ├─ fetch User + internProfile + supervisor
            │   ├─ generate document number (CERT/YYYY/MM/NNN)
            │   ├─ map props → InternshipCertificate
            │   ├─ renderToFile → generated/certificates/{docNumber}.pdf
            │   └─ prisma.document.create(...)
            └─ return results[]
```

## Files

| File | Action |
|------|--------|
| `features/hr/utils/document-number.ts` | CREATE — utility to generate `CERT/YYYY/MM/NNN` |
| `features/hr/actions/document-actions.ts` | CREATE — `generateCertificates` server action |
| `features/hr/pages/document-page.tsx` | MODIFY — wire batch action + toast |
| `generated/certificates/` | CREATE directory — PDF output (gitignored) |

## Server Action: `generateCertificates`

- Input: `internIds: string[]`
- Returns: `ActionResponse<{ internId: string; docNumber: string; filePath: string; error?: string }[]>`
- Each intern is independent (try/catch per iteration)
- Permission check: `{ document: ["create"] }`

### Per-intern flow

1. **Fetch data** — `prisma.user.findUnique` with `internProfile.supervisorAssignments[:1].supervisorProfile.user`
2. **Generate doc number** — `CERT/{year}/{month}/{NNN}`, pad to 3 digits, `@unique` constraint ensures no duplicates
3. **Map props** — `recipientName` → user.name, `organization` → internProfile.institution, `dateRange` → formatted period, `signerTitle/signerName` → from supervisor, others use defaults
4. **Render PDF** — `renderToFile(<InternshipCertificate {...props} />, "generated/certificates/{docNumber}.pdf")`
5. **Create record** — `prisma.document.create({ data: { internProfileId, documentType: "certificate", documentNumber, title: "Sertifikat Magang", fileUrl: filePath, status: "draft", metadata: { generatedAt: new Date().toISOString() } } })`

## Document Number Format

`CERT/YYYY/MM/NNN` — last 3 digits are sequential per month prefix, fetched by counting existing docs with `startsWith(prefix)`.

## Frontend Wiring

- `DocumentPage` batch actions: replace `onClick: () => {}` with `onClick async (rows) => { await generateCertificates(rows.map(r => r.id)); toast(...) }`
- Toast on completion: `"Berhasil membuat N sertifikat"` or `"N berhasil, M gagal"`
- Call `updateTag("documents")` to refresh server cache if data table is cached

## Error Handling

- Each intern is wrapped in try/catch → individual result objects with `error` string
- A failed intern does not abort remaining generations
- Frontend shows aggregate success/failure counts
