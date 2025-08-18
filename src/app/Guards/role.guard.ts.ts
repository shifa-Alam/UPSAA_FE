import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';


@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const user = this.auth.getCurrentUser();

    if (!user || !expectedRoles.includes(user.role)) {
      this.router.navigate(['/unauthorized']); // optional 403 page
      return false;
    }

    return true;
  }
}
