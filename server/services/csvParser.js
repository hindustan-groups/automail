const { parse } = require('csv-parse/sync');

/**
 * Parse CSV buffer into array of { email, name } objects
 */
function parseCSV(buffer) {
  const content = buffer.toString('utf-8');

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const contacts = [];
  const errors = [];

  records.forEach((row, index) => {
    // Try to find email column (case-insensitive)
    const email = row.email || row.Email || row.EMAIL || row['email address'] || row['Email Address'] || '';
    const name = row.name || row.Name || row.NAME || row['full name'] || row['Full Name'] || '';

    if (!email) {
      errors.push(`Row ${index + 2}: No email found`);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push(`Row ${index + 2}: Invalid email "${email}"`);
      return;
    }

    contacts.push({
      email: email.trim().toLowerCase(),
      name: name.trim(),
    });
  });

  // Deduplicate by email
  const seen = new Set();
  const unique = contacts.filter((c) => {
    if (seen.has(c.email)) return false;
    seen.add(c.email);
    return true;
  });

  return { contacts: unique, errors, totalParsed: records.length };
}

module.exports = { parseCSV };
