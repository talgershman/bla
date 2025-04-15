import {Injectable} from '@angular/core';
import {Datasource, VersionDataSource} from 'deep-ui/shared/models';
import _find from 'lodash-es/find';

@Injectable({
  providedIn: 'root',
})
export class VersionDatasourceService {
  /*
    In case version is null, returns the latest data source version
   */
  getVersionDataSource(
    dataSource: Datasource,
    VersionDataSource: VersionDataSource
  ): VersionDataSource {
    if (VersionDataSource) {
      return VersionDataSource;
    }
    return this.getLatestDataSourceVersion(dataSource);
  }

  getVersionDataSourceById(dataSource: Datasource, userFacingVersion: string): VersionDataSource {
    return _find(
      dataSource.datasourceversionSet || [],
      (version: VersionDataSource) => version.userFacingVersion === userFacingVersion
    );
  }

  getLatestDataSourceVersion(dataSource: Datasource): VersionDataSource {
    return _find(dataSource.datasourceversionSet || [], (version: VersionDataSource) =>
      this.isVersionLatest(
        {latestUserVersion: dataSource.latestUserVersion},
        {userFacingVersion: version.userFacingVersion}
      )
    );
  }

  isVersionLatest(
    dataSource: Pick<Datasource, 'latestUserVersion'>,
    version: Pick<VersionDataSource, 'userFacingVersion'>
  ): boolean {
    return dataSource.latestUserVersion === version?.userFacingVersion;
  }
}
