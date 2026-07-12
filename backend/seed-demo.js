const dotenv = require('dotenv');
const sql = require('./src/config/database');
const User = require('./src/models/User');
const Listing = require('./src/models/Listing');

dotenv.config();

const demoUsers = [
  {
    name: 'Alice Khumalo',
    email: 'alice@ub.bw',
    password: 'DemoPass123',
    studentId: 'UB2024001'
  },
  {
    name: 'Brian Molefe',
    email: 'brian@ub.bw',
    password: 'DemoPass123',
    studentId: 'UB2024002'
  },
  {
    name: 'Chipo Moyo',
    email: 'chipo@ub.bw',
    password: 'DemoPass123',
    studentId: 'UB2024003'
  }
];

const demoListings = [
  {
    title: 'Introduction to Economics Textbook',
    category: 'textbook',
    description: 'Gently used textbook for ECON 101 with notes in the margins. Great condition and perfect for the semester.',
    price: 150,
    condition: 'good',
    courseCode: 'ECON101',
    author: 'Michael Parkin',
    edition: '9th',
    userEmail: 'alice@ub.bw'
  },
  {
    title: 'Single Room Near UB Main Campus',
    category: 'room',
    description: 'Spacious single room available for the semester. Furnished, shared kitchen, 5 minutes from campus.',
    price: 1200,
    condition: 'like-new',
    location: 'UB Main Campus',
    bedrooms: 1,
    furnished: true,
    availableFrom: new Date().toISOString().slice(0, 10),
    userEmail: 'brian@ub.bw'
  },
  {
    title: 'Experienced Math Tutor for High School',
    category: 'tutor',
    description: 'I offer tutoring for O-Level and A-Level math. Over 3 years of tutoring experience and flexible scheduling.',
    price: 200,
    condition: 'good',
    subjects: ['Mathematics', 'Statistics'],
    ratePerHour: 120,
    bio: 'UB graduate with high marks in mathematics and tutoring experience for local students.',
    userEmail: 'chipo@ub.bw'
  },
  {
    title: 'Desk Lamp + Study Chair Bundle',
    category: 'general',
    description: 'A sturdy desk lamp and ergonomic study chair ideal for late-night studying.',
    price: 280,
    condition: 'good',
    userEmail: 'alice@ub.bw'
  },
  {
    title: 'Organic Chemistry Lecture Notes',
    category: 'textbook',
    description: 'Handwritten organic chemistry notes and practice questions. Very useful for exam prep.',
    price: 100,
    condition: 'like-new',
    courseCode: 'CHEM201',
    userEmail: 'brian@ub.bw'
  }
];

async function ensureUser(userData) {
  const existing = await User.findByEmail(userData.email);
  if (existing) {
    console.log(`Using existing user: ${userData.email}`);
    return existing;
  }
  const created = await User.create(userData);
  console.log(`Created user: ${created.email}`);
  return created;
}

async function createListing(listingData, userId) {
  const listing = await Listing.create({
    userId,
    category: listingData.category,
    title: listingData.title,
    description: listingData.description,
    price: listingData.price,
    condition: listingData.condition,
    courseCode: listingData.courseCode,
    author: listingData.author,
    edition: listingData.edition
  });

  if (listingData.category === 'room') {
    await sql`
      INSERT INTO rooms (listing_id, location, bedrooms, furnished, available_from)
      VALUES (
        ${listing.id},
        ${listingData.location || null},
        ${listingData.bedrooms || 1},
        ${listingData.furnished === true || listingData.furnished === 'true'},
        ${listingData.availableFrom || null}
      )
    `;
  }

  if (listingData.category === 'tutor') {
    await sql`
      INSERT INTO tutors (listing_id, user_id, subjects, rate_per_hour, bio, is_premium)
      VALUES (
        ${listing.id},
        ${userId},
        ${listingData.subjects || []},
        ${listingData.ratePerHour || 0},
        ${listingData.bio || ''},
        false
      )
    `;
  }

  console.log(`Created listing: ${listing.title} (category=${listing.category})`);
  return listing;
}

async function main() {
  try {
    const userMap = {};
    for (const userData of demoUsers) {
      const user = await ensureUser(userData);
      userMap[user.email] = user;
    }

    for (const listingData of demoListings) {
      const user = userMap[listingData.userEmail];
      if (!user) {
        console.warn(`Skipping listing because user not found: ${listingData.title}`);
        continue;
      }

      const existing = await sql`
        SELECT id FROM listings WHERE title = ${listingData.title} AND user_id = ${user.id}
      `;
      if (existing.length > 0) {
        console.log(`Listing already exists: ${listingData.title}`);
        continue;
      }

      await createListing(listingData, user.id);
    }

    console.log('Demo seed complete.');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await sql.end({ timeout: 5 });
    process.exit(0);
  }
}

main();
