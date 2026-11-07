import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Category } from '../models/Category.model';
import { City } from '../models/City.model';
import { User } from '../models/User.model';
import { Provider } from '../models/Provider.model';
import { Review } from '../models/Review.model';
import { Lead } from '../models/Lead.model';
import { reviewService } from '../services/review.service';
import { logger } from '../utils/logger';
import { CATEGORIES_SEED } from './data/categories';
import { CITIES_SEED } from './data/cities';
import { DEMO_PROVIDERS_SEED } from './data/demoProviders';

dotenv.config();

export interface SeedOptions {
  demo?: boolean;
}

export interface SeedSummary {
  categoriesInserted: number;
  categoriesSkipped: number;
  citiesInserted: number;
  citiesSkipped: number;
  adminCreated: boolean;
  demoProvidersInserted: number;
  demoProvidersSkipped: number;
  demoReviewsInserted: number;
  demoLeadsInserted: number;
}

export async function runSeed(options: SeedOptions = {}): Promise<SeedSummary> {
  if (options.demo && process.env.NODE_ENV === 'production') {
    throw new Error('Demo seed is strictly disallowed in production environment!');
  }

  const summary: SeedSummary = {
    categoriesInserted: 0,
    categoriesSkipped: 0,
    citiesInserted: 0,
    citiesSkipped: 0,
    adminCreated: false,
    demoProvidersInserted: 0,
    demoProvidersSkipped: 0,
    demoReviewsInserted: 0,
    demoLeadsInserted: 0,
  };

  logger.info(`Starting AraKart database seed (demo mode: ${Boolean(options.demo)})...`);

  // 1. Seed Categories (Base)
  for (const catData of CATEGORIES_SEED) {
    const existing = await Category.findOne({ slug: catData.slug });
    if (!existing) {
      await Category.create(catData);
      summary.categoriesInserted++;
    } else {
      summary.categoriesSkipped++;
    }
  }
  logger.info(`Categories: ${summary.categoriesInserted} inserted, ${summary.categoriesSkipped} skipped.`);

  // 2. Seed Cities (Base)
  for (const cityData of CITIES_SEED) {
    const existing = await City.findOne({ slug: cityData.slug });
    if (!existing) {
      await City.create(cityData);
      summary.citiesInserted++;
    } else {
      summary.citiesSkipped++;
    }
  }
  logger.info(`Cities: ${summary.citiesInserted} inserted, ${summary.citiesSkipped} skipped.`);

  // 3. Seed Admin User (Base)
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@arakart.local';
    const adminPhone = process.env.SEED_ADMIN_PHONE || '9999999999';
    const passwordHash = await bcrypt.hash('Admin@12345', 10);

    await User.create({
      name: 'System Admin',
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      role: 'admin',
      emailVerified: true,
      phoneVerified: true,
      authMethods: ['email'],
      preferredLanguage: 'hi',
    });
    summary.adminCreated = true;
    logger.info(`Admin user created: ${adminEmail} (phone: ${adminPhone})`);
  } else {
    logger.info(`Admin user already exists (${existingAdmin.email || existingAdmin.phone}). Skipping creation.`);
  }

  // 4. Demo Data (Development Only)
  if (options.demo) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Demo seed is strictly disallowed in production environment!');
    }

    logger.info('Seeding demo data (Customer, Seller, Providers, Reviews, Leads)...');

    // 4a. Demo Customer
    let demoCustomer = await User.findOne({ phone: '9876543210' });
    if (!demoCustomer) {
      const customerPasswordHash = await bcrypt.hash('Demo@12345', 10);
      demoCustomer = await User.create({
        name: 'Rahul Kumar (Demo Customer)',
        phone: '9876543210',
        email: 'customer@arakart.local',
        passwordHash: customerPasswordHash,
        role: 'customer',
        phoneVerified: true,
        emailVerified: true,
        authMethods: ['phone', 'email'],
        preferredLanguage: 'hi',
      });
    }

    // 4b. Demo Seller
    let demoSeller = await User.findOne({ phone: '9876543211' });
    if (!demoSeller) {
      const sellerPasswordHash = await bcrypt.hash('Demo@12345', 10);
      demoSeller = await User.create({
        name: 'Manoj Singh (Demo Seller)',
        phone: '9876543211',
        email: 'seller@arakart.local',
        passwordHash: sellerPasswordHash,
        role: 'seller',
        phoneVerified: true,
        emailVerified: true,
        authMethods: ['phone', 'email'],
        preferredLanguage: 'hi',
      });
    }

    // 4c. Demo Providers
    const createdProviders: any[] = [];
    for (const pData of DEMO_PROVIDERS_SEED) {
      const existing = await Provider.findOne({ phone: pData.phone });
      if (!existing) {
        const fromPrice =
          pData.services.length > 0
            ? Math.min(...pData.services.map((s) => s.startingPrice))
            : 0;

        const providerDoc = await Provider.create({
          owner: demoSeller._id,
          nameEn: pData.nameEn,
          nameHi: pData.nameHi,
          categories: pData.categories,
          area: pData.area,
          areaKey: pData.area.toLowerCase().trim(),
          areasServed: pData.areasServed,
          areasServedKeys: pData.areasServed.map((a) => a.toLowerCase().trim()),
          city: pData.city,
          phone: pData.phone,
          whatsapp: pData.whatsapp,
          bioEn: pData.bioEn,
          bioHi: pData.bioHi,
          experience: pData.experience,
          workingHours: pData.workingHours,
          verified: pData.verified,
          isLive: pData.isLive,
          status: pData.status,
          services: pData.services,
          fromPrice,
          avgRating: pData.avgRating,
          reviewCount: pData.reviewCount,
          profileViews: pData.profileViews,
          callClicks: pData.callClicks,
          whatsappClicks: pData.whatsappClicks,
        });

        summary.demoProvidersInserted++;
        createdProviders.push(providerDoc);
      } else {
        summary.demoProvidersSkipped++;
        createdProviders.push(existing);
      }
    }
    logger.info(`Demo Providers: ${summary.demoProvidersInserted} inserted, ${summary.demoProvidersSkipped} skipped.`);

    // 4d. Demo Reviews across providers
    if (createdProviders.length > 0 && demoCustomer) {
      const demoReviewTemplates = [
        {
          providerIndex: 0,
          customerName: 'Rahul Kumar',
          rating: 5,
          comment: 'Very fast and professional service in Nawada! Fixed my bike within 30 minutes.',
          sellerReply: 'Thank you Rahul ji! Happy to assist you anytime.',
        },
        {
          providerIndex: 0,
          customerName: 'Anand Singh',
          rating: 4,
          comment: 'Genuine engine oil change and chain adjustment at fair starting prices.',
        },
        {
          providerIndex: 1,
          customerName: 'Rahul Kumar',
          rating: 5,
          comment: 'Great electrician in Katira. Installed our inverter and MCB cleanly.',
          sellerReply: 'Dhanyawad Rahul bhai! Always glad to provide reliable service.',
        },
        {
          providerIndex: 1,
          customerName: 'Priya Verma',
          rating: 5,
          comment: 'Quick response on WhatsApp. Resolved wiring issue in Nawada within 45 minutes.',
        },
        {
          providerIndex: 2,
          customerName: 'Sunil Kumar',
          rating: 5,
          comment: 'Fixed our leaking bathroom pipe and replaced tap washers. Very neat work.',
          sellerReply: 'Thank you Sunil ji for trusting our plumbing work.',
        },
        {
          providerIndex: 2,
          customerName: 'Neha Sharma',
          rating: 4,
          comment: 'Punctual and charges were exactly as discussed beforehand.',
        },
        {
          providerIndex: 3,
          customerName: 'Vikram Patel',
          rating: 5,
          comment: 'Modular wooden wardrobe and door frame repaired neatly in Anaith. Sturdy polish!',
          sellerReply: 'Thank you Vikram ji! We take pride in quality woodwork.',
        },
        {
          providerIndex: 4,
          customerName: 'Alok Mishra',
          rating: 5,
          comment: 'Water tank and home deep cleaning was impeccable. Mechanized vacuum used.',
        },
        {
          providerIndex: 5,
          customerName: 'Sneha Kumari',
          rating: 5,
          comment: 'Bridal makeup and skin facial was outstanding. Very hygienic salon setup.',
        },
        {
          providerIndex: 6,
          customerName: 'Ritu Gupta',
          rating: 5,
          comment: 'AC jet cleaning and gas leak fix done swiftly before peak summer heat.',
          sellerReply: 'Thank you Ritu ji for your feedback!',
        },
      ];

      for (const rev of demoReviewTemplates) {
        if (rev.providerIndex < createdProviders.length) {
          const prov = createdProviders[rev.providerIndex];

          let reviewCustomer = await User.findOne({ name: rev.customerName });
          if (!reviewCustomer) {
            const phoneSuffix = (summary.demoReviewsInserted + 10).toString().padStart(2, '0');
            reviewCustomer = await User.create({
              name: rev.customerName,
              phone: `98000000${phoneSuffix}`,
              role: 'customer',
              phoneVerified: true,
            });
          }

          const existing = await Review.findOne({
            provider: prov._id,
            customer: reviewCustomer._id,
          });
          if (!existing) {
            await Review.create({
              provider: prov._id,
              customer: reviewCustomer._id,
              customerName: rev.customerName,
              rating: rev.rating,
              comment: rev.comment,
              sellerReply: rev.sellerReply || null,
              sellerRepliedAt: rev.sellerReply ? new Date() : null,
            });
            summary.demoReviewsInserted++;
          }
        }
      }

      // Dynamically synchronize provider ratings with actual reviews in DB
      for (const prov of createdProviders) {
        await reviewService.recalculateProviderRating(prov._id.toString());
      }
    }

    // 4e. Demo Leads
    if (createdProviders.length >= 2 && demoCustomer) {
      const p1 = createdProviders[0];
      const p2 = createdProviders[1];

      const existingLead1 = await Lead.findOne({ provider: p1._id, customer: demoCustomer._id, type: 'call' });
      if (!existingLead1) {
        await Lead.create({
          provider: p1._id,
          customer: demoCustomer._id,
          customerPhone: demoCustomer.phone || '9876543210',
          customerName: demoCustomer.name || 'Rahul Kumar',
          type: 'call',
          service: 'On-Road Breakdown Assistance',
          status: 'contacted',
        });
        summary.demoLeadsInserted++;
      }

      const existingLead2 = await Lead.findOne({ provider: p2._id, customer: demoCustomer._id, type: 'whatsapp' });
      if (!existingLead2) {
        await Lead.create({
          provider: p2._id,
          customer: demoCustomer._id,
          customerPhone: demoCustomer.phone || '9876543210',
          customerName: demoCustomer.name || 'Rahul Kumar',
          type: 'whatsapp',
          service: 'Inverter & Battery Setup',
          status: 'new',
        });
        summary.demoLeadsInserted++;
      }
    }
  }

  logger.info('Database seed complete!');
  return summary;
}

// Direct CLI execution
if (require.main === module) {
  const isDemo = process.argv.includes('--demo');
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arakart_dev';

  mongoose
    .connect(mongoUri)
    .then(async () => {
      logger.info(`Connected to MongoDB at ${mongoUri}`);
      const summary = await runSeed({ demo: isDemo });
      logger.info(`Seed completed successfully:\n${JSON.stringify(summary, null, 2)}`);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Failed to run database seed:', err);
      process.exit(1);
    });
}
