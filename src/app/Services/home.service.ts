import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Achievement } from './achievement.service';
import { EventItem } from './event.service';
import { GalleryImage } from './gallery.service';
import { PublicBatch, PublicMember } from './member.service';
import { Notice } from './notice.service';

/** GET /api/Home — everything the public homepage shows, in one response (see HomeController). */
export interface HomeData {
  batches: PublicBatch[];
  alumniTotal: number;
  events: EventItem[];
  notices: Notice[];
  achievements: Achievement[];
  achievementsTotal: number;
  /** Hero slides: the "Hero"/"প্রচ্ছদ" gallery category, else the newest photos. */
  heroPhotos: GalleryImage[];
  /** The "About" photo: the "Homepage"/"হোমপেজ" gallery category, if any. */
  aboutPhoto: GalleryImage | null;
  /** Newest photo of each gallery category, up to six. */
  memories: GalleryImage[];
  /** A few alumni with photos, for the closing "join us" band. */
  faces: PublicMember[];
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(private http: HttpClient) { }

  get(): Observable<HomeData> {
    return this.http.get<HomeData>(`${environment.baseUrl}/Home`);
  }
}
