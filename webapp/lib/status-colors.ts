// Central status -> color mapping so every page uses the same semantic colors
// (Requirement p.2: เขียว=เสร็จ/ตามแผน, เหลือง=ใกล้ครบกำหนด/ติดตาม, แดง=ล่าช้า/ไม่ผ่าน/เสี่ยง, เทา=ยังไม่ถึงช่วง)

import type { NotificationSeverity, RiskLevel } from './types';

export type StatusTone = 'green' | 'yellow' | 'red' | 'gray' | 'primary';

export const TONE_CLASSES: Record<StatusTone, { bg: string; text: string; border: string; dot: string }> = {
  green: { bg: 'bg-status-green/10', text: 'text-status-green', border: 'border-status-green/30', dot: 'bg-status-green' },
  yellow: { bg: 'bg-status-yellow/10', text: 'text-status-yellow-text', border: 'border-status-yellow/30', dot: 'bg-status-yellow' },
  red: { bg: 'bg-status-red/10', text: 'text-status-red', border: 'border-status-red/30', dot: 'bg-status-red' },
  gray: { bg: 'bg-status-gray/10', text: 'text-status-gray-text', border: 'border-status-gray/30', dot: 'bg-status-gray' },
  primary: { bg: 'bg-primary-50', text: 'text-primary', border: 'border-primary/30', dot: 'bg-primary' },
};

export function severityToTone(severity: NotificationSeverity): StatusTone {
  switch (severity) {
    case 'เขียว': return 'green';
    case 'เหลือง': return 'yellow';
    case 'แดง': return 'red';
    case 'เทา': default: return 'gray';
  }
}

export function riskLevelToTone(risk: RiskLevel): StatusTone {
  switch (risk) {
    case 'green':
    case 'graduated': return 'green';
    case 'yellow': return 'yellow';
    case 'red': return 'red';
    case 'gray': default: return 'gray';
  }
}

export function courseStatusToTone(status: string): StatusTone {
  switch (status) {
    case 'ผ่าน': return 'green';
    case 'กำลังศึกษา':
    case 'ลงทะเบียน': return 'yellow';
    case 'ไม่ผ่าน':
    case 'ถอน': return 'red';
    default: return 'gray';
  }
}

export function thesisStepStatusToTone(status: string): StatusTone {
  switch (status) {
    case 'สำเร็จ': return 'green';
    case 'กำลังดำเนินการ': return 'yellow';
    default: return 'gray';
  }
}

export function onTrackStatusToTone(status: string): StatusTone {
  switch (status) {
    case 'เป็นไปตามแผน': return 'green';
    case 'ต้องติดตาม': return 'yellow';
    case 'ล่าช้า': return 'red';
    default: return 'gray';
  }
}
