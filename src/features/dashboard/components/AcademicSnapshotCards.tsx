'use client';

import React, { useState } from 'react';
import { AcademicSnapshotCardsProps, AcademicSourceKey } from './academic-snapshot-cards/types';
import { buildQlhtData, buildSlinkData, formatOptionalGpa } from './academic-snapshot-cards/utils';
import { AcademicSnapshotHeader } from './academic-snapshot-cards/AcademicSnapshotHeader';
import { AcademicSnapshotMetrics } from './academic-snapshot-cards/AcademicSnapshotMetrics';
import { AcademicSnapshotEmptyState } from './academic-snapshot-cards/AcademicSnapshotEmptyState';
import { AcademicSnapshotFooter } from './academic-snapshot-cards/AcademicSnapshotFooter';

export default function AcademicSnapshotCards({
  academic,
  onNavigateToGrades,
  onNavigateToExternalAccounts,
}: AcademicSnapshotCardsProps) {
  // Always display S-Link first by default
  const [selectedSource, setSelectedSource] = useState<AcademicSourceKey>('SLINK');

  const slinkData = buildSlinkData(academic);
  const qlhtData = buildQlhtData(academic);

  const activeData = selectedSource === 'SLINK' ? slinkData : qlhtData;
  const otherSource: AcademicSourceKey = selectedSource === 'SLINK' ? 'QLHT' : 'SLINK';
  const otherData = selectedSource === 'SLINK' ? qlhtData : slinkData;
  const isSlink = selectedSource === 'SLINK';
  const otherGpa4 = formatOptionalGpa(otherData.gpa4);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full transition-all">
      <div className="space-y-4">
        <AcademicSnapshotHeader
          isSlink={isSlink}
          slinkHasData={slinkData.hasData}
          qlhtHasData={qlhtData.hasData}
          activeData={activeData}
          onSelectSource={setSelectedSource}
        />

        {activeData.hasData ? (
          <AcademicSnapshotMetrics activeData={activeData} isSlink={isSlink} />
        ) : (
          <AcademicSnapshotEmptyState
            isSlink={isSlink}
            otherSource={otherSource}
            otherHasData={otherData.hasData}
            otherGpa4={otherGpa4}
            onSelectSource={setSelectedSource}
          />
        )}
      </div>

      <AcademicSnapshotFooter
        activeData={activeData}
        selectedSource={selectedSource}
        isSlink={isSlink}
        onNavigateToGrades={onNavigateToGrades}
        onNavigateToExternalAccounts={onNavigateToExternalAccounts}
      />
    </div>
  );
}
