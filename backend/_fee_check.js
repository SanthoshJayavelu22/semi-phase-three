const jwt = require('jsonwebtoken');
const axios = require('axios');
const BASE = 'http://localhost:5003/api';
const JWT_SECRET = 'my_super_secret_jwt_key';
const instToken = jwt.sign({ id: '6a9fe16eb0824edb901f871b' }, JWT_SECRET, { expiresIn: '1h' });
const sid = '6aa0072f32ad1f9bca855d26';
(async () => {
  const headers = { Authorization: `Bearer ${instToken}` };
  const fee = await axios.get(`${BASE}/academic/students/${sid}/exam-fee-applicability/1`, { headers }).catch(e => e.response ? { data: e.response.data } : e);
  console.log('FEE APPLICABILITY:', JSON.stringify(fee.data?.data || fee.data, null, 2));
  const elig = await axios.get(`${BASE}/academic/students/${sid}/eligibility?examinationNumber=1`, { headers }).catch(e => e.response ? { data: e.response.data } : e);
  console.log('ELIGIBILITY:', JSON.stringify(elig.data?.data || elig.data, null, 2));
})();