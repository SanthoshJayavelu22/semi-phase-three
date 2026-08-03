

const ResultsDisplay = ({ data, onBack }) => {
  const { student, results } = data;
  
  // We take the first result object, since it represents the most recent or requested semester
  const result = results[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans p-4 md:p-8">
      
      <div className="max-w-5xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Search
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
            {student.institute?.orgName || 'Medical College'}
          </h1>
          <p className="text-lg text-gray-700">
            {result.semester}nd Semester Exam Results {result.academicYear}
          </p>
        </div>

        {/* Student Info */}
        <div className="mb-10 max-w-lg">
          <div className="grid grid-cols-[100px_1fr] gap-4 mb-3">
            <div className="text-gray-600 font-medium">Name</div>
            <div className="font-semibold text-gray-900">: &nbsp; Dr.{student.firstName} {student.lastName}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-4 mb-3">
            <div className="text-gray-600 font-medium">Student ID</div>
            <div className="font-semibold text-gray-900">: &nbsp; {student.enrollmentId}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div className="text-gray-600 font-medium">Branch</div>
            <div className="font-semibold text-gray-900">: &nbsp; {student.batch?.name || 'N/A'} {student.batch?.year ? `(${student.batch.year})` : ''}</div>
          </div>
        </div>

        {/* Results Table or Unpublished Message */}
        {!result.isPublished ? (
          <div className="mb-10 p-8 border border-yellow-200 bg-yellow-50 rounded-xl text-center">
            <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Results Not Yet Published</h3>
            <p className="text-yellow-700">
              Your exam result for this semester is currently being processed and will be published {result.publishedDate ? `on ${new Date(result.publishedDate).toLocaleDateString()}` : 'soon'}.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-10 border border-gray-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="py-4 px-6 font-medium text-blue-600 border-b border-r border-gray-200 w-16 text-center">Sem</th>
                <th className="py-4 px-6 font-medium text-blue-600 border-b border-r border-gray-200 w-24 text-center">Sub-code</th>
                <th className="py-4 px-6 font-medium text-blue-600 border-b border-r border-gray-200">Subject Name</th>
                <th className="py-4 px-4 font-medium text-blue-600 border-b border-r border-gray-200 w-16 text-center" title="Internal Marks">Int</th>
                <th className="py-4 px-4 font-medium text-blue-600 border-b border-r border-gray-200 w-16 text-center" title="External Marks">Ext</th>
                <th className="py-4 px-4 font-medium text-blue-600 border-b border-r border-gray-200 w-16 text-center" title="Total Marks">Tot</th>
                <th className="py-4 px-6 font-medium text-blue-600 border-b border-r border-gray-200 w-20 text-center">Grade</th>
                <th className="py-4 px-6 font-medium text-blue-600 border-b border-gray-200 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.subjects.map((subject, index) => {
                 const isPass = subject.grade !== 'F' && subject.grade !== 'RA' && subject.grade !== 'ABSENT';
                 return (
                  <tr key={index} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 border-b border-r border-gray-200 text-center text-gray-800">{result.semester}</td>
                    <td className="py-4 px-6 border-b border-r border-gray-200 text-center text-gray-800">{subject.subjectCode}</td>
                    <td className="py-4 px-6 border-b border-r border-gray-200 text-gray-800">{subject.subjectName}</td>
                    <td className="py-4 px-4 border-b border-r border-gray-200 text-center text-gray-800">{subject.internalMarks ?? '-'}</td>
                    <td className="py-4 px-4 border-b border-r border-gray-200 text-center text-gray-800">{subject.externalMarks ?? '-'}</td>
                    <td className="py-4 px-4 border-b border-r border-gray-200 text-center text-gray-900 font-medium">{subject.totalMarks ?? '-'}</td>
                    <td className="py-4 px-6 border-b border-r border-gray-200 text-center font-medium text-gray-900">{subject.grade}</td>
                    <td className={`py-4 px-6 border-b border-gray-200 text-center font-medium ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                      {isPass ? 'Pass' : 'Fail'}
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mb-10 text-sm">
          <div className="flex gap-4 mb-2">
            <span className="text-red-700 font-medium w-8">RA</span>
            <span className="text-gray-700">- Re-Appear</span>
          </div>
          <div className="flex gap-4">
            <span className="text-red-700 font-medium w-8">WH</span>
            <span className="text-gray-700">- Withheld due to non-Payment of exam fees / Non Submission of Progress Norms</span>
          </div>
        </div>

        {/* Grading Scale */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-r border-gray-200">Marks</th>
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-r border-gray-200">90-100</th>
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-r border-gray-200">80-89</th>
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-r border-gray-200">70-79</th>
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-r border-gray-200">60-69</th>
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-r border-gray-200">55-59</th>
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-r border-gray-200">50-54</th>
                <th className="py-4 px-4 font-medium text-gray-700 border-b border-gray-200">0-49</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="py-4 px-4 border-b border-r border-gray-200 font-medium text-gray-700">Grade</td>
                <td className="py-4 px-4 border-b border-r border-gray-200 text-gray-800">O</td>
                <td className="py-4 px-4 border-b border-r border-gray-200 text-gray-800">A+</td>
                <td className="py-4 px-4 border-b border-r border-gray-200 text-gray-800">A</td>
                <td className="py-4 px-4 border-b border-r border-gray-200 text-gray-800">B+</td>
                <td className="py-4 px-4 border-b border-r border-gray-200 text-gray-800">B</td>
                <td className="py-4 px-4 border-b border-r border-gray-200 text-gray-800">C</td>
                <td className="py-4 px-4 border-b border-gray-200 text-gray-800">RA</td>
              </tr>
              <tr className="bg-white">
                <td className="py-4 px-4 border-r border-gray-200 font-medium text-gray-700">Point</td>
                <td className="py-4 px-4 border-r border-gray-200 text-gray-800">10</td>
                <td className="py-4 px-4 border-r border-gray-200 text-gray-800">9</td>
                <td className="py-4 px-4 border-r border-gray-200 text-gray-800">8</td>
                <td className="py-4 px-4 border-r border-gray-200 text-gray-800">7</td>
                <td className="py-4 px-4 border-r border-gray-200 text-gray-800">6</td>
                <td className="py-4 px-4 border-r border-gray-200 text-gray-800">5</td>
                <td className="py-4 px-4 border-gray-200 text-gray-800">0</td>
              </tr>
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
