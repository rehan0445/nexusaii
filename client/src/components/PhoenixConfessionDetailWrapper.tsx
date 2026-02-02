import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ConfessionDetailPage } from './ConfessionDetailPage';

const VALID_CONFESSION_COLLEGE = 'general';

export function PhoenixConfessionDetailWrapper() {
  const { collegeId, confessionId } = useParams<{ collegeId: string; confessionId: string }>();
  const navigate = useNavigate();

  // Disable non-general campus - redirect to valid confession detail URL
  if (collegeId && collegeId !== VALID_CONFESSION_COLLEGE && confessionId) {
    return <Navigate to={`/campus/general/confessions/${confessionId}`} replace />;
  }

  if (!confessionId) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <p className="text-[#A1A1AA]">Confession not found</p>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/campus/general/confessions');
  };

  return (
    <ConfessionDetailPage
      confessionId={confessionId}
      onBack={handleBack}
      universityId={collegeId}
    />
  );
}
