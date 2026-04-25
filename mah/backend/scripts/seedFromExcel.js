const XLSX = require('xlsx');
const path = require('path');
const Lead = require('../models/Lead');

const seedFromExcel = async () => {
  try {
    const filePath = path.join(__dirname, '../../dataset_linkedin-profile-posts_2026-04-24_21-06-14-745.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const leadsToInsert = rows.map(row => {
      return {
        username: row['author/name'] || row['author/publicIdentifier'] || 'Unknown User',
        full_name: row['author/name'] || '',
        profile_url: row['author/linkedinUrl'] || '',
        platform: 'LinkedIn',
        post_content: row['content'] || 'No content',
        post_url: row['linkedinUrl'] || row['article/link'] || '',
        post_date: row['postedAt/timestamp'] ? new Date(row['postedAt/timestamp']) : new Date(),
        status: 'New',
        intent_score: 5,
        intent_reason: 'Imported from scraped dataset',
        activity_log: [{ action: 'Imported from Excel dataset', timestamp: new Date() }]
      };
    });

    await Lead.deleteMany({});
    const result = await Lead.insertMany(leadsToInsert);
    console.log(`Successfully seeded ${result.length} scraped leads from Excel into the database.`);
    return result.length;
  } catch (err) {
    console.error('Seed from Excel Error:', err);
    throw err;
  }
};

module.exports = seedFromExcel;
