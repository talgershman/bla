import {AccountInfo} from '@azure/msal-browser';

import {setActiveUserFromApp} from '../actions/user.actions';
import {initialState, reducer} from './session.reducer';

describe('Session Reducer', () => {
  describe('Set User', () => {
    it('user admin ', () => {
      const accountInfo: AccountInfo = {
        'homeAccountId':
          'f9dcae9b-3411-416b-82c1-3a19d4c36cc9.4f85ba13-6953-46a6-9c5b-7599fd80e9aa',
        'environment': 'login.windows.net',
        'tenantId': '4f85ba13-6953-46a6-9c5b-7599fd80e9aa',
        'username': 'moshe@mobileye.com',
        'localAccountId': 'f9dcae9b-3411-416b-82c1-3a19d4c36cc9',
        'name': 'Moshe Israel',
        'idTokenClaims': {
          'aud': '88a58531-ac28-4480-ad2a-42c5db93e2ef',
          'iss': 'https://login.microsoftonline.com/4f85ba13-6953-46a6-9c5b-7599fd80e9aa/v2.0',
          'iat': 1664350261,
          'nbf': 1664350261,
          'exp': 1664354161,
          'aio':
            'AWQAm/8TAAAAcOinacqeMTUg4q+E4N1oC1Iyu6JnHBo2EJCmlXvtzf6ftt3u6eILrYW+Fwgcn1/TWrNP8AFBxQI1vqEeFKv8LhfsgFqSHtKnqYdw+J6j3mBY2pQ/KGA2iRpOj8DFF8zc',
          'groups': [
            'Employee Type Mobileye',
            'cloud-onelogin-users',
            'src',
            'test-gitlab-users1',
            'vault_deep-ro',
            'confluence-users',
            'Employees',
            'ME-ISR-PTK1',
            'BI-Users',
            'qa',
            'OneDrive Known Folders',
            'MFA_Enabled',
            'psw',
            'deep-fpa-objects-server-remove',
            'deep-fpa-objects-server',
            'deep-fpa-objects',
            'deep-admin',
            'gitlab-users',
            'HostCheckerGroup',
            'gitlab-internal-users',
            'jira-users',
            'test-gitlab-users2',
          ],
          'name': 'Moshe Israel',
          'nonce': '1aed7449-ebe7-470f-9dce-63caba3c6358',
          'oid': 'f9dcae9b-3411-416b-82c1-3a19d4c36cc9',
          'preferred_username': 'moshe@mobileye.com',
          'rh': '0.AQkAE7qFT1NppkacW3WZ_YDpqjGFpYgorIBErSpCxduT4u8JAEM.',
          'sub': 'GF_N2ipxbJ0DmwY8YPPrYK7b_BbWCUsbFTebsNTYbKY',
          'tid': '4f85ba13-6953-46a6-9c5b-7599fd80e9aa',
          'uti': 'uhS7y5WfxE-10PLSBytNAA',
          'ver': '2.0',
        },
      };
      const action = setActiveUserFromApp({activeAccount: accountInfo});

      const result = reducer(initialState, action);

      expect(result).toEqual(
        jasmine.objectContaining({
          isAdmin: true,
          user: {
            userName: 'moshe@mobileye.com',
            name: 'Moshe Israel',
          },
          rawTeams: [
            'deep-admin',
            'deep-fpa-objects',
            'deep-fpa-objects-server',
            'deep-fpa-objects-server-remove',
          ],
          teams: ['deep-admin', 'deep-fpa-objects', 'deep-fpa-objects-server'],
        })
      );
    });

    it('regular user', () => {
      const accountInfo: AccountInfo = {
        'homeAccountId':
          'f9dcae9b-3411-416b-82c1-3a19d4c36cc9.4f85ba13-6953-46a6-9c5b-7599fd80e9aa',
        'environment': 'login.windows.net',
        'tenantId': '4f85ba13-6953-46a6-9c5b-7599fd80e9aa',
        'username': 'moshe@mobileye.com',
        'localAccountId': 'f9dcae9b-3411-416b-82c1-3a19d4c36cc9',
        'name': 'Moshe Israel',
        'idTokenClaims': {
          'aud': '88a58531-ac28-4480-ad2a-42c5db93e2ef',
          'iss': 'https://login.microsoftonline.com/4f85ba13-6953-46a6-9c5b-7599fd80e9aa/v2.0',
          'iat': 1664350261,
          'nbf': 1664350261,
          'exp': 1664354161,
          'aio':
            'AWQAm/8TAAAAcOinacqeMTUg4q+E4N1oC1Iyu6JnHBo2EJCmlXvtzf6ftt3u6eILrYW+Fwgcn1/TWrNP8AFBxQI1vqEeFKv8LhfsgFqSHtKnqYdw+J6j3mBY2pQ/KGA2iRpOj8DFF8zc',
          'groups': [
            'Employee Type Mobileye',
            'cloud-onelogin-users',
            'src',
            'test-gitlab-users1',
            'vault_deep-ro',
            'confluence-users',
            'Employees',
            'ME-ISR-PTK1',
            'BI-Users',
            'qa',
            'OneDrive Known Folders',
            'MFA_Enabled',
            'psw',
            'deep-fpa-objects',
            'gitlab-users',
            'HostCheckerGroup',
            'gitlab-internal-users',
            'jira-users',
            'test-gitlab-users2',
          ],
          'name': 'Moshe Israel',
          'nonce': '1aed7449-ebe7-470f-9dce-63caba3c6358',
          'oid': 'f9dcae9b-3411-416b-82c1-3a19d4c36cc9',
          'preferred_username': 'moshe@mobileye.com',
          'rh': '0.AQkAE7qFT1NppkacW3WZ_YDpqjGFpYgorIBErSpCxduT4u8JAEM.',
          'sub': 'GF_N2ipxbJ0DmwY8YPPrYK7b_BbWCUsbFTebsNTYbKY',
          'tid': '4f85ba13-6953-46a6-9c5b-7599fd80e9aa',
          'uti': 'uhS7y5WfxE-10PLSBytNAA',
          'ver': '2.0',
        },
      };
      const action = setActiveUserFromApp({activeAccount: accountInfo});

      const result = reducer(initialState, action);

      expect(result).toEqual(
        jasmine.objectContaining({
          isAdmin: false,
          user: {
            userName: 'moshe@mobileye.com',
            name: 'Moshe Israel',
          },
          rawTeams: ['deep-fpa-objects'],
          teams: ['deep-fpa-objects'],
        })
      );
    });
  });
});
