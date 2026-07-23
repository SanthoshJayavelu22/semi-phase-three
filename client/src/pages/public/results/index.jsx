import React, { useState } from 'react';
import axios from 'axios';
import ResultsLogin from './components/ResultsLogin';
import ResultsDisplay from './components/ResultsDisplay';

const ResultsPortal = () => {
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (enrollmentId, dob) => {
    setIsLoading(true);
    setError('');
    try {
      // Create backend API URL
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api';
      
      const response = await axios.get(`${API_URL}/results/student/${enrollmentId}`, {
        params: {
          dateOfBirth: dob
        }
      });
      
      if (response.data && response.data.data) {
        setResultData(response.data.data);
      } else {
        setError('Unexpected response format from server.');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to fetch results. Please check your Student ID and Date of Birth.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setResultData(null);
    setError('');
  };

  if (resultData) {
    return <ResultsDisplay data={resultData} onBack={handleBack} />;
  }

  return (
    <ResultsLogin 
      onSearch={handleSearch} 
      isLoading={isLoading} 
      error={error} 
    />
  );
};

export default ResultsPortal;
