import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AppConfigGroup = 'email' | 'sms' | 'general';

/** One system setting kept in the database (SuperAdmin only). Secrets never come back — only a masked hint. */
export interface AppConfigItem {
  key: string;
  group: AppConfigGroup;
  kind: 'text' | 'number' | 'bool' | 'url' | 'email' | 'emails' | 'secret';
  isSecret: boolean;
  value: string | null;
  hasValue: boolean;
  masked: string | null;
  /** db = saved from Settings; file = from the server config file; none = not set;
   *  unreadable = a secret saved on another machine that this server can't decrypt. */
  source: 'db' | 'file' | 'none' | 'unreadable';
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private url = environment.baseUrl + '/AppConfig';

  constructor(private http: HttpClient) { }

  get(group?: AppConfigGroup): Observable<AppConfigItem[]> {
    return this.http.get<AppConfigItem[]>(this.url, { params: group ? { group } : {} });
  }

  /** values: key → new value (a blank secret keeps the saved one); reset: keys to hand back to the config file. */
  save(values: Record<string, string>, reset: string[] = []): Observable<AppConfigItem[]> {
    return this.http.put<AppConfigItem[]>(this.url, { values, reset });
  }
}
