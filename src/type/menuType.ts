export type Menu = 'feedback' | 'help' | 'name' | 'setting';

export type CategoryType = null | 'report' | 'suggest';

export type ToggleType = 'caption' | 'emoji' | 'handsUp' | 'screen';
export type ToggleStatusType = Record<ToggleType, boolean | 'disable'>;

export type PanelType = 'INFO' | 'USER' | 'CHAT' | 'ACTIVE' | 'HOST';
