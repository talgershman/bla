import {inject, Injectable} from '@angular/core';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {EtlJobService} from 'deep-ui/shared/core';
import {Datasource, ETL} from 'deep-ui/shared/models';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class RunConfigStepService {
  private etlJobService = inject(EtlJobService);

  generateDataSourceOptions(dataSource: Datasource): Array<MeSelectOption> {
    if (!dataSource.versioned || !dataSource.datasourceversionSet?.length) {
      return [];
    }
    const arr: Array<MeSelectOption> = [];
    try {
      for (const version of dataSource.datasourceversionSet) {
        if (version.status === 'active') {
          const item: MeSelectOption = {
            id: version.id.toString(),
            value: version.userFacingVersion,
            entity: version,
          };
          arr.push(item);
        }
      }
      const latestVersion: MeSelectOption = {
        id: 'latest',
        value: 'Latest',
        entity: arr[0],
        isDisabled: dataSource.status === 'updating',
        tooltip:
          dataSource.status === 'updating'
            ? 'Data source is being updated, Please try again later'
            : '',
      };
      arr.unshift(latestVersion);
      return arr;
      // eslint-disable-next-line
    } catch (e) {
      return [];
    }
  }

  getPreviewOutputPath(etl: ETL, originalTeam: string, outputPath: string): string {
    if (!originalTeam || !etl) {
      return '';
    }
    const outputPathStr = outputPath || '&lt;output_path&gt;';
    const {department, team} = this._getOutputPathFromTeam(originalTeam);
    const serviceName = this._getOutputPathEtlName(etl);
    return `<span>Your ETL results will be saved at:</span><br><span>s3://mobileye-deep.bi-reports.prod1/${department}/${team}/${etl.name}/${serviceName}/&lt;classifier name from the ETL code&gt;/<b>${outputPathStr}</b>/&lt;job_uuid&gt;</span>`;
  }

  getOutputPathSuggestions(
    etl: ETL,
    team: string,
  ): Observable<Array<{value: string; label: string}>> {
    if (!etl || !team) {
      return of([]);
    }
    return this.etlJobService.getLastOutputPath(etl.name, team).pipe(
      map((response: {path: string}) => {
        return this._generateSuggestionsOptions(response.path);
      }),
    );
  }

  private _getOutputPathFromTeam(deepGroup: string): {department: string; team: string} {
    let department = '';
    let team = '';
    const organizationDetails = deepGroup.split('-', 3).slice(1);
    if (organizationDetails.length === 2) {
      [department, team] = organizationDetails;
    } else if (organizationDetails.length === 1) {
      department = 'deep';
      team = organizationDetails[0];
    } else {
      department = 'deep';
      team = 'general';
    }
    return {department, team};
  }

  private _getOutputPathEtlName(etl: ETL): string {
    const etlServicesKeys = Object.keys(etl.services);
    let serviceName = etl.services[etlServicesKeys[0]].name;
    etlServicesKeys.forEach((serviceId) => {
      const service = etl.services[serviceId];
      if (service.type.includes('logic')) {
        serviceName = service.name;
      }
    });
    return serviceName;
  }

  private _generateSuggestionsOptions(
    lastOutputPath: string,
  ): Array<{value: string; label: string}> {
    const regex = /^(.*?)(\d+)\.(\d+)\.(\d+)$/;
    const regexVersionNumber = new RegExp(regex);
    if (!lastOutputPath) {
      return [{value: '1.0.0', label: 'Versioned: 1.0.0'}];
    } else if (regexVersionNumber.test(lastOutputPath)) {
      const major = this._bumpVersion(lastOutputPath, 'major');
      const minor = this._bumpVersion(lastOutputPath, 'minor');
      const patch = this._bumpVersion(lastOutputPath, 'patch');
      return [
        {
          value: lastOutputPath,
          label: `Previous: ${lastOutputPath}`,
        },
        {
          value: major,
          label: `Major: ${major}`,
        },
        {
          value: minor,
          label: `Minor: ${minor}`,
        },
        {
          value: patch,
          label: `Patch: ${patch}`,
        },
      ];
    } else {
      return [
        {
          value: lastOutputPath,
          label: `Previous: ${lastOutputPath}`,
        },
        {
          value: `${this._getFormattedPrefix(lastOutputPath)}1.0.0`,
          label: `Versioned: ${this._getFormattedPrefix(lastOutputPath)}1.0.0`,
        },
        {
          value: `1.0.0`,
          label: `Versioned short: 1.0.0`,
        },
      ];
    }
  }

  private _bumpVersion(version: string, bumpType: 'major' | 'minor' | 'patch'): string {
    const regex = /^(.*?)(\d+)\.(\d+)\.(\d+)$/;
    const match = version.match(regex);

    const [, prefix, majorStr, minorStr, patchStr] = match;

    const major = parseInt(majorStr);
    const minor = parseInt(minorStr);
    const patch = parseInt(patchStr);

    let newMajor = major;
    let newMinor = minor;
    let newPatch = patch;

    switch (bumpType) {
      case 'major':
        newMajor++;
        newMinor = 0;
        newPatch = 0;
        break;
      case 'minor':
        newMinor++;
        newPatch = 0;
        break;
      case 'patch':
        newPatch++;
        break;
      default:
        throw new Error('Invalid bump type');
    }

    const formattedPrefix = this._getFormattedPrefix(prefix);

    return `${formattedPrefix}${newMajor}.${newMinor}.${newPatch}`;
  }

  private _getFormattedPrefix(prefix: string): string {
    return prefix ? (prefix.endsWith('_') || prefix.endsWith('-') ? prefix : `${prefix}_`) : '';
  }
}
