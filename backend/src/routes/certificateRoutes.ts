import express from 'express';
import {
  generateProvisionalCertificate,
  issueCertificate,
  getAllCertificates,
  getCertificateById,
  verifyCertificate,
  revokeCertificate,
  downloadCertificate,
  deleteCertificate,
  getStudentCertificates,
  updateCertificate,
} from '../controllers/certificateController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

// Certificate CRUD
router.get('/', getAllCertificates);
router.get('/:id', getCertificateById);
router.get('/:id/download', downloadCertificate);
router.get('/student/:studentId', getStudentCertificates);

router.post('/', authorize('admin', 'super_admin'), issueCertificate);
router.post('/provisional', authorize('admin', 'super_admin'), generateProvisionalCertificate);
router.put('/:id', authorize('admin', 'super_admin'), updateCertificate);
router.put('/:id/verify', authorize('admin', 'super_admin', 'board'), verifyCertificate);
router.put('/:id/revoke', authorize('admin', 'super_admin'), revokeCertificate);
router.delete('/:id', authorize('admin', 'super_admin'), deleteCertificate);

export default router;
