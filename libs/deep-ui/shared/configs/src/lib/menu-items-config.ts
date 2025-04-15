import {MeUser} from '@mobileye/material/src/lib/common';
import {MeAvatarItem} from '@mobileye/material/src/lib/components/avatar';
import {MenuItem} from '@mobileye/material/src/lib/components/sidenav';
import {environment} from 'deep-ui/shared/environments';

export const TEAMS_CHANNEL_URL =
  'https://teams.microsoft.com/l/team/19%3a71fbda90418b4769b191c9e0305cc4f6%40thread.tacv2/conversations?groupId=3d2e5be3-05f8-494f-9782-09e67cb305de&tenantId=4f85ba13-6953-46a6-9c5b-7599fd80e9aa';

export const linkItems = [
  {
    label: 'Teams Channel',
    href: TEAMS_CHANNEL_URL,
  },
  {
    label: 'Docs',
    href: 'https://deep.mobileye.com/docs/',
  },
];

export const getUserMenuItems = (user: MeUser, isAdmin: boolean, options: any): MeAvatarItem[] => {
  const userTeams: MeAvatarItem[] = [];
  (options.userTeams || []).forEach((team: string) => {
    userTeams.push({
      title: team,
      type: 'sub-header',
    });
  });
  const newAdminNodes: Array<MeAvatarItem> = isAdmin
    ? [
        {
          type: 'separator',
        },
        {
          type: 'button',
          title: 'JSON Fiddle',
          action: options.goToJsonFiddleRoute,
        },
      ]
    : [];
  return [
    {
      type: 'profile',
      user,
    },
    {
      type: 'separator',
    },
    {type: 'button', action: options.deepTeamDialog, title: 'Assign user to a DEEP team'},
    ...newAdminNodes,
    {
      type: 'separator',
    },
    {
      type: 'header',
      title: 'My Teams',
    },
    ...userTeams,
    {
      type: 'button',
      action: options.logout,
      title: 'Logout',
    },
  ];
};

export const menuItems: MenuItem[] = [
  {
    title: 'Jobs',
    route: '/jobs',
    icon: 'work',
  },
  {
    isSeparator: true,
    title: 'Catalogs',
  },
  {
    title: 'MEST CMDs',
    route: '/manage/mests',
    icon: 'wysiwyg',
  },
  {
    title: 'Clip Lists',
    route: '/manage/clip-lists',
    icon: 'videocam',
  },
  {
    title: 'Parsing Configurations',
    route: '/manage/parsing-configurations',
    icon: 'text_snippet',
  },
  {
    title: 'ETLs',
    route: '/manage/etls',
    icon: 'account_tree',
  },
  {
    isSeparator: true,
    title: 'Data Lake',
  },
  {
    title: 'Query',
    route: '/data-lake/query',
    icon: 'search',
    isDisabled: environment.disableDatasetRoutes,
  },
  {
    title: 'Datasets',
    route: '/data-lake/datasets',
    icon: 'perm_media',
    isDisabled: environment.disableDatasetRoutes,
  },
  {
    title: 'Data Sources',
    route: '/data-lake/data-sources',
    icon: 'storage',
  },
  {
    title: 'Perfect Lists',
    route: '/data-lake/perfect-lists',
    icon: 'fact_check',
  },
];
