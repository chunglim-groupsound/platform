'use client';
import React from 'react';
import { useParams, notFound } from 'next/navigation';
import {
  RecruitSettings,
  InterviewSchedule,
  ApplicantManager,
  TeamActivationManager,
  TimetableSettings,
} from '@/components/app-internals';
import { MemberAdmin as MA } from '@/components/member-admin';
import { NoticesModule } from '@/components/board';
import { ReportModule } from '@/components/report';

const SECTIONS: Record<string, React.ComponentType> = {
  recruit:    RecruitSettings,
  interview:  InterviewSchedule,
  applicants: ApplicantManager,
  teams:      TeamActivationManager,
  timetable:  TimetableSettings,
  members:    MA.MemberAdminScreen,
  migrate:    MA.MemberMigration,
  notices:    NoticesModule.NoticesAdminSection,
  reports:    ReportModule.ReportAdminSection,
};

export default function AdminSectionPage() {
  const params = useParams();
  const section = Array.isArray(params.section) ? params.section[0] : params.section;
  const Component = section ? SECTIONS[section] : undefined;
  if (!Component) return notFound();
  return <Component />;
}
