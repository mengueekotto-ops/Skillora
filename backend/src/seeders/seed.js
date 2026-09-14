require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/database");
const { User, Professional, Category, Service, ServiceRequest, Review, Notification } = require("../models");

const seedDatabase = async () => {
  try {
    console.log("🌱 Seeding Skillora with 60+ Professions & Cameroon Localization...");
    await connectDB();
    await User.init();

    // 60+ PROFESSIONS CATALOG ACROSS 10 TRADE SECTORS
    const categoriesData = [
      // Sector 1: Electrical & Power Technical Services (1 - 6)
      {
        name: "Electrical Wiring & Fault Finding",
        description: "Breaker panels, electrical fault finding, short circuit troubleshooting & grounding.",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Generator Connection & Repair",
        description: "Heavy-duty generator installation, transfer switch wiring & fuel system maintenance.",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Solar Power Systems",
        description: "Solar panel mounting, inverter setup, solar battery storage & off-grid systems.",
        image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Air Conditioning & Refrigeration",
        description: "HVAC mini-split installation, gas refilling, compressor repair & maintenance.",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Spot Lighting & Chandelier Fitting",
        description: "Decorative LED spot lighting, ceiling chandeliers, outdoor floodlights.",
        image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Electrical Safety Grounding",
        description: "Earthing rod installation, surge protection, high voltage safety compliance.",
        image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 2: Plumbing, Water & Anti-Damp (7 - 12)
      {
        name: "Water Heater Installation",
        description: "Electric & solar water heater fitting, pressure regulation valves & thermostat setup.",
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Pipe Leak Repair & Unclogging",
        description: "Emergency pipe leak patching, high-pressure main drain unclogging & P-trap repair.",
        image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Anti-Damp & Anti-Mold Treatment",
        description: "Damp proofing walls, mold remediation, moisture barrier sealants for buildings.",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Borehole & Pump Mechanics",
        description: "Submersible water pump installation, water tank plumbing & filtration systems.",
        image: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Bathroom & Sanitary Fitting",
        description: "Modern toilet installation, shower cubicles, wash basins & tap mixers.",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Septic Tank & Sewer Maintenance",
        description: "Septic tank emptying, biological treatment, sewer line drainage flushing.",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 3: Building, Masonry & Finishes (13 - 20)
      {
        name: "Building Painting & Finishing",
        description: "Interior & exterior wall painting, decorative wall texturing, waterproofing paint.",
        image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Masonry & Bricklaying",
        description: "Foundation laying, concrete block brickwork, structural wall masonry.",
        image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Tile Fitting & Marble Flooring",
        description: "Ceramic tile installation, porcelain flooring, marble cutting & tile grouting.",
        image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Carpentry & Custom Furniture",
        description: "Custom wooden cabinets, door installation, roof truss woodwork & wardrobes.",
        image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Roofing & Ceiling Gypsum",
        description: "Aluminium roofing sheet installation, POP gypsum ceilings, roof leak repair.",
        image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Welding & Metal Fabrication",
        description: "Wrought iron gates, security window grills, metal balustrades & steel frame welding.",
        image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Glass & Aluminium Works",
        description: "Aluminium sliding windows, glass shopfronts, mirrors & balcony glass railings.",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Plastering & POP Screeding",
        description: "Smooth cement plastering, interior wall screeding, decorative moldings.",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 4: Financial, Legal & Accounting (21 - 27)
      {
        name: "Accountant",
        description: "Corporate financial management, general ledger accounting, financial strategy.",
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Bookkeeping & Invoicing",
        description: "Day-to-day transaction recording, accounts payable/receivable, invoice generation.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Tax Filing & Advisory",
        description: "Corporate & personal income tax filing, tax compliance auditing, VAT returns.",
        image: "https://images.unsplash.com/photo-1586486855514-8c633cc6fd38?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Payroll Processing",
        description: "Employee salary calculations, CNPS social security deductions, payslip generation.",
        image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Financial Statements Auditing",
        description: "Annual balance sheets, profit & loss auditing, bank reconciliation reports.",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Business Registration & Legal",
        description: "OHADA business creation, SARL incorporation, legal contract drafting & filing.",
        image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Administrative & Documentation",
        description: "Official document legalization, official typing, administrative dossier assistance.",
        image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 5: Marketing, Advertising & Media (28 - 34)
      {
        name: "Ads Specialist",
        description: "Meta Facebook/Instagram ad campaigns, Google Search Ads, lead generation.",
        image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Social Media Manager",
        description: "Brand content creation, audience engagement, social page growth management.",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Graphic Design & Posters",
        description: "Flyers, event posters, billboards, business cards & brand logo design.",
        image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Video Editing & Animation",
        description: "Promotional video editing, YouTube content, 2D motion graphics & TikTok reels.",
        image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Commercial Photography",
        description: "Product photography, corporate headshots, event photos & studio shoots.",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Copywriting & Translation",
        description: "Bilingual English/French document translation, website copywriting, proofreading.",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "SEO & Digital Strategy",
        description: "Search engine optimization, Google Maps local business ranking, website audit.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 6: Entertainment, Acting & Performing Arts (35 - 40)
      {
        name: "Actor / Actress",
        description: "Film casting, TV commercials, theatrical drama performance & voiceover acting.",
        image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Event MC & Host",
        description: "Bilingual wedding host, corporate gala master of ceremonies, event host.",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "DJ & Sound Operator",
        description: "Wedding & party DJing, live sound mixing, PA system audio setup.",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Live Band Musician",
        description: "Guitarist, keyboardist, saxophonist, live vocal performance for events.",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Choreographer & Dancer",
        description: "Music video choreography, wedding dance lessons, troupe performances.",
        image: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Stage & Lighting Designer",
        description: "Concert stage lighting, LED screen setup, atmospheric haze & fog effects.",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 7: Personal Services, Beauty & Fashion (41 - 47)
      {
        name: "Hairdressing & Braiding",
        description: "African hair braiding, wig installation, hair dreadlocks & styling.",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Barbering & Grooming",
        description: "Men's haircut, beard trimming, hair dyeing & hot towel facial shave.",
        image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Makeup Artist",
        description: "Bridal makeup, special occasion glam, photoshoot & editorial makeup.",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Fashion Design & Tailoring",
        description: "African print tailoring, custom suit fitting, dressmaking & alterations.",
        image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Nail Care Tech",
        description: "Acrylic nails, gel polish manicure, pedicure & nail art design.",
        image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Spa & Massage Therapy",
        description: "Deep tissue massage, relaxation Swedish massage, facial treatment.",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Personal Shopper & Stylist",
        description: "Wardrobe styling, clothing sourcing, personal image consulting.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 8: Logistics, Transport & Home Repair (48 - 54)
      {
        name: "Auto Mechanic",
        description: "Engine repair, computer scanner diagnostic, brake overhaul, oil change.",
        image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Motorcycle Express Courier",
        description: "Fast local document & package delivery within Douala and Yaoundé.",
        image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Home Relocation & Moving",
        description: "Furniture packing, apartment loading/unloading, truck transport moving.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "CCTV & Security Installer",
        description: "Security camera installation, IP video surveillance, electric fence wiring.",
        image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Phone & Tablet Repair",
        description: "Screen replacement, battery replacement, water damage repair, unlocking.",
        image: "https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Laptop & PC Maintenance",
        description: "Hard drive SSD upgrade, RAM upgrade, motherboard repair, OS reinstall.",
        image: "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Home Cleaning & Maid",
        description: "Deep house cleaning, post-construction cleanup, laundry & ironing.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 9: Education, Tutoring & Training (55 - 58)
      {
        name: "Private Math & Science Tutor",
        description: "One-on-one home tutoring for secondary school, GCE O/A Level & BAC prep.",
        image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Bilingual Language Teacher",
        description: "French & English language instruction, TOEFL/IELTS exam preparation.",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Coding & Computer Instructor",
        description: "Python, web development & basic computer literacy private coaching.",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Driving Instructor",
        description: "Manual & automatic car driving lessons, highway code exam preparation.",
        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80",
      },

      // Sector 10: Events, Health & Agriculture (59 - 64)
      {
        name: "Catering Chef & Baker",
        description: "Event catering, traditional Cameroon cuisine, custom birthday & wedding cakes.",
        image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Event Decorator & Florist",
        description: "Wedding hall decoration, floral arch setup, theme party styling.",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Personal Fitness Trainer",
        description: "Home fitness coaching, weight loss programs, bodybuilding, aerobics.",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Agricultural & Poultry Advisor",
        description: "Poultry farm management, crop protection, greenhouse vegetable farming.",
        image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Pest Control & Fumigation",
        description: "Termite eradication, cockroach & rat extermination, anti-mosquito spraying.",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Landscape Gardening & Lawn",
        description: "Lawn mowing, garden trimming, ornamental flower planting & maintenance.",
        image: "https://images.unsplash.com/photo-1558904541-efa8c196b27d?auto=format&fit=crop&w=800&q=80",
      },
    ];

    let categories = await Category.find();
    if (categories.length === 0) {
      categories = await Category.insertMany(categoriesData);
      console.log(`✅ Seeded ${categories.length} detailed profession categories!`);
    } else {
      console.log(`ℹ️ Categories already exist (${categories.length} found).`);
    }

    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 2. Seed Admin User
    const existingAdmin = await User.findOne({ email: "admin@skillora.com" });
    if (!existingAdmin) {
      await User.create({
        firstName: "System",
        lastName: "Administrator",
        email: "admin@skillora.com",
        phone: "+237600000000",
        password: hashedPassword,
        role: "ADMIN",
        location: "Yaoundé, Centre",
      });
    }

    // 3. Seed Customer User
    let customerUser = await User.findOne({ email: "customer@skillora.cm" });
    if (!customerUser) {
      customerUser = await User.create({
        firstName: "Alice",
        lastName: "Smith",
        email: "customer@skillora.cm",
        phone: "+237699887766",
        password: hashedPassword,
        role: "CUSTOMER",
        location: "Biyem-Assi, Yaoundé",
      });
    }

    // 4. Seed Representative Professionals across Cameroon Neighborhoods (Yaoundé, Douala, Bepanda)
    const profs = [
      {
        firstName: "Jean-Paul",
        lastName: "Mbarga",
        email: "john.electrician@skillora.cm",
        phone: "+237677112233",
        role: "PROFESSIONAL",
        location: "Bepanda, Douala",
        profileImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        profession: "Electrical Wiring & Fault Finding",
        bio: "Master electrician with 8+ years experience servicing panels, generator switches, and grounding in Douala.",
        experience: 8,
        skills: ["Generator connection", "Breaker box panels", "Fault finding", "Grounding", "Spot lighting"],
        education: "BTS Génie Électrique",
        verificationStatus: "verified",
        verifiedBadge: true,
        verificationScore: 94.5,
        rating: 4.9,
        completedMissions: 18,
        catIndex: 0,
        serviceTitle: "Generator Connection & Breaker Panel Wiring",
        servicePrice: 25000,
      },
      {
        firstName: "Samuel",
        lastName: "Eto",
        email: "robert.plumber@skillora.cm",
        phone: "+237699445566",
        role: "PROFESSIONAL",
        location: "Biyem-Assi, Yaoundé",
        profileImage: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
        profession: "Water Heater Installation",
        bio: "Plumbing specialist in water heater installation, leak patching & anti-damp wall treatment.",
        experience: 6,
        skills: ["Water heater installation", "Anti-damp treatment", "Anti-mold", "Drain unclogging"],
        education: "CAP Plomberie Sanitaire",
        verificationStatus: "verified",
        verifiedBadge: true,
        verificationScore: 88.0,
        rating: 4.8,
        completedMissions: 14,
        catIndex: 6,
        serviceTitle: "Water Heater Fitting & Leak Diagnostics",
        servicePrice: 20000,
      },
      {
        firstName: "Marie-Louise",
        lastName: "Nguene",
        email: "marie.accountant@skillora.cm",
        phone: "+237677889900",
        role: "PROFESSIONAL",
        location: "Akwa, Douala",
        profileImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
        profession: "Accountant",
        bio: "OHADA certified accountant providing bookkeeping, tax filing, CNPS payroll processing & invoicing.",
        experience: 9,
        skills: ["Bookkeeping", "Tax filing", "Payroll", "Invoicing", "OHADA Auditing"],
        education: "Master Finance & Comptabilité",
        verificationStatus: "verified",
        verifiedBadge: true,
        verificationScore: 99.0,
        rating: 5.0,
        completedMissions: 32,
        catIndex: 20,
        serviceTitle: "Monthly Corporate Bookkeeping & Tax Filing Package",
        servicePrice: 75000,
      },
      {
        firstName: "Christian",
        lastName: "Kamga",
        email: "ads.specialist@skillora.cm",
        phone: "+237655112233",
        role: "PROFESSIONAL",
        location: "Bastos, Yaoundé",
        profileImage: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=800&q=80",
        profession: "Ads Specialist",
        bio: "Digital media buyer running high ROI Facebook, Instagram & WhatsApp ad campaigns for local brands.",
        experience: 5,
        skills: ["Meta Ads", "WhatsApp Marketing", "Lead Generation", "Graphic Design"],
        education: "B.Sc. Digital Marketing",
        verificationStatus: "verified",
        verifiedBadge: true,
        verificationScore: 91.0,
        rating: 4.9,
        completedMissions: 20,
        catIndex: 27,
        serviceTitle: "Social Media & Meta Ads Campaign Setup",
        servicePrice: 35000,
      },
      {
        firstName: "Sandrine",
        lastName: "Fotso",
        email: "actress@skillora.cm",
        phone: "+237699001122",
        role: "PROFESSIONAL",
        location: "Bonapriso, Douala",
        profileImage: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
        profession: "Actor / Actress",
        bio: "Bilingual actress and voiceover artist available for commercials, film, corporate hosting & events.",
        experience: 6,
        skills: ["Acting", "Commercial Voiceover", "Event Hosting", "Bilingual EN/FR"],
        education: "Performing Arts Diploma",
        verificationStatus: "unverified",
        verifiedBadge: false,
        verificationScore: 89.0,
        rating: 4.8,
        completedMissions: 16,
        catIndex: 34,
        serviceTitle: "Commercial Acting & Voiceover Recording",
        servicePrice: 50000,
      },
    ];

    for (const p of profs) {
      let user = await User.findOne({ email: p.email });
      if (!user) {
        user = await User.create({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          password: hashedPassword,
          role: p.role,
          location: p.location,
          profileImage: p.profileImage,
        });
      }

      let profProfile = await Professional.findOne({ userId: user._id });
      if (!profProfile) {
        profProfile = await Professional.create({
          userId: user._id,
          profession: p.profession,
          bio: p.bio,
          experience: p.experience,
          skills: p.skills,
          education: p.education,
          verificationStatus: p.verificationStatus,
          verifiedBadge: p.verifiedBadge,
          verificationScore: p.verificationScore,
          rating: p.rating,
          completedMissions: p.completedMissions,
        });
      }

      const categoryDoc = categories[p.catIndex] || categories[0];
      const existingService = await Service.findOne({ professionalId: profProfile._id, title: p.serviceTitle });
      if (!existingService) {
        await Service.create({
          professionalId: profProfile._id,
          categoryId: categoryDoc._id,
          title: p.serviceTitle,
          description: `Professional service package by ${p.firstName} ${p.lastName}.`,
          price: p.servicePrice,
          location: p.location,
          status: "ACTIVE",
        });
      }

      const existingReview = await Review.findOne({ professionalId: profProfile._id, customerId: customerUser._id });
      if (!existingReview) {
        await Review.create({
          customerId: customerUser._id,
          professionalId: profProfile._id,
          rating: p.rating,
          comment: `Excellent service in ${p.location}! Highly recommended.`,
          qualityRating: 5.0,
          professionalismRating: 5.0,
          communicationRating: 4.8,
          punctualityRating: 5.0,
          reliabilityRating: 5.0,
        });
      }
    }

    console.log("🎉 Seeding complete! 64 Professions, Cameroon localizations & bilingual support ready.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
