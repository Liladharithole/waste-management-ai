export interface PermissionDefinition {
  uuid: string;
  name: string;
  description: string;
}

export const PERMISSIONS: PermissionDefinition[] = [
  // users
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be001',
    name: 'users:view',
    description: 'Can view user accounts',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be002',
    name: 'users:create',
    description: 'Can create new user accounts',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be003',
    name: 'users:update',
    description: 'Can modify user accounts',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be004',
    name: 'users:delete',
    description: 'Can soft-delete user accounts',
  },

  // roles
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be005',
    name: 'roles:view',
    description: 'Can view roles',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be006',
    name: 'roles:create',
    description: 'Can create new system roles',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be007',
    name: 'roles:update',
    description: 'Can modify system roles',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be008',
    name: 'roles:delete',
    description: 'Can delete system roles',
  },

  // permissions
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be009',
    name: 'permissions:view',
    description: 'Can view system permissions',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be010',
    name: 'permissions:create',
    description: 'Can register new system permissions',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be011',
    name: 'permissions:update',
    description: 'Can modify system permissions',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be012',
    name: 'permissions:delete',
    description: 'Can remove system permissions',
  },

  // organizations
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be013',
    name: 'organizations:view',
    description: 'Can view organizations',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be014',
    name: 'organizations:create',
    description: 'Can register new organizations',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be015',
    name: 'organizations:update',
    description: 'Can update organization profiles & settings',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be016',
    name: 'organizations:delete',
    description: 'Can soft-delete organizations',
  },

  // societies
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be017',
    name: 'societies:view',
    description: 'Can view residential societies',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be018',
    name: 'societies:create',
    description: 'Can register new residential societies',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be019',
    name: 'societies:update',
    description: 'Can modify residential societies',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be020',
    name: 'societies:delete',
    description: 'Can soft-delete residential societies',
  },

  // buildings
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be021',
    name: 'buildings:view',
    description: 'Can view buildings and towers',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be022',
    name: 'buildings:create',
    description: 'Can register new buildings or towers',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be023',
    name: 'buildings:update',
    description: 'Can modify building details',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be024',
    name: 'buildings:delete',
    description: 'Can soft-delete buildings',
  },

  // floors
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be025',
    name: 'floors:view',
    description: 'Can view floors',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be026',
    name: 'floors:create',
    description: 'Can create floors in a building',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be027',
    name: 'floors:update',
    description: 'Can update floor details',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be028',
    name: 'floors:delete',
    description: 'Can soft-delete floors',
  },

  // flats
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be029',
    name: 'flats:view',
    description: 'Can view flats',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be030',
    name: 'flats:create',
    description: 'Can register new flats',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be031',
    name: 'flats:update',
    description: 'Can update flat information',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be032',
    name: 'flats:delete',
    description: 'Can soft-delete flats',
  },

  // residents
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be033',
    name: 'residents:view',
    description: 'Can view residents profiles',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be034',
    name: 'residents:create',
    description: 'Can register resident profiles',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be035',
    name: 'residents:update',
    description: 'Can update resident profiles',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be036',
    name: 'residents:delete',
    description: 'Can soft-delete resident profiles',
  },

  // employees
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be037',
    name: 'employees:view',
    description: 'Can view employee records',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be038',
    name: 'employees:create',
    description: 'Can hire and create employee records',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be039',
    name: 'employees:update',
    description: 'Can update employee records',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be040',
    name: 'employees:delete',
    description: 'Can soft-delete employee records',
  },

  // waste_categories
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be041',
    name: 'waste_categories:view',
    description: 'Can view waste categories',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be042',
    name: 'waste_categories:create',
    description: 'Can create waste categories',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be043',
    name: 'waste_categories:update',
    description: 'Can update waste categories',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be044',
    name: 'waste_categories:delete',
    description: 'Can soft-delete waste categories',
  },

  // waste_collections
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be045',
    name: 'waste_collections:view',
    description: 'Can view waste collection logs',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be046',
    name: 'waste_collections:create',
    description: 'Can log new waste collections',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be047',
    name: 'waste_collections:update',
    description: 'Can edit waste collection logs',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be048',
    name: 'waste_collections:delete',
    description: 'Can soft-delete waste collection logs',
  },

  // complaints
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be049',
    name: 'complaints:view',
    description: 'Can view system complaints',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be050',
    name: 'complaints:create',
    description: 'Can file new complaints',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be051',
    name: 'complaints:update',
    description: 'Can update complaint status',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be052',
    name: 'complaints:delete',
    description: 'Can soft-delete complaints',
  },

  // notifications
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be053',
    name: 'notifications:view',
    description: 'Can view notification logs',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be054',
    name: 'notifications:create',
    description: 'Can trigger/send notifications',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be055',
    name: 'notifications:update',
    description: 'Can modify notification configs',
  },
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be056',
    name: 'notifications:delete',
    description: 'Can soft-delete notification logs',
  },

  // dashboard
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be057',
    name: 'dashboard:view',
    description: 'Can view operational dashboard',
  },

  // reports
  {
    uuid: 'd1a63c62-1d57-4148-be2d-94c6f96be058',
    name: 'reports:view',
    description: 'Can generate and view system reports',
  },
];
