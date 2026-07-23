import { Certificate } from '../models/certificateModel';

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
    const certificate = await Certificate.findOne({ certificateNumber });
    if (!certificate) {
      return { valid: false, message: 'Certificate not found' };
    }

    if (certificate.isRevoked) {
      return { valid: false, message: 'Certificate has been revoked' };
    }

    if (!certificate.isVerified) {
      return { valid: false, message: 'Certificate not verified' };
    }

    return {
      valid: true,
      message: 'Certificate is valid',
      certificate: {
        student: certificate.student,
        type: certificate.type,
        issuedDate: certificate.issuedDate,
        academicYear: certificate.academicYear,
      },
    };
  }
}

export default new CertificateService();
