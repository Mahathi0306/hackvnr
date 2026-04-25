const XLSX = require('xlsx');
const workbook = XLSX.readFile('c:/Users/dhubh/OneDrive/Desktop/mah/dataset_linkedin-profile-posts_2026-04-24_21-06-14-745.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
if (rows.length > 0) {
  console.log("Headers:", rows[0]);
  if (rows.length > 1) {
    console.log("First Row:", rows[1]);
  }
} else {
  console.log("Empty sheet");
}
