# Privacy

Plain statement (matches the code; HANDOFF.md section 4):

- **Your photo never leaves your phone.** The text reading (OCR) happens in your browser. The image
  is never uploaded.
- **What is sent:** only the text lines read from your photo (after long numbers such as an
  Aadhaar number are removed on your phone, and minus any lines you untick) after explicit
  consent, optionally a confidence score per line, and the details you type or confirm for the
  comparison.
- **Where:** it is processed on AWS in Sydney, Australia (region `ap-southeast-2`). We make no
  claim that data stays in India.
- **Not stored:** text and details exist only in memory for the length of one request. Nothing is
  written to a database, file or log. The only stored data are anonymous counts (how many checks
  ran, how many found a mismatch).
- **Logs** hold metadata only: request id, route, document type, status, latency, extractor,
  error code.
- **Defence in depth:** the server re-checks the text for ID numbers and discards everything if it
  finds one (`422 id_number_detected`).
- **No trackers:** no analytics, no cookies, no third-party scripts, fonts or CDNs. Consent is held
  in memory for the session only; nothing is kept in browser storage.
- **Not identity verification:** this is a self-check. It does not contact any government system
  and is not legal advice.
