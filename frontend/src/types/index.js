// Documentation of data structures used throughout the application
// Since we're using plain JavaScript React, these are just for reference

/**
 * Candidate Status enum
 * Possible values: 'new', 'screening', 'interviewed', 'evaluated', 'offered', 'rejected', 'onboarding', 'hired'
 */

/**
 * Candidate Object Structure
 * @example {
 *   id: 'cand-001',
 *   fullName: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '0123456789',
 *   position: 'Software Engineer',
 *   department: 'IT',
 *   status: 'interviewed',
 *   appliedDate: '2026-05-15',
 *   interviewDate: '2026-06-01',
 *   evaluationScore: 8.5,
 *   notes: 'Good technical skills',
 *   cvFile: 'cv-001.pdf',
 *   linkedFromIDL: true,
 *   createdAt: '2026-05-15T00:00:00Z',
 *   updatedAt: '2026-06-01T00:00:00Z'
 * }
 */

/**
 * RecruitmentRequest Object Structure
 * @example {
 *   id: 'req-001',
 *   requestNumber: 'REQ-2026-001',
 *   department: 'IT',
 *   factory: 'Factory A',
 *   position: 'Software Engineer',
 *   quantity: 3,
 *   requestDate: '2026-05-01',
 *   requiredDate: '2026-07-01',
 *   status: 'open',
 *   jobDescription: 'Job description text',
 *   createdBy: 'HR Admin',
 *   createdAt: '2026-05-01T00:00:00Z',
 *   updatedAt: '2026-05-01T00:00:00Z'
 * }
 */

/**
 * JobDescription Object Structure
 * @example {
 *   id: 'jd-001',
 *   title: 'Senior Software Engineer',
 *   factory: 'Factory A',
 *   department: 'IT',
 *   position: 'Software Engineer',
 *   description: 'Detailed job description...',
 *   requirements: ['5+ years experience', 'React knowledge'],
 *   benefits: ['Health insurance', '401k'],
 *   salary: '100k-150k',
 *   fileUrl: 'jd-001.pdf',
 *   createdAt: '2026-05-01T00:00:00Z',
 *   updatedAt: '2026-05-01T00:00:00Z'
 * }
 */

/**
 * IDLData Object Structure (Workforce Planning)
 * @example {
 *   id: 'idl-001',
 *   position: 'Software Engineer',
 *   department: 'IT',
 *   factory: 'Factory A',
 *   headcount: 10,
 *   currentFilled: 7,
 *   openPositions: 3,
 *   lastUpdated: '2026-06-01T00:00:00Z'
 * }
 */

/**
 * CVFile Object Structure
 * @example {
 *   id: 'cv-001',
 *   candidateId: 'cand-001',
 *   fileName: 'john_doe_cv.pdf',
 *   fileUrl: '/uploads/john_doe_cv.pdf',
 *   uploadDate: '2026-05-15T00:00:00Z',
 *   fileSize: 250000,
 *   extractedData: {
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     phone: '0123456789',
 *     skills: ['React', 'JavaScript', 'Node.js']
 *   }
 * }
 */

/**
 * DashboardStats Object Structure
 * @example {
 *   totalCandidates: 47,
 *   totalRequests: 12,
 *   openPositions: 8,
 *   filledPositions: 4,
 *   interviewsThisMonth: 6,
 *   hiringsThisMonth: 2
 * }
 */

// This file is for documentation only in JavaScript React
// Import actual data from services/mockData.js
