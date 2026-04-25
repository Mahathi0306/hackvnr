const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Lead = require('./backend/models/Lead');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

async function importData() {
  try {
    // Connect to MongoDB
    let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leadcrm';
    if (process.env.USE_MEMORY_MONGO === 'true') {
      console.log('Skipping import for memory-mongo mode, start regular mongo if you want to persist this');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Read the Excel file
    const filePath = path.join(__dirname, 'dataset_linkedin-profile-posts_2026-04-24_21-06-14-745.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`Read ${rows.length} rows from the dataset.`);
    
    const leadsToInsert = rows.map(row => {
      // Map the dataset columns to your Lead schema
      return {
        username: row['author/name'] || row['author/publicIdentifier'] || 'Unknown User',
        full_name: row['author/name'] || '',
        profile_url: row['author/linkedinUrl'] || '',
        platform: 'LinkedIn', // Assuming dataset is strictly LinkedIn based on the filename
        post_content: row['content'] || 'No content',
        post_url: row['linkedinUrl'] || row['article/link'] || '',
        post_date: row['postedAt/timestamp'] ? new Date(row['postedAt/timestamp']) : new Date(),
        status: 'New',
        intent_score: 5, // Default/middle intent score
        intent_reason: 'Imported from scraped dataset',
        activity_log: [{ action: 'Imported from Excel dataset', timestamp: new Date() }]
      };
    });

    // Clear existing leads (optional, comment out if you want to append)
    // await Lead.deleteMany({});
    
    // Insert new leads
    const result = await Lead.insertMany(leadsToInsert);
    console.log(`Successfully imported ${result.length} scraped leads into the database!`);
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

importData();
