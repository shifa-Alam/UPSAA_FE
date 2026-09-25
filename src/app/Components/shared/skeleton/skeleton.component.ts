import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'cards' | 'people' | 'photos' | 'tiles' | 'list' | 'table';

/**
 * Grey placeholder shapes of the content that is loading — instead of a spinner and
 * "Loading…". Pick the variant that looks like the page:
 *   cards  — image + title + text (events, achievements)
 *   people — round photo + name (directory, teachers, committee, donors)
 *   photos — square image tiles (gallery)
 *   tiles  — small number boxes (batches)
 *   list   — date/icon block + two lines (notices, jobs, admin lists)
 *   table  — table rows (admin tables)
 * `contained` adds the public page's container and section spacing, for pages whose
 * loading block sits outside their .upsaa-container. The label is read by screen readers.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss'
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'cards';
  @Input() count = 6;
  @Input() label = '';
  @Input() contained = false;

  get items(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, i) => i);
  }
}
