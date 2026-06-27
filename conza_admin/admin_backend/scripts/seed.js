require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Admin = require('../models/Admin')
const ServiceCategory = require('../models/ServiceCategory')
const Role = require('../models/Role')

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/conza_admin')
    console.log('Connected to MongoDB')

    // Seed Roles — permissions are the single source of truth for all admins with that role
    const roles = [
      {
        name: 'Super Admin',
        description: 'Full access to all features',
        permissions: ['all'],
        status: 'active',
        isSystem: true,
      },
      {
        name: 'Operations Manager',
        description: 'Manage users, workers, vendors, bookings, orders, services, maps',
        permissions: ['dashboard', 'customers', 'workers', 'vendors', 'bp', 'bookings', 'orders', 'maps', 'services'],
        status: 'active',
        isSystem: true,
      },
      {
        name: 'Finance Manager',
        description: 'Manage payments, wallets, revenue, payouts, pricing',
        permissions: ['dashboard', 'finance', 'payments', 'wallets', 'pricing', 'analytics'],
        status: 'active',
        isSystem: true,
      },
      {
        name: 'Support Manager',
        description: 'Manage tickets, complaints, reviews, notifications',
        permissions: ['dashboard', 'complaints', 'reviews', 'notifications'],
        status: 'active',
        isSystem: true,
      },
      {
        name: 'Content Manager',
        description: 'Manage banners, FAQ, content, promotions, materials, rentals',
        permissions: ['dashboard', 'content', 'promotions', 'materials', 'rentals', 'inventory'],
        status: 'active',
        isSystem: true,
      },
    ]

    for (const roleData of roles) {
      await Role.findOneAndUpdate({ name: roleData.name }, roleData, { upsert: true, new: true })
    }
    console.log('✓ Roles seeded')

    // Seed Super Admin
    const existingAdmin = await Admin.findOne({ email: 'admn@conza.in' })
    if (!existingAdmin) {
      await Admin.create({
        name: 'Nithin And Rifat',
        email: 'hegdenithinp@gmail.com',
        password: 'NithinP@123',
        role: 'super_admin',
        permissions: ['all'],
        status: 'active',
      })
      console.log('✓ Super Admin created: admin@conza.in / Admin@12345')
    } else {
      console.log('✓ Super Admin already exists')
    }

    // Seed Service Categories
    const categories = [
      { name: 'Plumber', baseCharge: 500, commission: 15, radius: 5, workers: 342, bookings: 1256, active: true },
      { name: 'Electrician', baseCharge: 600, commission: 15, radius: 5, workers: 298, bookings: 980, active: true },
      { name: 'Carpenter', baseCharge: 550, commission: 15, radius: 5, workers: 245, bookings: 820, active: true },
      { name: 'Mason', baseCharge: 700, commission: 15, radius: 5, workers: 198, bookings: 650, active: true },
      { name: 'Painter', baseCharge: 450, commission: 15, radius: 5, workers: 156, bookings: 480, active: true },
      { name: 'Builder', baseCharge: 800, commission: 15, radius: 5, workers: 87, bookings: 320, active: true },
      { name: 'AC Repair', baseCharge: 400, commission: 15, radius: 5, workers: 120, bookings: 450, active: true },
      { name: 'Appliance Repair', baseCharge: 350, commission: 15, radius: 5, workers: 95, bookings: 380, active: true },//
    ]

    for (const cat of categories) {
      await ServiceCategory.findOneAndUpdate({ name: cat.name }, cat, { upsert: true })
    }
    console.log('✓ Service categories seeded')

    console.log('\n✅ Seed complete!')
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seed()
