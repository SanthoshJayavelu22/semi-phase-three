import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import logger from './logger';
import { User } from '../models/userModel';
import { Institute } from '../models/instituteModel';
import { Course } from '../models/courseModel';
import { Batch } from '../models/batchModel';
import { Student } from '../models/studentModel';
import { ExamApplication } from '../models/examApplicationModel';
import { HallTicket } from '../models/hallTicketModel';
import { Result } from '../models/resultModel';
import { Marksheet } from '../models/marksheetModel';
import { RevaluationRequest } from '../models/revaluationRequestModel';
import { Remittance } from '../models/remittanceModel';
import { FeeRecord } from '../models/feeRecordModel';

dotenv.config();

const DUMMY_DOC = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const DUMMY_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

/**
 * Seed Super Admin and All Dummy Data for Academy and Institute portals
 */
export const seedAllData = async (options: { force?: boolean } = {}) => {
  try {
    const startMsg = '🌱 Starting comprehensive database seed for Academy and Institute portals (force=' + (options.force ?? false) + ')...';
    console.log(startMsg);
    logger.info(startMsg);

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Institute123!', salt);
    const superAdminHash = await bcrypt.hash('SuperAdmin123!', salt);
    const boardHash = await bcrypt.hash('BoardPass123!', salt);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. USERS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Users...');
    const usersMap: Record<string, any> = {};

    const usersToSeed = [
      {
        email: 'superadmin@academy.com',
        name: 'Academy Super Admin',
        password: superAdminHash,
        role: 'super_admin',
        isEmailVerified: true,
      },
      {
        email: 'board@academy.com',
        name: 'Academic Board Controller',
        password: boardHash,
        role: 'board',
        isEmailVerified: true,
      },
      {
        email: 'institute@apollo.com',
        name: 'Apollo Hospitals Institute of EM',
        password: defaultPasswordHash,
        role: 'institute',
        isEmailVerified: true,
      },
      {
        email: 'institute@fortis.com',
        name: 'Fortis Memorial Emergency Care Institute',
        password: defaultPasswordHash,
        role: 'institute',
        isEmailVerified: true,
      },
      {
        email: 'pending@manipal.com',
        name: 'Manipal Emergency Academy',
        password: defaultPasswordHash,
        role: 'institute',
        isEmailVerified: true,
      },
      {
        email: 'rejected@cityhealth.com',
        name: 'City Health Emergency Training Centre',
        password: defaultPasswordHash,
        role: 'institute',
        isEmailVerified: true,
      },
    ];

    for (const u of usersToSeed) {
      let userDoc = await User.findOne({ email: u.email });
      if (!userDoc || options.force) {
        if (userDoc && options.force) {
          userDoc.password = u.password;
          userDoc.role = u.role;
          userDoc.isEmailVerified = true;
          userDoc.name = u.name;
          await userDoc.save();
        } else {
          userDoc = await User.create(u);
        }
      }
      usersMap[u.email] = userDoc;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. INSTITUTES
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Institutes...');
    const institutesMap: Record<string, any> = {};

    const institutesToSeed = [
      {
        key: 'apollo',
        user: usersMap['institute@apollo.com']._id,
        orgName: 'Apollo Hospitals Institute of Emergency Medicine',
        constitutionType: 'Trust',
        instituteAddress: '21 Greams Lane, Thousand Lights, Chennai, Tamil Nadu - 600006',
        registeredOfficeAddress: '19 Bishop Gardens, Raja Annamalaipuram, Chennai - 600028',
        phoneNumber: '044-28290200',
        emailAddress: 'institute@apollo.com',
        commencementDate: new Date('2024-01-01'),
        seatsRequested: 10,
        approvedSeats: 10,
        headName: 'Dr. K. Prathap Reddy',
        headDesignation: 'Executive Medical Director',
        hodName: 'Dr. Suresh Venkat',
        bedCount: 120,
        physicianAvailability: 'Yes',
        physicianExperience: 18,
        courseDirectorEMQualified: 'Yes',
        emFacultyCount: 8,
        teachingSpace: 'Yes',
        nabhStatus: 'Yes',
        facultyCommitmentLetterUrl: DUMMY_PDF,
        documents: {
          equipmentListUrl: DUMMY_PDF,
          facultyListUrl: DUMMY_PDF,
          emergencyOPDStatisticsUrl: DUMMY_PDF,
          libraryBookListUrl: DUMMY_PDF,
          trainingMannequinListUrl: DUMMY_PDF,
          diagnosticEquipmentListUrl: DUMMY_PDF,
          declarationLetterUrl: DUMMY_PDF,
          inspectionPaymentReceiptUrl: DUMMY_PDF,
        },
        status: 'Approved',
        paymentStatus: 'Completed',
        inspectionTriggered: true,
      },
      {
        key: 'fortis',
        user: usersMap['institute@fortis.com']._id,
        orgName: 'Fortis Memorial Emergency Care Institute',
        constitutionType: 'Society / Trust',
        instituteAddress: 'Sector 44, Opposite HUDA City Centre, Gurugram, Haryana - 122002',
        registeredOfficeAddress: 'Escorts Heart Institute, Okhla Road, New Delhi - 110025',
        phoneNumber: '0124-4962200',
        emailAddress: 'institute@fortis.com',
        commencementDate: new Date('2024-06-01'),
        seatsRequested: 8,
        approvedSeats: 8,
        headName: 'Dr. Ritu Garg',
        headDesignation: 'Zonal Medical Director',
        hodName: 'Dr. Sandeep Gore',
        bedCount: 85,
        physicianAvailability: 'Yes',
        physicianExperience: 14,
        courseDirectorEMQualified: 'Yes',
        emFacultyCount: 6,
        teachingSpace: 'Yes',
        nabhStatus: 'Yes',
        facultyCommitmentLetterUrl: DUMMY_PDF,
        documents: {
          equipmentListUrl: DUMMY_PDF,
          facultyListUrl: DUMMY_PDF,
          emergencyOPDStatisticsUrl: DUMMY_PDF,
          libraryBookListUrl: DUMMY_PDF,
          trainingMannequinListUrl: DUMMY_PDF,
          diagnosticEquipmentListUrl: DUMMY_PDF,
          declarationLetterUrl: DUMMY_PDF,
        },
        status: 'Approved',
        paymentStatus: 'Completed',
        inspectionTriggered: true,
      },
      {
        key: 'manipal',
        user: usersMap['pending@manipal.com']._id,
        orgName: 'Manipal Emergency Academy',
        constitutionType: 'University',
        instituteAddress: '98 HAL Airport Road, Kodihalli, Bengaluru, Karnataka - 560017',
        registeredOfficeAddress: 'Manipal Health Enterprises, Off Old Airport Road, Bengaluru',
        phoneNumber: '080-25024444',
        emailAddress: 'pending@manipal.com',
        commencementDate: new Date('2025-01-01'),
        seatsRequested: 6,
        approvedSeats: 0,
        headName: 'Dr. Sudarshan Ballal',
        headDesignation: 'Chairman',
        hodName: 'Dr. Freston Marc Sirur',
        bedCount: 60,
        physicianAvailability: 'Yes',
        physicianExperience: 11,
        courseDirectorEMQualified: 'Yes',
        emFacultyCount: 5,
        teachingSpace: 'Yes',
        nabhStatus: 'Yes',
        facultyCommitmentLetterUrl: DUMMY_PDF,
        documents: {
          equipmentListUrl: DUMMY_PDF,
          facultyListUrl: DUMMY_PDF,
          emergencyOPDStatisticsUrl: DUMMY_PDF,
          libraryBookListUrl: DUMMY_PDF,
          trainingMannequinListUrl: DUMMY_PDF,
          diagnosticEquipmentListUrl: DUMMY_PDF,
          declarationLetterUrl: DUMMY_PDF,
        },
        status: 'Pending Review',
        paymentStatus: 'Completed',
        inspectionTriggered: false,
      },
      {
        key: 'cityhealth',
        user: usersMap['rejected@cityhealth.com']._id,
        orgName: 'City Health Emergency Training Centre',
        constitutionType: 'Autonomous Body',
        instituteAddress: '42 Senapati Bapat Road, Shivaji Nagar, Pune, Maharashtra - 411016',
        registeredOfficeAddress: 'Plot 18, MIDC Bhosari, Pune',
        phoneNumber: '020-25651234',
        emailAddress: 'rejected@cityhealth.com',
        commencementDate: new Date('2024-03-01'),
        seatsRequested: 4,
        approvedSeats: 0,
        headName: 'Dr. Prakash Deshpande',
        headDesignation: 'Medical Superintendent',
        hodName: 'Dr. Amol Kulkarni',
        bedCount: 25,
        physicianAvailability: 'Yes',
        physicianExperience: 5,
        courseDirectorEMQualified: 'No',
        emFacultyCount: 2,
        teachingSpace: 'No',
        nabhStatus: 'No',
        facultyCommitmentLetterUrl: DUMMY_PDF,
        documents: {
          equipmentListUrl: DUMMY_PDF,
          facultyListUrl: DUMMY_PDF,
          emergencyOPDStatisticsUrl: DUMMY_PDF,
          libraryBookListUrl: DUMMY_PDF,
          trainingMannequinListUrl: DUMMY_PDF,
          diagnosticEquipmentListUrl: DUMMY_PDF,
          declarationLetterUrl: DUMMY_PDF,
        },
        status: 'Rejected',
        remarks: 'Infrastructure and faculty requirements not met as per SEMI accreditation norms (requires minimum 50 beds & full-time qualified EM Director).',
        paymentStatus: 'Pending',
        inspectionTriggered: false,
      },
    ];

    for (const inst of institutesToSeed) {
      const { key, ...instData } = inst;
      let instDoc = await Institute.findOne({ user: instData.user });
      if (!instDoc) {
        instDoc = await Institute.create(instData as any);
      } else if (options.force) {
        Object.assign(instDoc, instData);
        await instDoc.save();
      }
      institutesMap[key] = instDoc;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. COURSES (Academic Board managed)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Courses...');
    const coursesMap: Record<string, any> = {};

    const coursesToSeed = [
      {
        key: 'fem',
        name: 'Fellowship in Emergency Medicine',
        courseCode: 'FEM',
        courseType: 'Fellowship',
        programCategory: 'Emergency Medicine',
        courseDuration: '2',
        durationType: 'Years',
        subjects: [
          'Core Emergency Medicine',
          'Trauma & Resuscitation',
          'Pediatric & Neonatal Emergencies',
          'Critical Care & Toxicology',
        ],
        practicalExamName: 'Clinical OSCE & Practical Station Exam',
        practicalExams: ['Clinical OSCE', 'Resuscitation Stations', 'Viva Voce'],
        examinations: [
          {
            examinationNumber: 1,
            examinationName: 'Part 1 - Basic Sciences & Core Emergencies',
            monthsRequired: 12,
            subjects: [
              { code: 'FEM101', name: 'Core Emergency Medicine' },
              { code: 'FEM102', name: 'Trauma & Resuscitation' },
              { code: 'FEM103', name: 'Pediatric & Neonatal Emergencies' },
              { code: 'FEM104', name: 'Critical Care & Toxicology' },
            ],
          },
          {
            examinationNumber: 2,
            examinationName: 'Part 2 - Advanced Emergency Medicine & Exit OSCE',
            monthsRequired: 24,
            subjects: [
              { code: 'FEM201', name: 'Advanced Emergency Medicine' },
              { code: 'FEM202', name: 'Disaster Management & EMS' },
            ],
          },
        ],
        examinationFee: 5000,
        reappearingExaminationFee: 3000,
        feeApplicableForFirstAttempt: false,
        examFeeConfig: {
          exam_1: {
            firstAttemptFee: 5000,
            reappearingFee: 3000,
            feeApplicableForFirstAttempt: false,
          },
          exam_2: {
            firstAttemptFee: 5000,
            reappearingFee: 3000,
            feeApplicableForFirstAttempt: false,
          },
        },
      },
      {
        key: 'mem',
        name: 'Masters in Emergency Medicine',
        courseCode: 'MEM',
        courseType: 'Postgraduate',
        programCategory: 'Emergency Medicine',
        courseDuration: '3',
        durationType: 'Years',
        subjects: [
          'Advanced Emergency Medicine',
          'Disaster & EMS Management',
          'Emergency Ultrasound & Imaging',
          'ICU & Intensive Monitoring',
        ],
        practicalExamName: 'Advanced Simulation & High-Fidelity OSCE',
        practicalExams: ['Simulation Station', 'Emergency Ultrasound & Echo', 'Clinical Case Presentation'],
        examinations: [
          {
            examinationNumber: 1,
            examinationName: 'MEM Part 1 Primary Examination',
            monthsRequired: 18,
            subjects: [
              { code: 'MEM101', name: 'Advanced Emergency Medicine' },
              { code: 'MEM102', name: 'Disaster & EMS Management' },
              { code: 'MEM103', name: 'Emergency Ultrasound & Imaging' },
              { code: 'MEM104', name: 'ICU & Intensive Monitoring' },
            ],
          },
          {
            examinationNumber: 2,
            examinationName: 'MEM Part 2 Final Exit Examination',
            monthsRequired: 36,
            subjects: [
              { code: 'MEM201', name: 'Comprehensive Emergency Medicine' },
              { code: 'MEM202', name: 'Emergency Administration & Research' },
            ],
          },
        ],
        examinationFee: 6000,
        reappearingExaminationFee: 3500,
        feeApplicableForFirstAttempt: false,
        examFeeConfig: {
          exam_1: {
            firstAttemptFee: 6000,
            reappearingFee: 3500,
            feeApplicableForFirstAttempt: false,
          },
        },
      },
      {
        key: 'dem',
        name: 'Diploma in Emergency Medicine',
        courseCode: 'DEM',
        courseType: 'Diploma',
        programCategory: 'Emergency Medicine',
        courseDuration: '1',
        durationType: 'Years',
        subjects: [
          'Emergency Triage & Assessment',
          'Basic Procedural Skills in EM',
          'Common Medical Emergencies',
        ],
        practicalExamName: 'Core Clinical Skills & Triage Stations',
        practicalExams: ['Triage Station', 'BLS & Airway Skills'],
        examinations: [
          {
            examinationNumber: 1,
            examinationName: 'Diploma Comprehensive Examination',
            monthsRequired: 12,
            subjects: [
              { code: 'DEM101', name: 'Emergency Triage & Assessment' },
              { code: 'DEM102', name: 'Basic Procedural Skills in EM' },
              { code: 'DEM103', name: 'Common Medical Emergencies' },
            ],
          },
        ],
        examinationFee: 4000,
        reappearingExaminationFee: 2500,
        feeApplicableForFirstAttempt: false,
        examFeeConfig: {
          exam_1: {
            firstAttemptFee: 4000,
            reappearingFee: 2500,
            feeApplicableForFirstAttempt: false,
          },
        },
      },
    ];

    for (const c of coursesToSeed) {
      const { key, ...cData } = c;
      let courseDoc = await Course.findOne({ courseCode: cData.courseCode });
      if (!courseDoc) {
        courseDoc = await Course.create(cData);
      } else if (options.force) {
        Object.assign(courseDoc, cData);
        await courseDoc.save();
      }
      coursesMap[key] = courseDoc;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. BATCHES
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Batches...');
    const batchesMap: Record<string, any> = {};

    const batchesToSeed = [
      {
        key: 'apollo_fem_2025',
        institute: institutesMap['apollo']._id,
        course: coursesMap['fem']._id,
        year: 2025,
        name: 'FEM 2025 Batch A',
        seats: 5,
        activeFellows: 3,
        status: 'Active',
      },
      {
        key: 'apollo_fem_2026',
        institute: institutesMap['apollo']._id,
        course: coursesMap['fem']._id,
        year: 2026,
        name: 'FEM 2026 Batch A',
        seats: 5,
        activeFellows: 5,
        status: 'Active',
      },
      {
        key: 'apollo_mem_2025',
        institute: institutesMap['apollo']._id,
        course: coursesMap['mem']._id,
        year: 2025,
        name: 'MEM 2025 Batch A',
        seats: 4,
        activeFellows: 3,
        status: 'Active',
      },
      {
        key: 'apollo_dem_2026',
        institute: institutesMap['apollo']._id,
        course: coursesMap['dem']._id,
        year: 2026,
        name: 'DEM 2026 Batch A',
        seats: 6,
        activeFellows: 2,
        status: 'Active',
      },
      {
        key: 'fortis_fem_2026',
        institute: institutesMap['fortis']._id,
        course: coursesMap['fem']._id,
        year: 2026,
        name: 'Fortis FEM 2026 Batch A',
        seats: 5,
        activeFellows: 1,
        status: 'Active',
      },
    ];

    for (const b of batchesToSeed) {
      const { key, ...bData } = b;
      let batchDoc = await Batch.findOne({ course: bData.course, name: bData.name });
      if (!batchDoc) {
        batchDoc = await Batch.create(bData as any);
      } else if (options.force) {
        Object.assign(batchDoc, bData);
        await batchDoc.save();
      }
      batchesMap[key] = batchDoc;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. STUDENTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Students...');
    const studentsMap: Record<string, any> = {};

    const studentsToSeed = [
      // Apollo FEM 2025 Batch (Senior batch, Past published results)
      {
        key: 'aarav',
        enrollmentId: 'SEMI-2025-1001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'aarav.sharma@apollo.edu',
        contactNumber: '9840123456',
        homeAddress: 'Flat 4B, Emerald Heights, Anna Nagar, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2023,
        universityName: 'The Tamil Nadu Dr. M.G.R. Medical University',
        medicalCouncilRegistrationNumber: 'TN-MC-88291',
        isForeignGraduate: false,
        dateOfBirth: new Date('1995-04-12'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2025']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 92,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
            marks: [
              { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', marksObtained: 85, totalMarks: 100, isAbsent: false, grade: 'O' },
              { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', marksObtained: 78, totalMarks: 100, isAbsent: false, grade: 'A' },
              { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', marksObtained: 82, totalMarks: 100, isAbsent: false, grade: 'A+' },
              { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', marksObtained: 90, totalMarks: 100, isAbsent: false, grade: 'O' },
            ],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'sneha',
        enrollmentId: 'SEMI-2025-1002',
        firstName: 'Sneha',
        lastName: 'Pillai',
        email: 'sneha.pillai@apollo.edu',
        contactNumber: '9840234567',
        homeAddress: '12 Kothari Road, Nungambakkam, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2023,
        universityName: 'Kerala University of Health Sciences',
        medicalCouncilRegistrationNumber: 'KL-MC-74120',
        isForeignGraduate: false,
        dateOfBirth: new Date('1996-08-23'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2025']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 88,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
            marks: [
              { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', marksObtained: 72, totalMarks: 100, isAbsent: false, grade: 'A' },
              { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', marksObtained: 68, totalMarks: 100, isAbsent: false, grade: 'B+' },
              { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', marksObtained: 74, totalMarks: 100, isAbsent: false, grade: 'A' },
              { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', marksObtained: 70, totalMarks: 100, isAbsent: false, grade: 'A' },
            ],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'vikram',
        enrollmentId: 'SEMI-2025-1003',
        firstName: 'Vikram',
        lastName: 'Malhotra',
        email: 'vikram.malhotra@apollo.edu',
        contactNumber: '9840345678',
        homeAddress: '55 Harrington Road, Chetpet, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2022,
        universityName: 'Maharashtra University of Health Sciences',
        medicalCouncilRegistrationNumber: 'MMC-2022-9901',
        isForeignGraduate: false,
        dateOfBirth: new Date('1994-11-05'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2025']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 80,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
            marks: [
              { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', marksObtained: 32, totalMarks: 100, isAbsent: false, grade: 'F' },
              { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', marksObtained: 55, totalMarks: 100, isAbsent: false, grade: 'B' },
              { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', marksObtained: 52, totalMarks: 100, isAbsent: false, grade: 'B' },
              { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', marksObtained: 55, totalMarks: 100, isAbsent: false, grade: 'B' },
            ],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },

      // Apollo FEM 2026 Batch (Current batch with Approved Exam Application & Scheduled Results)
      {
        key: 'ananya',
        enrollmentId: 'SEMI-2026-2001',
        firstName: 'Ananya',
        lastName: 'Iyer',
        email: 'ananya.iyer@apollo.edu',
        contactNumber: '9840456789',
        homeAddress: 'Flat 8C, Ceebros Boulevard, OMR, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2024,
        universityName: 'The Tamil Nadu Dr. M.G.R. Medical University',
        medicalCouncilRegistrationNumber: 'TN-MC-90182',
        isForeignGraduate: false,
        dateOfBirth: new Date('1997-02-14'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2026']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 95,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
            marks: [
              { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', marksObtained: 88, totalMarks: 100, isAbsent: false, grade: 'O' },
              { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', marksObtained: 84, totalMarks: 100, isAbsent: false, grade: 'A+' },
              { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', marksObtained: 80, totalMarks: 100, isAbsent: false, grade: 'A+' },
              { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', marksObtained: 86, totalMarks: 100, isAbsent: false, grade: 'O' },
            ],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'rohan',
        enrollmentId: 'SEMI-2026-2002',
        firstName: 'Rohan',
        lastName: 'Deshmukh',
        email: 'rohan.deshmukh@apollo.edu',
        contactNumber: '9840567890',
        homeAddress: 'Plot 22, VGP Layout, Palavakkam, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2024,
        universityName: 'Maharashtra University of Health Sciences',
        medicalCouncilRegistrationNumber: 'MMC-2024-4152',
        isForeignGraduate: false,
        dateOfBirth: new Date('1996-12-19'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2026']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 91,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
            marks: [
              { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', marksObtained: 76, totalMarks: 100, isAbsent: false, grade: 'A' },
              { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', marksObtained: 79, totalMarks: 100, isAbsent: false, grade: 'A' },
              { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', marksObtained: 82, totalMarks: 100, isAbsent: false, grade: 'A+' },
              { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', marksObtained: 75, totalMarks: 100, isAbsent: false, grade: 'A' },
            ],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'meera',
        enrollmentId: 'SEMI-2026-2003',
        firstName: 'Meera',
        lastName: 'Nambiar',
        email: 'meera.nambiar@apollo.edu',
        contactNumber: '9840678901',
        homeAddress: '31 Besant Avenue, Adyar, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2024,
        universityName: 'Kerala University of Health Sciences',
        medicalCouncilRegistrationNumber: 'KL-MC-81093',
        isForeignGraduate: false,
        dateOfBirth: new Date('1998-05-30'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2026']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 86,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
            marks: [
              { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', marksObtained: 74, totalMarks: 100, isAbsent: false, grade: 'A' },
              { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', marksObtained: null, totalMarks: 100, isAbsent: false, grade: '' },
              { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', marksObtained: null, totalMarks: 100, isAbsent: false, grade: '' },
              { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', marksObtained: null, totalMarks: 100, isAbsent: false, grade: '' },
            ],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'kabir',
        enrollmentId: 'SEMI-2026-2004',
        firstName: 'Kabir',
        lastName: 'Khan',
        email: 'kabir.khan@apollo.edu',
        contactNumber: '9840789012',
        homeAddress: '18 TTK Road, Alwarpet, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2023,
        universityName: 'Rajiv Gandhi University of Health Sciences',
        medicalCouncilRegistrationNumber: 'KMC-2023-5591',
        isForeignGraduate: false,
        dateOfBirth: new Date('1995-09-10'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2026']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 78,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
            marks: [],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'pooja',
        enrollmentId: 'SEMI-2026-2005',
        firstName: 'Pooja',
        lastName: 'Joshi',
        email: 'pooja.joshi@apollo.edu',
        contactNumber: '9840890123',
        homeAddress: '7 G.N. Chetty Road, T. Nagar, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2024,
        universityName: 'Gujarat University',
        medicalCouncilRegistrationNumber: 'GMC-2024-3329',
        isForeignGraduate: false,
        dateOfBirth: new Date('1997-07-22'),
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2026']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: false,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 65,
            thesisApproved: false,
            eligibilityStatus: 'Pending',
            marks: [],
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },

      // Apollo MEM 2025 Batch (Students for Academic Verification)
      {
        key: 'aditya',
        enrollmentId: 'SEMI-2025-3001',
        firstName: 'Aditya',
        lastName: 'Rao',
        email: 'aditya.rao@apollo.edu',
        contactNumber: '9840901234',
        homeAddress: '64 Gandhi Mandapam Road, Kotturpuram, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2023,
        universityName: 'Rajiv Gandhi University of Health Sciences',
        medicalCouncilRegistrationNumber: 'KMC-2023-7188',
        isForeignGraduate: false,
        dateOfBirth: new Date('1996-01-18'),
        course: coursesMap['mem']._id,
        batch: batchesMap['apollo_mem_2025']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Pending Verification',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 90,
            thesisDocumentUrl: DUMMY_PDF,
            thesisApproved: false,
            eligibilityStatus: 'Pending',
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'divya',
        enrollmentId: 'SEMI-2025-3002',
        firstName: 'Divya',
        lastName: 'Krishnan',
        email: 'divya.krishnan@apollo.edu',
        contactNumber: '9840012345',
        homeAddress: '88 Luz Church Road, Mylapore, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2023,
        universityName: 'The Tamil Nadu Dr. M.G.R. Medical University',
        medicalCouncilRegistrationNumber: 'TN-MC-85419',
        isForeignGraduate: false,
        dateOfBirth: new Date('1997-10-08'),
        course: coursesMap['mem']._id,
        batch: batchesMap['apollo_mem_2025']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Pending Verification',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 89,
            thesisDocumentUrl: DUMMY_PDF,
            thesisApproved: false,
            eligibilityStatus: 'Pending',
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'siddharth',
        enrollmentId: 'SEMI-2025-3003',
        firstName: 'Siddharth',
        lastName: 'Verma',
        email: 'siddharth.verma@apollo.edu',
        contactNumber: '9840112233',
        homeAddress: '14 Santhome High Road, Santhome, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2022,
        universityName: 'Delhi University (MAMC)',
        medicalCouncilRegistrationNumber: 'DMC-2022-6721',
        isForeignGraduate: false,
        dateOfBirth: new Date('1995-03-25'),
        course: coursesMap['mem']._id,
        batch: batchesMap['apollo_mem_2025']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Correction Required',
        verificationRemarks: 'Please re-upload clear medical council registration certificate with visible registration seal.',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 82,
            thesisApproved: false,
            eligibilityStatus: 'Pending',
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },

      // Apollo DEM 2026 Batch (For Exam Application flow)
      {
        key: 'ruchi',
        enrollmentId: 'SEMI-2026-4001',
        firstName: 'Ruchi',
        lastName: 'Gupta',
        email: 'ruchi.gupta@apollo.edu',
        contactNumber: '9840223344',
        homeAddress: '25 Sterling Road, Nungambakkam, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2024,
        universityName: 'Manipal Academy of Higher Education',
        medicalCouncilRegistrationNumber: 'KMC-2024-9128',
        isForeignGraduate: false,
        dateOfBirth: new Date('1998-09-12'),
        course: coursesMap['dem']._id,
        batch: batchesMap['apollo_dem_2026']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 90,
            thesisApproved: true,
            eligibilityStatus: 'Pending',
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
      {
        key: 'varun',
        enrollmentId: 'SEMI-2026-4002',
        firstName: 'Varun',
        lastName: 'Reddy',
        email: 'varun.reddy@apollo.edu',
        contactNumber: '9840334455',
        homeAddress: '72 Chamiers Road, Nandanam, Chennai',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2024,
        universityName: 'NTR University of Health Sciences',
        medicalCouncilRegistrationNumber: 'APMC-2024-5412',
        isForeignGraduate: false,
        dateOfBirth: new Date('1997-06-17'),
        course: coursesMap['dem']._id,
        batch: batchesMap['apollo_dem_2026']._id,
        institute: institutesMap['apollo']._id,
        courseDirector: 'Dr. Suresh Venkat',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 88,
            thesisApproved: true,
            eligibilityStatus: 'Pending',
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },

      // Fortis FEM 2026 Batch
      {
        key: 'ishita',
        enrollmentId: 'SEMI-2026-5001',
        firstName: 'Ishita',
        lastName: 'Sen',
        email: 'ishita.sen@fortis.edu',
        contactNumber: '9811223344',
        homeAddress: 'A-21 Sushant Lok Phase 1, Gurugram',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2023,
        universityName: 'West Bengal University of Health Sciences',
        medicalCouncilRegistrationNumber: 'WBMC-2023-8821',
        isForeignGraduate: false,
        dateOfBirth: new Date('1996-04-05'),
        course: coursesMap['fem']._id,
        batch: batchesMap['fortis_fem_2026']._id,
        institute: institutesMap['fortis']._id,
        courseDirector: 'Dr. Sandeep Gore',
        verificationStatus: 'Approved',
        remittedToAcademy: true,
        examinations: [
          {
            examinationNumber: 1,
            attendancePercentage: 93,
            thesisApproved: true,
            eligibilityStatus: 'Approved',
          },
        ],
        documents: {
          passportPhotoUrl: DUMMY_DOC,
          mbbsCertificateUrl: DUMMY_PDF,
          medicalCouncilRegistrationCertificateUrl: DUMMY_PDF,
          semiMembershipFormUrl: DUMMY_PDF,
        },
      },
    ];

    for (const s of studentsToSeed) {
      const { key, ...sData } = s;
      let studentDoc = await Student.findOne({ enrollmentId: sData.enrollmentId });
      if (!studentDoc) {
        studentDoc = await Student.create(sData as any);
      } else if (options.force) {
        Object.assign(studentDoc, sData);
        await studentDoc.save();
      }
      studentsMap[key] = studentDoc;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. EXAM APPLICATIONS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Exam Applications...');

    // 1. Pending Exam Application (DEM 2026 - awaiting Academy review on /academy/eligibility)
    const existingExam1 = await ExamApplication.findOne({
      batch: batchesMap['apollo_dem_2026']._id,
      examinationNumber: 1,
    });
    if (!existingExam1 || options.force) {
      if (existingExam1 && options.force) await existingExam1.deleteOne();
      await ExamApplication.create({
        institute: institutesMap['apollo']._id,
        course: coursesMap['dem']._id,
        batch: batchesMap['apollo_dem_2026']._id,
        examinationNumber: 1,
        students: [studentsMap['ruchi']._id, studentsMap['varun']._id],
        subjects: ['Emergency Triage & Assessment', 'Basic Procedural Skills in EM', 'Common Medical Emergencies'],
        status: 'Pending',
        hallTicketsGenerated: false,
      });
    }

    // 2. Approved Exam Application (FEM 2026 - ready to Publish Schedule on /academy/eligibility)
    const existingExam2 = await ExamApplication.findOne({
      batch: batchesMap['apollo_fem_2026']._id,
      examinationNumber: 1,
    });
    if (!existingExam2 || options.force) {
      if (existingExam2 && options.force) await existingExam2.deleteOne();
      await ExamApplication.create({
        institute: institutesMap['apollo']._id,
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2026']._id,
        examinationNumber: 1,
        students: [
          studentsMap['ananya']._id,
          studentsMap['rohan']._id,
          studentsMap['meera']._id,
          studentsMap['kabir']._id,
        ],
        subjects: [
          'Core Emergency Medicine',
          'Trauma & Resuscitation',
          'Pediatric & Neonatal Emergencies',
          'Critical Care & Toxicology',
        ],
        status: 'Approved',
        scheduledDate: new Date('2026-10-15'),
        remarks: 'Eligibility verified and approved for exam schedule publication.',
        hallTicketsGenerated: false,
      });
    }

    // 3. SchedulePublished Exam Application (FEM 2025 - has hall tickets, schedule active)
    let examApp3 = await ExamApplication.findOne({
      batch: batchesMap['apollo_fem_2025']._id,
      examinationNumber: 1,
    });
    if (!examApp3 || options.force) {
      if (examApp3 && options.force) await examApp3.deleteOne();
      examApp3 = await ExamApplication.create({
        institute: institutesMap['apollo']._id,
        course: coursesMap['fem']._id,
        batch: batchesMap['apollo_fem_2025']._id,
        examinationNumber: 1,
        students: [
          studentsMap['aarav']._id,
          studentsMap['sneha']._id,
          studentsMap['vikram']._id,
        ],
        subjects: [
          'Core Emergency Medicine',
          'Trauma & Resuscitation',
          'Pediatric & Neonatal Emergencies',
          'Critical Care & Toxicology',
        ],
        status: 'SchedulePublished',
        scheduledDate: new Date('2026-05-15'),
        remarks: 'Exam schedule published.',
        examVenue: 'Apollo Hospitals Main Auditorium, Greams Road, Chennai',
        examCenter: 'SEMI Examination Center - South Zone 1',
        reportingTime: '08:30 AM',
        schedulePublishedAt: new Date('2026-05-01'),
        subjectSchedules: [
          { subject: 'Core Emergency Medicine', date: new Date('2026-05-15'), time: '09:30 AM - 12:30 PM' },
          { subject: 'Trauma & Resuscitation', date: new Date('2026-05-16'), time: '09:30 AM - 12:30 PM' },
          { subject: 'Pediatric & Neonatal Emergencies', date: new Date('2026-05-17'), time: '09:30 AM - 12:30 PM' },
          { subject: 'Critical Care & Toxicology', date: new Date('2026-05-18'), time: '09:30 AM - 12:30 PM' },
        ],
        hallTicketsGenerated: true,
        hallTicketsGeneratedAt: new Date('2026-05-01'),
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. HALL TICKETS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Hall Tickets...');
    const hallTicketStudents = [studentsMap['aarav'], studentsMap['sneha'], studentsMap['vikram']];
    for (const htStudent of hallTicketStudents) {
      const existingTicket = await HallTicket.findOne({ student: htStudent._id, 'metadata.version': '1.0' });
      if (!existingTicket || options.force) {
        if (existingTicket && options.force) await existingTicket.deleteOne();
        await HallTicket.create({
          ticketId: `HT-${htStudent.enrollmentId}-2025-S1`,
          hallTicketNumber: `HT-${htStudent.enrollmentId}-2025-S1`,
          examApplication: examApp3._id,
          student: htStudent._id,
          enrollmentId: htStudent.enrollmentId,
          studentName: `${htStudent.firstName} ${htStudent.lastName}`,
          contactNumber: htStudent.contactNumber,
          instituteName: institutesMap['apollo'].orgName,
          courseName: coursesMap['fem'].name,
          batchName: batchesMap['apollo_fem_2025'].name,
          batchYear: 2025,
          subjects: [
            'Core Emergency Medicine',
            'Trauma & Resuscitation',
            'Pediatric & Neonatal Emergencies',
            'Critical Care & Toxicology',
          ],
          examVenue: 'Apollo Hospitals Main Auditorium, Greams Road, Chennai',
          examCenter: 'SEMI Examination Center - South Zone 1',
          reportingTime: '08:30 AM',
          status: 'published',
          metadata: {
            generatedAt: new Date('2026-05-01'),
            generatedBy: 'Academic Board',
            version: '1.0',
          },
        });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. RESULTS & MARKSHEETS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Results & Marksheets...');

    const resultsToSeed = [
      // 1. Dr. Aarav Sharma (Past published, PASS, 83.75%)
      {
        student: studentsMap['aarav']._id,
        academicYear: '2025',
        examination: 1,
        subjects: [
          { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', internalMarks: 25, externalMarks: 60, totalMarks: 85, grade: 'O', credits: 4, gradePoints: 10, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', internalMarks: 23, externalMarks: 55, totalMarks: 78, grade: 'A', credits: 4, gradePoints: 8, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', internalMarks: 24, externalMarks: 58, totalMarks: 82, grade: 'A+', credits: 4, gradePoints: 9, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', internalMarks: 25, externalMarks: 65, totalMarks: 90, grade: 'O', credits: 4, gradePoints: 10, isRevaluationApplied: false, isRevaluationCompleted: false },
        ],
        totalMarks: 335,
        totalCredits: 16,
        percentage: 83.75,
        cgpa: 8.8,
        sgpa: 8.8,
        division: 'First',
        resultStatus: 'PASS',
        isPublished: true,
        publishedDate: new Date('2026-06-15T10:00:00.000Z'),
        isRevaluationActive: true,
        revaluationDeadline: new Date('2026-06-25T10:00:00.000Z'),
      },

      // 2. Dr. Sneha Pillai (Past published, PASS, 71.0%, Revaluation Applied)
      {
        student: studentsMap['sneha']._id,
        academicYear: '2025',
        examination: 1,
        subjects: [
          { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', internalMarks: 22, externalMarks: 50, totalMarks: 72, grade: 'A', credits: 4, gradePoints: 8, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', internalMarks: 20, externalMarks: 48, totalMarks: 68, grade: 'B+', credits: 4, gradePoints: 7, isRevaluationApplied: true, isRevaluationCompleted: false },
          { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', internalMarks: 24, externalMarks: 50, totalMarks: 74, grade: 'A', credits: 4, gradePoints: 8, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', internalMarks: 21, externalMarks: 49, totalMarks: 70, grade: 'A', credits: 4, gradePoints: 8, isRevaluationApplied: false, isRevaluationCompleted: false },
        ],
        totalMarks: 284,
        totalCredits: 16,
        percentage: 71.0,
        cgpa: 7.5,
        sgpa: 7.5,
        division: 'First',
        resultStatus: 'PASS',
        isPublished: true,
        publishedDate: new Date('2026-06-15T10:00:00.000Z'),
        isRevaluationActive: true,
        revaluationDeadline: new Date('2026-06-25T10:00:00.000Z'),
      },

      // 3. Dr. Vikram Malhotra (Past published, FAIL, 48.5%, Revaluation Under Review)
      {
        student: studentsMap['vikram']._id,
        academicYear: '2025',
        examination: 1,
        subjects: [
          { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', internalMarks: 10, externalMarks: 22, totalMarks: 32, grade: 'F', credits: 4, gradePoints: 0, isRevaluationApplied: true, isRevaluationCompleted: false },
          { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', internalMarks: 18, externalMarks: 37, totalMarks: 55, grade: 'B', credits: 4, gradePoints: 6, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', internalMarks: 17, externalMarks: 35, totalMarks: 52, grade: 'B', credits: 4, gradePoints: 6, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', internalMarks: 18, externalMarks: 37, totalMarks: 55, grade: 'B', credits: 4, gradePoints: 6, isRevaluationApplied: false, isRevaluationCompleted: false },
        ],
        totalMarks: 194,
        totalCredits: 16,
        percentage: 48.5,
        cgpa: 4.5,
        sgpa: 4.5,
        division: 'Fail',
        resultStatus: 'FAIL',
        isPublished: true,
        publishedDate: new Date('2026-06-15T10:00:00.000Z'),
        isRevaluationActive: true,
        revaluationDeadline: new Date('2026-06-25T10:00:00.000Z'),
      },

      // 4. Dr. Ananya Iyer (FUTURE SCHEDULED RESULT - 7 days ahead at 6:00 PM)
      {
        student: studentsMap['ananya']._id,
        academicYear: '2026',
        examination: 1,
        subjects: [
          { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', internalMarks: 26, externalMarks: 62, totalMarks: 88, grade: 'O', credits: 4, gradePoints: 10, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', internalMarks: 24, externalMarks: 60, totalMarks: 84, grade: 'A+', credits: 4, gradePoints: 9, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', internalMarks: 22, externalMarks: 58, totalMarks: 80, grade: 'A+', credits: 4, gradePoints: 9, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', internalMarks: 25, externalMarks: 61, totalMarks: 86, grade: 'O', credits: 4, gradePoints: 10, isRevaluationApplied: false, isRevaluationCompleted: false },
        ],
        totalMarks: 338,
        totalCredits: 16,
        percentage: 84.5,
        cgpa: 9.0,
        sgpa: 9.0,
        division: 'First',
        resultStatus: 'PASS',
        isPublished: true,
        publishedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future!
        isRevaluationActive: false,
        revaluationDeadline: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      },

      // 5. Dr. Rohan Deshmukh (FUTURE SCHEDULED RESULT - 7 days ahead at 6:00 PM)
      {
        student: studentsMap['rohan']._id,
        academicYear: '2026',
        examination: 1,
        subjects: [
          { subjectCode: 'FEM101', subjectName: 'Core Emergency Medicine', internalMarks: 22, externalMarks: 54, totalMarks: 76, grade: 'A', credits: 4, gradePoints: 8, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM102', subjectName: 'Trauma & Resuscitation', internalMarks: 23, externalMarks: 56, totalMarks: 79, grade: 'A', credits: 4, gradePoints: 8, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM103', subjectName: 'Pediatric & Neonatal Emergencies', internalMarks: 24, externalMarks: 58, totalMarks: 82, grade: 'A+', credits: 4, gradePoints: 9, isRevaluationApplied: false, isRevaluationCompleted: false },
          { subjectCode: 'FEM104', subjectName: 'Critical Care & Toxicology', internalMarks: 22, externalMarks: 53, totalMarks: 75, grade: 'A', credits: 4, gradePoints: 8, isRevaluationApplied: false, isRevaluationCompleted: false },
        ],
        totalMarks: 312,
        totalCredits: 16,
        percentage: 78.0,
        cgpa: 8.25,
        sgpa: 8.25,
        division: 'First',
        resultStatus: 'PASS',
        isPublished: true,
        publishedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future!
        isRevaluationActive: false,
        revaluationDeadline: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      },
    ];

    const resultsMap: Record<string, any> = {};

    for (const resData of resultsToSeed) {
      let resultDoc = await Result.findOne({
        student: resData.student,
        academicYear: resData.academicYear,
        examination: resData.examination,
      });

      if (!resultDoc) {
        resultDoc = await Result.create(resData as any);
      } else if (options.force) {
        Object.assign(resultDoc, resData);
        await resultDoc.save();
      }

      resultsMap[String(resData.student)] = resultDoc;

      // Seed Marksheet for published results in past
      if (resData.publishedDate && resData.publishedDate <= new Date()) {
        const studentObj = await Student.findById(resData.student);
        const marksheetNumber = `MS-${studentObj?.enrollmentId}-${resData.academicYear}-S${resData.examination}`;
        let marksheetDoc = await Marksheet.findOne({ marksheetNumber });
        if (!marksheetDoc || options.force) {
          if (marksheetDoc && options.force) await marksheetDoc.deleteOne();
          await Marksheet.create({
            student: resData.student,
            academicYear: resData.academicYear,
            examination: resData.examination,
            result: resultDoc._id,
            marksheetNumber,
            marksheetPDF: DUMMY_PDF,
            isFinal: true,
            version: 1,
            downloadedCount: 1,
            lastDownloaded: new Date(),
          });
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. REVALUATION REQUESTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Revaluation Requests...');

    // Request 1: Dr. Sneha Pillai (Pending)
    const snehaResult = resultsMap[String(studentsMap['sneha']._id)];
    if (snehaResult) {
      let rev1 = await RevaluationRequest.findOne({ requestId: 'REV-2026-001' });
      if (!rev1 || options.force) {
        if (rev1 && options.force) await rev1.deleteOne();
        rev1 = await RevaluationRequest.create({
          requestId: 'REV-2026-001',
          institute: institutesMap['apollo']._id,
          student: studentsMap['sneha']._id,
          result: snehaResult._id,
          academicYear: '2025',
          examination: 1,
          subjects: [
            {
              subjectCode: 'FEM102',
              subjectName: 'Trauma & Resuscitation',
              originalMarks: 68,
              originalGrade: 'B+',
              internalMarks: 20,
              externalMarks: 48,
              revaluationReason: 'Marks obtained are lower than expected based on answer scheme and clinical scenario performance.',
              evaluated: false,
            },
          ],
          feePerSubject: 1000,
          totalFee: 1000,
          paymentStatus: 'PAID',
          paymentId: 'pay_dummy_sneha_1001',
          paymentOrderId: 'order_dummy_sneha_1001',
          status: 'PENDING',
          submittedDate: new Date('2026-06-20'),
          finalResult: 'PENDING',
        });
      }
    }

    // Request 2: Dr. Vikram Malhotra (Under Review)
    const vikramResult = resultsMap[String(studentsMap['vikram']._id)];
    if (vikramResult) {
      let rev2 = await RevaluationRequest.findOne({ requestId: 'REV-2026-002' });
      if (!rev2 || options.force) {
        if (rev2 && options.force) await rev2.deleteOne();
        rev2 = await RevaluationRequest.create({
          requestId: 'REV-2026-002',
          institute: institutesMap['apollo']._id,
          student: studentsMap['vikram']._id,
          result: vikramResult._id,
          academicYear: '2025',
          examination: 1,
          subjects: [
            {
              subjectCode: 'FEM101',
              subjectName: 'Core Emergency Medicine',
              originalMarks: 32,
              originalGrade: 'F',
              internalMarks: 10,
              externalMarks: 22,
              revaluationReason: 'Requesting re-totalling and re-evaluation of Section B questions.',
              evaluated: false,
            },
          ],
          feePerSubject: 1000,
          totalFee: 1000,
          paymentStatus: 'PAID',
          paymentId: 'pay_dummy_vikram_1002',
          paymentOrderId: 'order_dummy_vikram_1002',
          status: 'UNDER_REVIEW',
          submittedDate: new Date('2026-06-21'),
          finalResult: 'PENDING',
        });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. REMITTANCES & FEE RECORDS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Remittances & Fee Records...');

    const existingRemittance = await Remittance.findOne({ utrNumber: 'UTR-APOLLO-2026-8899' });
    if (!existingRemittance || options.force) {
      if (existingRemittance && options.force) await existingRemittance.deleteOne();
      await Remittance.create({
        institute: institutesMap['apollo']._id,
        totalAmount: 75000,
        paymentPurpose: 'Annual Fellowship Accreditation & Student Remittance 2025-26',
        remarks: 'Remittance for 3 enrolled fellows (Aarav, Sneha, Vikram)',
        utrNumber: 'UTR-APOLLO-2026-8899',
        paymentMode: 'NEFT Online Transfer',
        paymentDate: new Date('2025-02-15'),
        paymentReceiptUrl: DUMMY_PDF,
        students: [
          studentsMap['aarav']._id,
          studentsMap['sneha']._id,
          studentsMap['vikram']._id,
        ],
      });
    }

    const feeRecordsToSeed = [
      {
        student: studentsMap['aarav']._id,
        amount: 25000,
        paymentMode: 'Net Banking',
        utrNumber: 'UTR-FEE-1001',
        paymentDate: new Date('2025-01-10'),
        paymentPurpose: 'Course Admission & Tuition Fee',
      },
      {
        student: studentsMap['sneha']._id,
        amount: 25000,
        paymentMode: 'Net Banking',
        utrNumber: 'UTR-FEE-1002',
        paymentDate: new Date('2025-01-11'),
        paymentPurpose: 'Course Admission & Tuition Fee',
      },
      {
        student: studentsMap['ananya']._id,
        amount: 25000,
        paymentMode: 'Net Banking',
        utrNumber: 'UTR-FEE-2001',
        paymentDate: new Date('2026-01-10'),
        paymentPurpose: 'Course Admission & Tuition Fee',
      },
    ];

    for (const fr of feeRecordsToSeed) {
      const exists = await FeeRecord.findOne({ student: fr.student, utrNumber: fr.utrNumber });
      if (!exists || options.force) {
        if (exists && options.force) await exists.deleteOne();
        await FeeRecord.create(fr);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('ACADEMY PORTAL LOGIN:');
    console.log('  URL:      http://localhost:5173/academy/login');
    console.log('  Email:    superadmin@academy.com');
    console.log('  Password: SuperAdmin123!');
    console.log('  (Or Board: board@academy.com / BoardPass123!)');
    console.log('');
    console.log('INSTITUTE PORTAL LOGIN (APPROVED & ACTIVE):');
    console.log('  URL:      http://localhost:5173/institute/login');
    console.log('  Email:    institute@apollo.com');
    console.log('  Password: Institute123!');
    console.log('  Institute: Apollo Hospitals Institute of Emergency Medicine');
    console.log('');
    console.log('INSTITUTE PORTAL (PENDING REVIEW):');
    console.log('  Email:    pending@manipal.com');
    console.log('  Password: Institute123!');
    console.log('');
    console.log('PUBLIC RESULT LOOKUP:');
    console.log('  URL:           http://localhost:5173/results');
    console.log('  Enrollment ID: SEMI-2025-1001');
    console.log('  DOB:           1995-04-12');
    console.log('═══════════════════════════════════════════════════════════════════');

    const summary = {
      users: usersToSeed.length,
      institutes: institutesToSeed.length,
      courses: coursesToSeed.length,
      batches: batchesToSeed.length,
      students: studentsToSeed.length,
      examApplications: 3,
      hallTickets: hallTicketStudents.length,
      results: resultsToSeed.length,
      revaluationRequests: 2,
    };
    logger.info('🎉 SEED COMPLETED: Users, Institutes, Courses, Batches, Students, Exams, Results, Revaluations seeded successfully!');
    return summary;
  } catch (error: any) {
    console.error(`❌ Error during seeding: ${error.message}`, error);
    logger.error(`❌ Error during seeding: ${error.message}`);
    throw error;
  }
};

/**
 * Super Admin seed wrapper called on initApp()
 */
export const seedSuperAdmin = async () => {
  try {
    await seedAllData({ force: true });
  } catch (err: any) {
    console.error('seedSuperAdmin wrapper error:', err.message);
    logger.error('seedSuperAdmin wrapper error: ' + err.message);
  }
};

// If run directly via command line
if (require.main === module) {
  const runSeeder = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/my_database');
      console.log('MongoDB Connected for seeding.');
      await seedAllData({ force: true });
      await mongoose.disconnect();
      console.log('MongoDB Disconnected after seeding.');
      process.exit(0);
    } catch (err: any) {
      console.error(`Seeder connection error: ${err.message}`);
      process.exit(1);
    }
  };
  runSeeder();
}
