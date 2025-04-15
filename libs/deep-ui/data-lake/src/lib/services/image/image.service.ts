import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ignoreHttpErrorResponse} from '@mobileye/material/src/lib/http/http-error';
import {UrlBuilderService} from 'deep-ui/shared/core';
import {ImageServiceRenderedImageRequest} from 'deep-ui/shared/models';
import _find from 'lodash-es/find';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

export interface ImageServiceSequenceItem {
  src: string;
  info: {
    gfi: number;
    frame_id: number;
  };
}

export interface ImageServiceSequenceItemWithRequestObj extends ImageServiceSequenceItem {
  request: {
    clip: string;
  };
}

export interface ImageServiceSequenceResponse {
  items: Array<ImageServiceSequenceItem>;
}

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private http = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);

  getHealthCheck(): Observable<any> {
    const url = this.urlBuilder.imageServiceBuilderApiBuilder('healthz');
    return this.http.get<any>(url);
  }

  getImageSequenceItem(
    req: ImageServiceRenderedImageRequest,
  ): Observable<Partial<ImageServiceSequenceItemWithRequestObj>> {
    const {clip, exposure, camera, pyramid, pyramid_level} = req;
    const url = this.urlBuilder.join(
      this.urlBuilder.imageServiceBuilderApiBuilder(`v1/api/clips/${clip}/sequence.json`),
      {exposure, camera, pyramid, pyramid_level},
    );

    return this.http
      .get<ImageServiceSequenceResponse>(url, {
        context: ignoreHttpErrorResponse(),
      })
      .pipe(
        catchError(() => of(null)),
        map((response: ImageServiceSequenceResponse) => {
          if (response === null) {
            return {
              request: {
                clip,
              },
            };
          }
          if (!response?.items?.length) {
            return {
              request: {
                clip,
              },
            };
          }
          const foundClip = _find(response.items, (item: ImageServiceSequenceItem) => {
            if (req.gfi) {
              return item?.info?.gfi === req.gfi;
            } else if (req.frame_id) {
              return item.info.frame_id === req.frame_id;
            }
            return false;
          }) as ImageServiceSequenceItem;
          if (!foundClip) {
            return {
              request: {
                clip,
              },
            };
          }
          return {
            ...foundClip,
            request: {
              clip,
            },
          };
        }),
      );
  }
}
