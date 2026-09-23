import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../Services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // must re-run when LanguageService's lang signal changes, not just when `key` changes
})
export class TranslatePipe implements PipeTransform {
  constructor(private languageService: LanguageService) { }

  transform(key: string): string {
    return this.languageService.translate(key);
  }
}
