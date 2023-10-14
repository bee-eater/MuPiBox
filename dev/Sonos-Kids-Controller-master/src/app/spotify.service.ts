import { Injectable } from '@angular/core';
import { Observable, defer, throwError, of, range } from 'rxjs';
import { retryWhen, flatMap, tap, delay, take, map, mergeMap, mergeAll, toArray } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { SpotifyAlbumsResponse, SpotifyAlbumsResponseItem, SpotifyArtistResponse, SpotifyArtistsAlbumsResponse, SpotifyEpisodesResponse, SpotifyShowResponse, SpotifyTrackResponseItem } from './spotify';
import { Media } from './media';

declare const require: any;

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {

  spotifyApi: any;
  refreshingToken = false;

  constructor(private http: HttpClient) {
    const SpotifyWebApi = require('../../src/app/spotify-web-api.js');
    this.spotifyApi = new SpotifyWebApi();
  }

  getMediaByQuery(query: string, category: string, index: number, shuffle: boolean, aPartOfAll: boolean, aPartOfAllMin: number, aPartOfAllMax: number, artistcover: string): Observable<Media[]> {
    const albums = defer(() => this.spotifyApi.searchAlbums(query, { limit: 1, offset: 0, market: 'DE' })).pipe(
      retryWhen(errors => {
        return this.errorHandler(errors);
      }),
      map((response: SpotifyAlbumsResponse) => response.albums.total),
      mergeMap(count => range(0, Math.ceil(count / 50))),
      mergeMap(multiplier => defer(() => this.spotifyApi.searchAlbums(query, { limit: 50, offset: 50 * multiplier, market: 'DE' })).pipe(
        retryWhen(errors => {
          return this.errorHandler(errors);
        }),
        map((response: SpotifyAlbumsResponse) => {
          return response.albums.items.map(item => {
            const media: Media = {
              id: item.id,
              artist: item.artists[0].name,
              title: item.name,
              cover: item.images[0].url,
              type: 'spotify',
              category,
              index
            };
            if(artistcover) {
              media.artistcover = artistcover;
            }
            if(shuffle) {
              media.shuffle = shuffle;
            }
            if(aPartOfAll) {
              media.aPartOfAll = aPartOfAll;
            }
            if(aPartOfAllMin) {
              media.aPartOfAllMin = aPartOfAllMin;
            }
            if(aPartOfAllMax) {
              media.aPartOfAllMax = aPartOfAllMax;
            }
            return media;
          });
        })
      )),
      mergeAll(),
      toArray()
    );

    return albums;
  }

  getMediaByArtistID(id: string, category: string, index: number, shuffle: boolean, aPartOfAll: boolean, aPartOfAllMin: number, aPartOfAllMax: number, manualArtistcover: string): Observable<Media[]> {
    const albums = defer(() => this.spotifyApi.getArtistAlbums(id, { include_groups: 'album,single,compilation', limit: 1, offset: 0, market: 'DE' })).pipe(
      retryWhen(errors => {
        return this.errorHandler(errors);
      }),
      map((response: SpotifyArtistsAlbumsResponse) => ({counter: response.total})),
      mergeMap(count => range(0, Math.ceil(count.counter / 50)).pipe(
        map((index) => ({
          range: index,
          ...count,
        }))
      )),
      mergeMap(counter => defer(() => this.spotifyApi.getArtist(id)).pipe(
        retryWhen(errors => {
          return this.errorHandler(errors);
        }),
        map((response: SpotifyArtistResponse) => ({
          range: counter.range,
          artistcover: response.images[0].url,
        }))
      )),
      mergeMap(multiplier => defer(() => this.spotifyApi.getArtistAlbums(id, { include_groups: 'album,single,compilation', limit: 50, offset: 50 * multiplier.range, market: 'DE' })).pipe(
        retryWhen(errors => {
          return this.errorHandler(errors);
        }),
        map((response: SpotifyArtistsAlbumsResponse) => {
          return response.items.map(item => {
            const media: Media = {
              id: item.id,
              artist: item.artists[0].name,
              title: item.name,
              cover: item.images[0].url,
              artistcover: multiplier.artistcover,
              type: 'spotify',
              category,
              index
            };
            if(manualArtistcover) {
              media.artistcover = manualArtistcover;
            }
            if(shuffle) {
              media.shuffle = shuffle;
            }
            if(aPartOfAll) {
              media.aPartOfAll = aPartOfAll;
            }
            if(aPartOfAllMin) {
              media.aPartOfAllMin = aPartOfAllMin;
            }
            if(aPartOfAllMax) {
              media.aPartOfAllMax = aPartOfAllMax;
            }
            return media;
          });
        })
      )),
      mergeAll(),
      toArray()
    );

    return albums;
  }

  getMediaByShowID(id: string, category: string, index: number, shuffle: boolean, aPartOfAll: boolean, aPartOfAllMin: number, aPartOfAllMax: number, manualArtistcover: string): Observable<Media[]> {
    const albums = defer(() => this.spotifyApi.getShow(id, { limit: 1, offset: 0, market: 'DE' })).pipe(
      retryWhen(errors => {
        return this.errorHandler(errors);
      }),
      map((response: SpotifyShowResponse) => ({count: response.episodes.total, name: response.name, showcover: response.images[0].url})),
      mergeMap(obj => range(0, Math.ceil(obj.count / 50)).pipe(
        map((index) => ({
          range: index,
          ...obj,
        }))
      )),
      mergeMap(multiplier => defer(() => this.spotifyApi.getShowEpisodes(id, { limit: 50, offset: 50 * multiplier.range, market: 'DE' })).pipe(
        retryWhen(errors => {
          return this.errorHandler(errors);
        }),
        map((response: SpotifyEpisodesResponse) => {
          return response.items.map(item => {
            const media: Media = {
              showid: item.id,
              artist: multiplier.name,
              title: item.name,
              cover: item.images[0].url,
              artistcover: multiplier.showcover,
              type: 'spotify',
              category,
              release_date: item.release_date,
              index
            };
            if(manualArtistcover) {
              media.artistcover = manualArtistcover;
            }
            if(shuffle) {
              media.shuffle = shuffle;
            }
            if(aPartOfAll) {
              media.aPartOfAll = aPartOfAll;
            }
            if(aPartOfAllMin) {
              media.aPartOfAllMin = aPartOfAllMin;
            }
            if(aPartOfAllMax) {
              media.aPartOfAllMax = aPartOfAllMax;
            }
            return media;
          });
        })
      )),
      mergeAll(),
      toArray()
    );
    return albums;
  }

  getMediaByID(id: string, category: string, index: number, shuffle: boolean, artistcover: string): Observable<Media> {
    const album = defer(() => this.spotifyApi.getAlbum(id, { limit: 1, offset: 0, market: 'DE' })).pipe(
      retryWhen(errors => {
        return this.errorHandler(errors);
      }),
      map((response: SpotifyAlbumsResponseItem) => {
        const media: Media = {
          id: response.id,
          artist: response.artists?.[0]?.name,
          title: response.name,
          cover: response?.images[0]?.url,
          type: 'spotify',
          category,
          index
        };
        if(artistcover) {
          media.artistcover = artistcover;
        }
        if(shuffle) {
          media.shuffle = shuffle;
        }
        return media;
      })
    );
    return album;
  }

  getMediaByPlaylistID(id: string, category: string, index: number, shuffle: boolean, artistcover: string): Observable<Media> {
    const album = defer(() => this.spotifyApi.getPlaylist(id, { limit: 1, offset: 0, market: 'DE' })).pipe(
      retryWhen(errors => {
        return this.errorHandler(errors);
      }),
      map((response: SpotifyAlbumsResponseItem) => {
        const media: Media = {
          playlistid: response.id,
          artist: response.artists?.[0]?.name,
          title: response.name,
          cover: response?.images[0]?.url,
          type: 'spotify',
          category,
          index
        };
        if(artistcover) {
          media.artistcover = artistcover;
        }
        if(shuffle) {
          media.shuffle = shuffle;
        }
        return media;
      })
    );
    return album;
  }

  getMediaByTrackID(id: string, category: string, index: number, shuffle: boolean, artistcover: string): Observable<Media> {
    const album = defer(() => this.spotifyApi.getTrack(id, { limit: 1, offset: 0, market: 'DE' })).pipe(
      retryWhen(errors => {
        return this.errorHandler(errors);
      }),
      map((response: SpotifyTrackResponseItem) => {
        const media: Media = {
          id: response.id,
          artist: response.artists?.[0]?.name,
          title: response.name,
          cover: response?.images[0]?.url,
          type: 'spotify',
          category,
          index
        };
        if(artistcover) {
          media.artistcover = artistcover;
        }
        if(shuffle) {
          media.shuffle = shuffle;
        }
        return media;
      })
    );
    return album;
  }

  // Only used for single "artist + title" entries with "type: spotify" in the database.
  // Artwork for spotify search queries are already fetched together with the initial searchAlbums request
  getAlbumArtwork(artist: string, title: string): Observable<string> {
    const artwork = defer(() => this.spotifyApi.searchAlbums('album:' + title + ' artist:' + artist, { market: 'DE' })).pipe(
      retryWhen(errors => {
        return this.errorHandler(errors);
      }),
      map((response: SpotifyAlbumsResponse) => {
        return response?.albums?.items?.[0]?.images?.[0]?.url || '';
      })
    );

    return artwork;
  }

  refreshToken() {
    const tokenUrl = (environment.production) ? '../api/token' : 'http://localhost:8200/api/token';
    this.http.get(tokenUrl, {responseType: 'text'}).subscribe(token => {
      this.spotifyApi.setAccessToken(token);
      this.refreshingToken = false;
    });
  }

  errorHandler(errors: Observable<any>) {    
    return errors.pipe(
      flatMap((error) => (error.status !== 401 && error.status !== 429) ? throwError(error) : of(error)),
      tap(_ => {
        if (!this.refreshingToken) {
          this.refreshToken();
          this.refreshingToken = true;
        }
      }),
      delay(500),
      take(10)
    );
  }
}
