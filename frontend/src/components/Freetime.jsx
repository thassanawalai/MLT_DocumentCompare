import React from 'react';

const Freetime = () => {
  return (
    <div style={{ padding: '24px', fontFamily: "'Sarabun', sans-serif" }}>
      <h2 style={{ color: '#1e293b', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
        Port Freetime Directory
      </h2>
      <p style={{ color: '#64748b', marginTop: '12px' }}>
        Search and manage freetime conditions for shipping lines and ports here.
      </p>
      {/* 
        You can build the search bar and data table here 
        similar to how HSCodeSearch is built.
      */}
    </div>
  );
};

export default Freetime;