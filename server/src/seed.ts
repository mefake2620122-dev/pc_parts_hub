import bcrypt from 'bcryptjs';
import { db } from './db.js';

export function seedDatabase() {
  // 1. Check Admin
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    const initialUser = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const initialPass = process.env.INITIAL_ADMIN_PASSWORD || 'pcparthub@2026';
    const hash = bcrypt.hashSync(initialPass, 10);
    db.prepare('INSERT INTO admins (username, password_hash, name) VALUES (?, ?, ?)').run(
      initialUser,
      hash,
      'Store Administrator'
    );
    console.log(`Initial admin account created for: ${initialUser}`);
  }

  // 2. Check Settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
    const defaultSettings: Record<string, string> = {
      business_name: 'PC PART HUB',
      tagline: 'Pre-Owned Parts. Tested for Your Build.',
      sub_tagline: 'Find the hardware you need. Check the specs. Talk directly to PC Part Hub.',
      phone: '+91 91795 27017',
      whatsapp: '919179527017',
      address: 'Shop 14, Commercial Tech Zone, Nehru Place, New Delhi, India 110019',
      maps_url: 'https://maps.google.com/?q=Nehru+Place+New+Delhi',
      opening_hours: 'Mon – Sat: 11:00 AM – 8:30 PM (Sunday by Appointment)',
      about_text: 'PC PART HUB is a specialized showroom and digital inventory of tested, verified, and certified pre-owned computer hardware. Every GPU, processor, and motherboard undergoes rigorous benchmark testing before cataloguing.',
      currency: '₹',
      trust_card_1_title: 'TESTED HARDWARE',
      trust_card_1_desc: 'Stress-tested with FurMark, Cinebench & MemTest before inventory intake.',
      trust_card_2_title: 'REAL INVENTORY',
      trust_card_2_desc: 'Live stock tracking. What you see is available in our store right now.',
      trust_card_3_title: 'CLEAR CONDITION',
      trust_card_3_desc: 'Transparent physical and functional condition ratings with inspection photos.',
      trust_card_4_title: 'DIRECT WHATSAPP SUPPORT',
      trust_card_4_desc: 'Speak directly with our hardware technicians for build advice and orders.'
    };

    for (const [key, val] of Object.entries(defaultSettings)) {
      insertSetting.run(key, val);
    }
    console.log('Seeded site settings');
  }

  // 3. Check Categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insertCat = db.prepare(
      'INSERT INTO categories (name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const initialCategories = [
      { name: 'GPU / Graphics Cards', slug: 'gpu', icon: 'CircuitBoard', description: 'NVIDIA RTX, GTX & AMD Radeon cards tested under full thermal load', sort_order: 1 },
      { name: 'CPU / Processors', slug: 'cpu', icon: 'Cpu', description: 'Intel Core & AMD Ryzen multi-core desktop processors', sort_order: 2 },
      { name: 'Motherboards', slug: 'motherboard', icon: 'Grid', description: 'ATX, Micro-ATX & Mini-ITX boards with bent-pin and VRM check', sort_order: 3 },
      { name: 'RAM / Memory', slug: 'ram', icon: 'Layers', description: 'DDR4 & DDR5 high-frequency memory kits tested for zero errors', sort_order: 4 },
      { name: 'Storage (SSD & HDD)', slug: 'storage', icon: 'HardDrive', description: 'NVMe Gen4, Gen3 SSDs and mechanical drives with 100% SMART health', sort_order: 5 },
      { name: 'Power Supplies (PSU)', slug: 'psu', icon: 'Zap', description: '80+ Bronze, Gold & Platinum modular and non-modular units', sort_order: 6 },
      { name: 'Cabinets & Cases', slug: 'cabinet', icon: 'Box', description: 'Tempered glass airflow cases cleaned and inspected', sort_order: 7 },
      { name: 'Cooling & AIOs', slug: 'cooling', icon: 'Fan', description: '240mm/360mm Liquid coolers and dual-tower air coolers', sort_order: 8 },
      { name: 'Monitors', slug: 'monitor', icon: 'Monitor', description: 'High-refresh rate gaming and color-accurate IPS panels', sort_order: 9 },
      { name: 'Accessories & Peripherals', slug: 'accessories', icon: 'Headphones', description: 'Mechanical keyboards, mice, and internal PC accessories', sort_order: 10 }
    ];

    for (const cat of initialCategories) {
      insertCat.run(cat.name, cat.slug, cat.icon, cat.description, cat.sort_order);
    }
    console.log('Seeded categories');
  }

  // 4. Check Products
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    const cats = db.prepare('SELECT id, slug FROM categories').all() as { id: number; slug: string }[];
    const catMap: Record<string, number> = {};
    cats.forEach(c => { catMap[c.slug] = c.id; });

    const insertProduct = db.prepare(`
      INSERT INTO products (
        product_code, name, slug, category_id, brand, model, price, condition,
        stock_status, quantity, description, specifications, is_featured, is_new_arrival
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertImage = db.prepare(`
      INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    const seedProducts = [
      {
        code: 'GPU-001',
        name: 'ZOTAC Gaming GeForce RTX 3060 Twin Edge 12GB',
        slug: 'zotac-rtx-3060-twin-edge-12gb',
        category: 'gpu',
        brand: 'ZOTAC',
        model: 'RTX 3060 Twin Edge',
        price: 18500,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 3,
        desc: 'Tested thoroughly under 45-minute FurMark stress test. Temps peak at 67°C. Cleaned, no rust, repasted with Noctua NT-H1 thermal compound. Includes original box.',
        specs: JSON.stringify({
          'VRAM': '12GB GDDR6',
          'Interface': 'PCIe 4.0 x16',
          'Outputs': '3x DisplayPort 1.4a, 1x HDMI 2.1',
          'Power Connectors': '1x 8-Pin',
          'Recommended PSU': '550W',
          'Length': '224mm'
        }),
        featured: 1,
        new_arrival: 1,
        images: [
          'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'GPU-002',
        name: 'ASUS ROG Strix GeForce RTX 3070 OC 8GB',
        slug: 'asus-rog-strix-rtx-3070-oc-8gb',
        category: 'gpu',
        brand: 'ASUS ROG',
        model: 'RTX 3070 OC Edition',
        price: 26999,
        condition: 'Excellent',
        stock: 'IN_STOCK',
        qty: 2,
        desc: 'Massive triple-fan cooling system. ARGB lighting fully functional. Pristine backplate condition, zero coil whine under load. Tested with Time Spy & Cyberpunk 2077.',
        specs: JSON.stringify({
          'VRAM': '8GB GDDR6',
          'Interface': 'PCIe 4.0 x16',
          'Outputs': '2x HDMI 2.1, 3x DisplayPort 1.4a',
          'Power Connectors': '2x 8-Pin',
          'Recommended PSU': '650W',
          'Length': '318mm'
        }),
        featured: 1,
        new_arrival: 0,
        images: [
          'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'GPU-003',
        name: 'Sapphire Pulse AMD Radeon RX 6700 XT 12GB',
        slug: 'sapphire-pulse-rx-6700-xt-12gb',
        category: 'gpu',
        brand: 'Sapphire',
        model: 'Pulse RX 6700 XT',
        price: 21500,
        condition: 'Like New',
        stock: 'LOW_STOCK',
        qty: 1,
        desc: 'Outstanding 1440p gaming card with 12GB VRAM. Dual ball bearing fans running whisper quiet. Comes with original packaging and documentation.',
        specs: JSON.stringify({
          'VRAM': '12GB GDDR6',
          'Memory Bus': '192-bit',
          'Power Connectors': '1x 8-Pin + 1x 6-Pin',
          'Recommended PSU': '650W',
          'Length': '260mm'
        }),
        featured: 1,
        new_arrival: 1,
        images: [
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'CPU-001',
        name: 'AMD Ryzen 5 5600X Desktop Processor',
        slug: 'amd-ryzen-5-5600x',
        category: 'cpu',
        brand: 'AMD',
        model: 'Ryzen 5 5600X',
        price: 9800,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 4,
        desc: 'Clean pins, 100% straight, zero damage. Prime95 tested for 1 hour with zero throttling. Excellent budget 6-core gaming king on AM4 platform.',
        specs: JSON.stringify({
          'Socket': 'AM4',
          'Cores / Threads': '6 Cores / 12 Threads',
          'Base Clock': '3.7 GHz',
          'Boost Clock': '4.6 GHz',
          'TDP': '65W',
          'Architecture': 'Zen 3 (7nm)'
        }),
        featured: 1,
        new_arrival: 0,
        images: [
          'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'CPU-002',
        name: 'Intel Core i5-12400F 12th Gen Alder Lake',
        slug: 'intel-core-i5-12400f',
        category: 'cpu',
        brand: 'Intel',
        model: 'i5-12400F',
        price: 8900,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 5,
        desc: 'LGA1700 processor in mint state. Flat IHS with no warping. Paired with Wraith stealth / stock cooler upon request.',
        specs: JSON.stringify({
          'Socket': 'LGA1700',
          'Cores / Threads': '6 Cores (6P+0E) / 12 Threads',
          'Base Clock': '2.5 GHz',
          'Boost Clock': '4.4 GHz',
          'TDP': '65W Base (117W Turbo)',
          'PCIe Support': 'PCIe 5.0 & 4.0'
        }),
        featured: 0,
        new_arrival: 1,
        images: [
          'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'CPU-003',
        name: 'AMD Ryzen 7 5800X3D with 3D V-Cache',
        slug: 'amd-ryzen-7-5800x3d',
        category: 'cpu',
        brand: 'AMD',
        model: 'Ryzen 7 5800X3D',
        price: 22000,
        condition: 'Excellent',
        stock: 'SOLD_OUT',
        qty: 0,
        desc: 'The legendary ultimate gaming upgrade for AM4 systems. 96MB of L3 3D V-Cache delivers insane frame rates in simulation and esports titles.',
        specs: JSON.stringify({
          'Socket': 'AM4',
          'Cores / Threads': '8 Cores / 16 Threads',
          'L3 Cache': '96MB 3D V-Cache',
          'Boost Clock': '4.5 GHz',
          'TDP': '105W'
        }),
        featured: 1,
        new_arrival: 0,
        images: [
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'MB-001',
        name: 'MSI MAG B550 TOMAHAWK Gaming Motherboard',
        slug: 'msi-mag-b550-tomahawk',
        category: 'motherboard',
        brand: 'MSI',
        model: 'MAG B550 TOMAHAWK',
        price: 9500,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 2,
        desc: 'All slots, PCIe lanes, USB ports, and dual Realtek 2.5G LAN tested. Updated to latest BIOS supporting Ryzen 5000 series out of the box. Includes I/O shield and SATA cables.',
        specs: JSON.stringify({
          'Socket': 'AM4',
          'Chipset': 'AMD B550',
          'Form Factor': 'ATX',
          'RAM Slots': '4x DDR4 (up to 128GB)',
          'M.2 Slots': '2x M.2 (1x PCIe 4.0 with Shield Frozr)',
          'Power Design': '10+2+1 Duet Rail VRM'
        }),
        featured: 1,
        new_arrival: 0,
        images: [
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'RAM-001',
        name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz',
        slug: 'corsair-vengeance-lpx-32gb-ddr4-3200',
        category: 'ram',
        brand: 'Corsair',
        model: 'Vengeance LPX Black',
        price: 4800,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 6,
        desc: 'Low-profile pure aluminum heat spreader. 100% passed 4 passes of MemTest86 with zero errors. XMP 2.0 profile boots flawlessly at 3200MHz CL16.',
        specs: JSON.stringify({
          'Capacity': '32GB (2 x 16GB)',
          'Type': 'DDR4',
          'Speed': '3200MHz',
          'Timing': 'CL16-20-20-38',
          'Voltage': '1.35V'
        }),
        featured: 0,
        new_arrival: 1,
        images: [
          'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'RAM-002',
        name: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz CL30',
        slug: 'gskill-trident-z5-rgb-32gb-ddr5-6000',
        category: 'ram',
        brand: 'G.Skill',
        model: 'Trident Z5 RGB',
        price: 9200,
        condition: 'Like New',
        stock: 'LOW_STOCK',
        qty: 1,
        desc: 'Top-tier sweet-spot kit for Ryzen 7000 / Intel 13th-14th Gen. Pristine matte black aluminum heatsink with fluid RGB diffuser. AMD EXPO and Intel XMP certified.',
        specs: JSON.stringify({
          'Capacity': '32GB (2 x 16GB)',
          'Type': 'DDR5',
          'Speed': '6000MHz',
          'Timing': 'CL30-38-38-96',
          'RGB': 'Yes (Addressable RGB)'
        }),
        featured: 1,
        new_arrival: 1,
        images: [
          'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'SSD-001',
        name: 'Samsung 980 PRO 1TB PCIe 4.0 NVMe M.2 SSD',
        slug: 'samsung-980-pro-1tb-nvme',
        category: 'storage',
        brand: 'Samsung',
        model: '980 PRO',
        price: 5900,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 3,
        desc: 'Verified 99% SMART Health on Samsung Magician. Total Bytes Written (TBW) under 8TB of 600TB rated endurance. Speeds tested: 7,000 MB/s Read / 5,000 MB/s Write.',
        specs: JSON.stringify({
          'Capacity': '1TB',
          'Interface': 'PCIe Gen 4.0 x4, NVMe 1.3c',
          'Form Factor': 'M.2 (2280)',
          'Sequential Read': 'Up to 7,000 MB/s',
          'Sequential Write': 'Up to 5,000 MB/s',
          'Health': '99% SMART Health'
        }),
        featured: 1,
        new_arrival: 0,
        images: [
          'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'PSU-001',
        name: 'Corsair RM750x 750W 80+ Gold Fully Modular PSU',
        slug: 'corsair-rm750x-750w-gold-modular',
        category: 'psu',
        brand: 'Corsair',
        model: 'RM750x',
        price: 6200,
        condition: 'Excellent',
        stock: 'IN_STOCK',
        qty: 2,
        desc: 'Tier-A legendary power supply with 105°C Japanese capacitors. Zero RPM fan mode for silent idle. Complete with all original modular cables in Corsair pouch.',
        specs: JSON.stringify({
          'Wattage': '750W',
          'Efficiency': '80 PLUS Gold Certified',
          'Modularity': 'Full Modular',
          'Fan Size': '135mm Magnetic Levitation Fan',
          'Cables Included': '24-pin ATX, 2x EPS 8-pin, 4x PCIe 8-pin, 9x SATA'
        }),
        featured: 1,
        new_arrival: 0,
        images: [
          'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'CASE-001',
        name: 'Lian Li LANCOOL 216 RGB Mid-Tower Cabinet',
        slug: 'lian-li-lancool-216-rgb',
        category: 'cabinet',
        brand: 'Lian Li',
        model: 'LANCOOL 216 RGB Black',
        price: 5200,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 1,
        desc: 'Dual 160mm front ARGB fans deliver unmatched GPU & CPU thermals. Zero scratches on tempered glass. Includes fan hub and all bracket accessories.',
        specs: JSON.stringify({
          'Form Factor': 'Mid Tower (E-ATX / ATX / M-ATX)',
          'Included Fans': '2x 160mm ARGB Front, 1x 140mm PWM Rear',
          'GPU Clearance': 'Up to 392mm',
          'Radiator Support': 'Up to 360mm top/front',
          'Side Panel': '4.0mm Tempered Glass'
        }),
        featured: 0,
        new_arrival: 1,
        images: [
          'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=1000&q=80'
        ]
      },
      {
        code: 'COOL-001',
        name: 'DeepCool AK620 High-Performance Dual-Tower Cooler',
        slug: 'deepcool-ak620-dual-tower',
        category: 'cooling',
        brand: 'DeepCool',
        model: 'AK620 Zero Dark',
        price: 3600,
        condition: 'Like New',
        stock: 'IN_STOCK',
        qty: 3,
        desc: 'Six copper heat pipes with dense matrix dual fin arrays. Capable of cooling up to 260W TDP CPUs. Includes both LGA1700 and AM4/AM5 mounting hardware.',
        specs: JSON.stringify({
          'Type': 'Dual-Tower Air Cooler',
          'TDP Rating': '260W',
          'Heatpipes': '6x Ø6 mm Copper',
          'Fans': '2x 120mm Fluid Dynamic Bearing PWM',
          'Compatibility': 'Intel LGA1700/1200/115x, AMD AM5/AM4'
        }),
        featured: 0,
        new_arrival: 0,
        images: [
          'https://images.unsplash.com/photo-1587202372162-2d0a9a1c7c3a?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    ];

    for (const p of seedProducts) {
      const catId = catMap[p.category] || 1;
      const res = insertProduct.run(
        p.code, p.name, p.slug, catId, p.brand, p.model, p.price, p.condition,
        p.stock, p.qty, p.desc, p.specs, p.featured, p.new_arrival
      );
      const prodId = res.lastInsertRowid;
      p.images.forEach((imgUrl, idx) => {
        insertImage.run(prodId, imgUrl, idx === 0 ? 1 : 0, idx);
      });
    }
    console.log(`Seeded ${seedProducts.length} authentic PC components`);
  }

  // 5. Check Combos
  const comboCount = db.prepare('SELECT COUNT(*) as count FROM combos').get() as { count: number };
  if (comboCount.count === 0) {
    const insertCombo = db.prepare(`
      INSERT INTO combos (title, slug, description, price, image, stock_status, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertComboItem = db.prepare(`
      INSERT INTO combo_items (combo_id, product_id, custom_label)
      VALUES (?, ?, ?)
    `);

    const combosData = [
      {
        title: 'Esports 1080p Ultra Gaming Combo',
        slug: 'esports-1080p-gaming-combo',
        desc: 'Ryzen 5 5600X + B550 Tomahawk + 32GB DDR4 3200MHz RAM. Perfect base to drop in any RTX 3060/4060 GPU for 144Hz+ competitive gaming.',
        price: 22999,
        image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1000&q=80',
        stock: 'IN_STOCK',
        featured: 1,
        items: ['AMD Ryzen 5 5600X Processor', 'MSI MAG B550 TOMAHAWK Motherboard', 'Corsair 32GB (2x16GB) DDR4 3200MHz RAM']
      },
      {
        title: 'Next-Gen 1440p Content & Gaming Core',
        slug: 'nextgen-1440p-gaming-combo',
        desc: 'Intel Core i5-12400F + RTX 3070 8GB OC + 750W 80+ Gold Corsair PSU. Plug & play 1440p High/Ultra setup tested together under synchronous load.',
        price: 40500,
        image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80',
        stock: 'IN_STOCK',
        featured: 1,
        items: ['Intel Core i5-12400F 6-Core CPU', 'ASUS ROG Strix RTX 3070 OC 8GB', 'Corsair RM750x 750W 80+ Gold PSU']
      }
    ];

    for (const c of combosData) {
      const res = insertCombo.run(c.title, c.slug, c.desc, c.price, c.image, c.stock, c.featured);
      const comboId = res.lastInsertRowid;
      for (const item of c.items) {
        insertComboItem.run(comboId, null, item);
      }
    }
    console.log('Seeded curated combos');
  }
}
