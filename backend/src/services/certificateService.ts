import { Certificate } from '../models/certificateModel';
import getRedisClient from '../config/redis';

function generateRandomString(length = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

class CertificateService {
  async generateCertificateNumber(type: string): Promise<string> {
    const prefix = type === 'PROVISIONAL' ? 'PC' : 'CC';
    const year = new Date().getFullYear();
    const random = generateRandomString(6);
    const sequence = await this.getNextSequence();
    return `${prefix}-${year}-${sequence}-${random}`;
  }

  async getNextSequence(): Promise<string> {
    const count = await Certificate.countDocuments();
    return String(count + 1).padStart(6, '0');
  }

  async getCertificatesWithPagination(query: any, options: any) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .populate(options.populate || [])
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(query),
    ]);

    return {
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async verifyCertificate(certificateNumber: string) {
    const redis = getRedisClient();
    const cacheKey = `cert:verify:${certificateNumber}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch { /* ignore cache read error */ }

    const certificate: any = await Certificate.findOne({ certificateNumber }).populate({
      path: 'student',
      populate: { path: 'course' },
    });
    if (!certificate) {
      const res = { valid: false, message: 'Certificate not found' };
      try { await redis.set(cacheKey, JSON.stringify(res), 'EX', 300); } catch {}
      return res;
    }

    if (certificate.isRevoked) {
      const res = { valid: false, message: 'Certificate has been revoked' };
      try { await redis.set(cacheKey, JSON.stringify(res), 'EX', 300); } catch {}
      return res;
    }

    const studentObj = certificate.student;
    const studentName = certificate.studentName || (studentObj ? `${studentObj.firstName || ''} ${studentObj.lastName || ''}`.trim() : '');
    const courseName = certificate.courseName || (studentObj?.course ? (typeof studentObj.course === 'object' ? studentObj.course.name || studentObj.course.courseName : studentObj.course) : '');

    const res = {
      valid: true,
      message: 'Certificate is valid',
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName,
        courseName,
        issueDate: certificate.issuedDate,
        type: certificate.type,
      },
    };

    try { await redis.set(cacheKey, JSON.stringify(res), 'EX', 1800); } catch {}
    return res;
  }
}

export default new CertificateService();

